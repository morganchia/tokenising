// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract ERC20TokenRepo {
    address public owner;
    uint256 public tradeCount;
    uint256 public endDate; // Timestamp after which most functions are disabled
    bool public paused; // Contract pause state
    mapping(address => bool) public admins; // Mapping of admin addresses

    enum RepoType { Repo, ReverseRepo } // Repo: borrow cash, lend bonds; ReverseRepo: lend cash, borrow bonds
    enum Status { Pending, Started, Matured, Cancelled }

    struct Trade {
        uint256 tradeId;
        uint256 startDateTime;
        uint256 maturityDateTime;
        string bondIsin;
        RepoType counterparty1RepoType; // Repo: borrow cash, lend bonds; ReverseRepo: lend cash, borrow bonds
        uint256 nominal; // Bond token amount
        uint256 cleanPrice;
        uint256 dirtyPrice;
        uint256 haircut;
        uint256 startAmount; // Cash token amount at start
        string currency;
        uint256 dayCountConvention;
        uint256 repoRate;
        uint256 interestAmount; // Interest added to cash at maturity
        uint256 cashAmount;
        uint256 bondAmount;
        address counterparty1;
        address counterparty2;
        address cashToken;
        address bondToken;
        Status status;
    }

    mapping(uint256 => Trade) public trades;

    event TradeCreated(uint256 indexed tradeId, address indexed counterparty1, address indexed counterparty2);
    event TradeStarted(uint256 indexed tradeId);
    event TradeMatured(uint256 indexed tradeId);
    event TradeCancelled(uint256 indexed tradeId);
    event TradeFailed(uint256 indexed tradeId, string reason);
    event EndDateUpdated(uint256 newEndDate);
    event Paused(bool isPaused);
    event AdminUpdated(address indexed admin, bool isAdded);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAdminOrOwner() {
        require(msg.sender == owner || admins[msg.sender], "Only owner or admin can call this function");
        _;
    }

    modifier notAfterEndDate() {
        require(endDate == 0 || block.timestamp <= endDate, "Contract has ended");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier withinStartWindow(uint256 tradeId) {
        Trade memory trade = trades[tradeId];
        require(trade.status == Status.Pending, "Trade not pending");
        require(block.timestamp >= trade.startDateTime, "Too early for start");
        require(block.timestamp <= trade.startDateTime + 72 hours, "Start window expired");
        _;
    }

    modifier withinMaturityWindow(uint256 tradeId) {
        Trade memory trade = trades[tradeId];
        require(trade.status == Status.Started, "Trade not started");
        require(block.timestamp >= trade.maturityDateTime, "Too early for maturity");
        require(block.timestamp <= trade.maturityDateTime + 72 hours, "Maturity window expired");
        _;
    }

    constructor() {
        owner = msg.sender;
        tradeCount = 0;
        paused = false;
        endDate = 0; // No end date by default
        admins[msg.sender] = true; // Owner is an admin by default
    }

    // Set the contract end date, after which most functions are disabled
    function setEndDate(uint256 _newEndDate) public onlyAdminOrOwner {
        require(_newEndDate == 0 || _newEndDate > block.timestamp, "End date must be in the future or 0 to unset");
        endDate = _newEndDate;
        emit EndDateUpdated(_newEndDate);
    }

    // Pause or unpause the contract, affecting startTrade, matureTrade, and cancelTrade
    function pauseUnpause(bool _pause) public onlyAdminOrOwner {
        paused = _pause;
        emit Paused(_pause);
    }

    // Add or remove an admin, restricted to owner
    function manageAdmins(address _admin, bool _add) public onlyOwner {
        require(_admin != address(0), "Invalid admin address");
        admins[_admin] = _add;
        emit AdminUpdated(_admin, _add);
    }

    function createTrade(
        uint256 _startDateTime,
        uint256 _maturityDateTime,
        string memory _bondIsin,
        uint8 _counterparty1RepoType,
        uint256 _nominal,
        uint256 _cleanPrice,
        uint256 _dirtyPrice,
        uint256 _haircut,
        uint256 _startAmount,
        string memory _currency,
        uint8 _dayCountConvention,
        uint256 _repoRate,
        uint256 _interestAmount,
        address _counterparty1,
        address _counterparty2,
        address _cashToken,
        address _bondToken,
        uint256 _cashAmount,
        uint256 _bondAmount
    ) public onlyAdminOrOwner notAfterEndDate returns (uint256) {
        require(_startDateTime <= _maturityDateTime, "Start must be before maturity");
        require(_counterparty1 != address(0) && _counterparty2 != address(0), "Invalid counterparty addresses");
        require(_cashToken != address(0) && _bondToken != address(0), "Invalid token addresses");
        require(_nominal > 0 && _startAmount > 0, "Amounts must be positive");

        tradeCount++;
        trades[tradeCount] = Trade(
            tradeCount,
            _startDateTime,
            _maturityDateTime,
            _bondIsin,
            RepoType(_counterparty1RepoType),
            _nominal,
            _cleanPrice,
            _dirtyPrice,
            _haircut,
            _startAmount,
            _currency,
            _dayCountConvention,
            _repoRate,
            _interestAmount,
            _cashAmount,
            _bondAmount,
            _counterparty1,
            _counterparty2,
            _cashToken,
            _bondToken,
            Status.Pending
        );

        emit TradeCreated(tradeCount, _counterparty1, _counterparty2);
        return tradeCount;
    }

    function startTrade(uint256 _tradeId) public onlyAdminOrOwner notAfterEndDate whenNotPaused withinStartWindow(_tradeId) {
        Trade storage trade = trades[_tradeId];
        require(trade.counterparty1 != address(0), "Trade does not exist");

        // For Repo (Counterparty1 borrows cash, lends bonds)
        address cashSender = trade.counterparty1RepoType == RepoType.Repo ? trade.counterparty2 : trade.counterparty1;
        address bondSender = trade.counterparty1RepoType == RepoType.Repo ? trade.counterparty1 : trade.counterparty2;
        address cashReceiver = bondSender;
        address bondReceiver = cashSender;

        // Check allowances
        require(
            IERC20(trade.cashToken).allowance(cashSender, address(this)) >= trade.startAmount,
            "Insufficient cash token allowance from cash sender"
        );
        require(
            IERC20(trade.bondToken).allowance(bondSender, address(this)) >= trade.nominal,
            "Insufficient bond token allowance from bond sender"
        );

        // Check balances
        require(IERC20(trade.cashToken).balanceOf(cashSender) >= trade.startAmount, "Insufficient cash balance");
        require(IERC20(trade.bondToken).balanceOf(bondSender) >= trade.nominal, "Insufficient bond balance");

        bool successCashPull = IERC20(trade.cashToken).transferFrom(cashSender, address(this), trade.startAmount);
        bool successBondPull = IERC20(trade.bondToken).transferFrom(bondSender, address(this), trade.nominal);

        if (successCashPull && successBondPull) { // both cash and bond pull success
            bool successCashPush = IERC20(trade.cashToken).transfer(cashReceiver, trade.startAmount);
            bool successBondPush = IERC20(trade.bondToken).transfer(bondReceiver, trade.nominal);

            if (successCashPush && successBondPush) {
                trade.status = Status.Started;
                emit TradeStarted(_tradeId);
            } else { // either push failed
                emit TradeFailed(_tradeId, "Final transfer failed");
                if (!successBondPush) IERC20(trade.cashToken).transfer(cashSender, trade.startAmount); // send back cash if bond transfer failed, dont need to care about bond since failed
                if (!successCashPush) IERC20(trade.bondToken).transfer(bondSender, trade.nominal); // send back bond if cash transfer failed, dont need to care about cash since failed
            }
        } else {
            emit TradeFailed(_tradeId, "Initial transfer failed");
            if (!successBondPull) IERC20(trade.cashToken).transfer(cashSender, trade.startAmount); // send back cash if bond pull failed, dont need to care about bond since failed
            if (!successCashPull) IERC20(trade.bondToken).transfer(bondSender, trade.nominal); // send back bond if cash pull failed, dont need to care about cash since failed
        }
    }

    function matureTrade(uint256 _tradeId) public onlyAdminOrOwner notAfterEndDate whenNotPaused withinMaturityWindow(_tradeId) {
        Trade storage trade = trades[_tradeId];
        require(trade.counterparty1 != address(0), "Trade does not exist");

        // For Repo (Counterparty1 returns cash + interest, Counterparty2 returns bonds)
        address cashSender = trade.counterparty1RepoType == RepoType.Repo ? trade.counterparty1 : trade.counterparty2;
        address bondSender = trade.counterparty1RepoType == RepoType.Repo ? trade.counterparty2 : trade.counterparty1;
        address cashReceiver = bondSender;
        address bondReceiver = cashSender;

        uint256 cashAmount = trade.startAmount + trade.interestAmount;

        // Check allowances
        require(
            IERC20(trade.cashToken).allowance(cashSender, address(this)) >= cashAmount,
            "Insufficient cash token allowance from cash sender"
        );
        require(
            IERC20(trade.bondToken).allowance(bondSender, address(this)) >= trade.nominal,
            "Insufficient bond token allowance from bond sender"
        );

        // Check balances
        require(IERC20(trade.cashToken).balanceOf(cashSender) >= cashAmount, "Insufficient cash balance");
        require(IERC20(trade.bondToken).balanceOf(bondSender) >= trade.nominal, "Insufficient bond balance");

        bool successCashPull = IERC20(trade.cashToken).transferFrom(cashSender, address(this), cashAmount);
        bool successBondPull = IERC20(trade.bondToken).transferFrom(bondSender, address(this), trade.nominal);

        if (successCashPull && successBondPull) { // both cash and bond pull success
            bool successCashPush = IERC20(trade.cashToken).transfer(cashReceiver, cashAmount);
            bool successBondPush = IERC20(trade.bondToken).transfer(bondReceiver, trade.nominal);

            if (successCashPush && successBondPush) {
                trade.status = Status.Matured;
                emit TradeMatured(_tradeId);
            } else { // either push failed
                emit TradeFailed(_tradeId, "Final maturity transfer failed");
                if (!successBondPush) IERC20(trade.cashToken).transfer(cashSender, cashAmount); // send back cash if bond transfer failed, dont need to care about cash since failed
                if (!successCashPush) IERC20(trade.bondToken).transfer(bondSender, trade.nominal); // send back bond if cash transfer failed, dont need to care about bond since failed
            }
        } else {
            emit TradeFailed(_tradeId, "Initial maturity transfer failed");
            if (!successBondPull) IERC20(trade.cashToken).transfer(cashSender, cashAmount); // send back cash if bond pull failed, dont need to care about bond since failed
            if (!successCashPull) IERC20(trade.bondToken).transfer(bondSender, trade.nominal); // send back bond if cash pull failed, dont need to care about cash since failed
        }
    }

    function cancelTrade(uint256 _tradeId) public onlyAdminOrOwner notAfterEndDate whenNotPaused {
        Trade storage trade = trades[_tradeId];
        require(trade.counterparty1 != address(0), "Trade does not exist");
        require(trade.status == Status.Pending, "Trade cannot be cancelled");
        trade.status = Status.Cancelled;
        emit TradeCancelled(_tradeId);
    }

    function getTrade(uint256 _tradeId) public view returns (
        uint256, uint256, uint256, string memory, uint8,
        uint256, uint256, uint256, uint256, uint256, string memory, uint8,
        uint256, uint256, uint256, uint256, address, address, address, address, uint8
    ) {
        Trade memory trade = trades[_tradeId];
        return (
            trade.tradeId,
            trade.startDateTime,
            trade.maturityDateTime,
            trade.bondIsin,
            uint8(trade.counterparty1RepoType),
            trade.nominal,
            trade.cleanPrice,
            trade.dirtyPrice,
            trade.haircut,
            trade.startAmount,
            trade.currency,
            uint8(trade.dayCountConvention),
            trade.repoRate,
            trade.interestAmount,
            trade.cashAmount,
            trade.bondAmount,
            trade.counterparty1,
            trade.counterparty2,
            trade.cashToken,
            trade.bondToken,
            uint8(trade.status)
        );
    }
}