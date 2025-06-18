// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract Repo {
    address public owner;
    uint256 public tradeCount;

    enum RepoType { Repo, ReverseRepo } // Repo: borrow cash, lend bonds; ReverseRepo: lend cash, borrow bonds
    enum Status { Pending, Started, Matured, Cancelled }

    struct Trade {
        uint256 tradeId;
        uint256 tradeDate;
        uint256 startDate;
        uint256 startTime;
        uint256 maturityDate;
        uint256 maturityTime;
        string bondIsin;
        RepoType counterparty1Type;  // { Repo, ReverseRepo } // Repo: borrow cash, lend bonds; ReverseRepo: lend cash, borrow bonds
        uint256 nominal;             // Bond token amount
        uint256 cleanPrice;
        uint256 dirtyPrice;
        uint256 haircut;             // in basis point
        uint256 startAmount;         // Cash token amount at start
        string currency;             // SGD, USD, JPY
        string dayCountConvention;
        uint256 repoRate;            // in basis point
        uint256 interestAmount;      // Interest added to cash at maturity
        address counterparty1;       // wallet addr
        address counterparty2;       // wallet addr
        address cashToken;           // smart contract addr
        address bondToken;           // smart contract addr
        Status status;
    }

    mapping(uint256 => Trade) public trades;

    event TradeCreated(uint256 indexed tradeId, address indexed counterparty1, address indexed counterparty2);
    event TradeStarted(uint256 indexed tradeId);
    event TradeMatured(uint256 indexed tradeId);
    event TradeCancelled(uint256 indexed tradeId);
    event TradeFailed(uint256 indexed tradeId, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier withinStartWindow(uint256 tradeId) {
        Trade memory trade = trades[tradeId];
        require(trade.status == Status.Pending, "Trade not pending");
        require(block.timestamp >= trade.startDate + trade.startTime, "Too early for start");
        require(block.timestamp <= trade.startDate + trade.startTime + 1 hours, "Start window expired");
        _;
    }

    modifier withinMaturityWindow(uint256 tradeId) {
        Trade memory trade = trades[tradeId];
        require(trade.status == Status.Started, "Trade not started");
        require(block.timestamp >= trade.maturityDate + trade.maturityTime, "Too early for maturity");
        require(block.timestamp <= trade.maturityDate + trade.maturityTime + 1 hours, "Maturity window expired");
        _;
    }

    constructor() {
        owner = msg.sender;
        tradeCount = 0;
    }

    function createTrade(
        uint256 _tradeDate,
        uint256 _startDate,
        uint256 _startTime,
        uint256 _maturityDate,
        uint256 _maturityTime,
        string memory _bondIsin,
        uint8 _counterparty1Type,
        uint256 _nominal,
        uint256 _cleanPrice,
        uint256 _dirtyPrice,
        uint256 _haircut,
        uint256 _startAmount,
        string memory _currency,
        string memory _dayCountConvention,
        uint256 _repoRate,
        uint256 _interestAmount,
        address _counterparty1,
        address _counterparty2,
        address _cashToken,
        address _bondToken
    ) public onlyOwner returns (uint256) {
        require(_startDate + _startTime <= _maturityDate + _maturityTime, "Start must be before maturity");
        require(_counterparty1 != address(0) && _counterparty2 != address(0), "Invalid counterparty addresses");
        require(_cashToken != address(0) && _bondToken != address(0), "Invalid token addresses");
        require(_nominal > 0 && _startAmount > 0, "Amounts must be positive");

        tradeCount++;
        trades[tradeCount] = Trade(
            tradeCount,
            _tradeDate,
            _startDate,
            _startTime,
            _maturityDate,
            _maturityTime,
            _bondIsin,
            RepoType(_counterparty1Type),
            _nominal,
            _cleanPrice,
            _dirtyPrice,
            _haircut,
            _startAmount,
            _currency,
            _dayCountConvention,
            _repoRate,
            _interestAmount,
            _counterparty1,
            _counterparty2,
            _cashToken,
            _bondToken,
            Status.Pending
        );

        emit TradeCreated(tradeCount, _counterparty1, _counterparty2);
        return tradeCount;
    }

    function startTrade(uint256 _tradeId) public withinStartWindow(_tradeId) {
        Trade storage trade = trades[_tradeId];
        require(trade.counterparty1 != address(0), "Trade does not exist");

        // For Repo (Counterparty1 borrows cash, lends bonds)
        address cashSender = trade.counterparty1Type == RepoType.Repo ? trade.counterparty2 : trade.counterparty1;
        address bondSender = trade.counterparty1Type == RepoType.Repo ? trade.counterparty1 : trade.counterparty2;
        address cashReceiver = trade.counterparty1Type == RepoType.Repo ? trade.counterparty1 : trade.counterparty2;
        address bondReceiver = trade.counterparty1Type == RepoType.Repo ? trade.counterparty2 : trade.counterparty1;

        require(IERC20(trade.cashToken).balanceOf(cashSender) >= trade.startAmount, "Insufficient cash balance");
        require(IERC20(trade.bondToken).balanceOf(bondSender) >= trade.nominal, "Insufficient bond balance");

        bool successCash = IERC20(trade.cashToken).transferFrom(cashSender, address(this), trade.startAmount);
        bool successBond = IERC20(trade.bondToken).transferFrom(bondSender, address(this), trade.nominal);

        if (successCash && successBond) {
            bool transferCash = IERC20(trade.cashToken).transfer(cashReceiver, trade.startAmount);
            bool transferBond = IERC20(trade.bondToken).transfer(bondReceiver, trade.nominal);

            if (transferCash && transferBond) {
                trade.status = Status.Started;
                emit TradeStarted(_tradeId);
            } else {
                emit TradeFailed(_tradeId, "Final transfer failed");
                if (transferCash) IERC20(trade.cashToken).transfer(cashSender, trade.startAmount);
                if (transferBond) IERC20(trade.bondToken).transfer(bondSender, trade.nominal);
            }
        } else {
            emit TradeFailed(_tradeId, "Initial transfer failed");
            if (successCash) IERC20(trade.cashToken).transfer(cashSender, trade.startAmount);
            if (successBond) IERC20(trade.bondToken).transfer(bondSender, trade.nominal);
        }
    }

    function matureTrade(uint256 _tradeId) public withinMaturityWindow(_tradeId) {
        Trade storage trade = trades[_tradeId];
        require(trade.counterparty1 != address(0), "Trade does not exist");

        // For Repo (Counterparty1 returns cash + interest, Counterparty2 returns bonds)
        address cashSender = trade.counterparty1Type == RepoType.Repo ? trade.counterparty1 : trade.counterparty2;
        address bondSender = trade.counterparty1Type == RepoType.Repo ? trade.counterparty2 : trade.counterparty1;
        address cashReceiver = trade.counterparty1Type == RepoType.Repo ? trade.counterparty2 : trade.counterparty1;
        address bondReceiver = trade.counterparty1Type == RepoType.Repo ? trade.counterparty1 : trade.counterparty2;

        uint256 cashAmount = trade.startAmount + trade.interestAmount;

        require(IERC20(trade.cashToken).balanceOf(cashSender) >= cashAmount, "Insufficient cash balance");
        require(IERC20(trade.bondToken).balanceOf(bondSender) >= trade.nominal, "Insufficient bond balance");

        bool successCash = IERC20(trade.cashToken).transferFrom(cashSender, address(this), cashAmount);
        bool successBond = IERC20(trade.bondToken).transferFrom(bondSender, address(this), trade.nominal);

        if (successCash && successBond) {
            bool transferCash = IERC20(trade.cashToken).transfer(cashReceiver, cashAmount);
            bool transferBond = IERC20(trade.bondToken).transfer(bondReceiver, trade.nominal);

            if (transferCash && transferBond) {
                trade.status = Status.Matured;
                emit TradeMatured(_tradeId);
            } else {
                emit TradeFailed(_tradeId, "Final maturity transfer failed");
                if (transferCash) IERC20(trade.cashToken).transfer(cashSender, cashAmount);
                if (transferBond) IERC20(trade.bondToken).transfer(bondSender, trade.nominal);
            }
        } else {
            emit TradeFailed(_tradeId, "Initial maturity transfer failed");
            if (successCash) IERC20(trade.cashToken).transfer(cashSender, cashAmount);
            if (successBond) IERC20(trade.bondToken).transfer(bondSender, trade.nominal);
        }
    }

    function cancelTrade(uint256 _tradeId) public onlyOwner {
        Trade storage trade = trades[_tradeId];
        require(trade.counterparty1 != address(0), "Trade does not exist");
        require(trade.status == Status.Pending, "Trade cannot be cancelled");
        trade.status = Status.Cancelled;
        emit TradeCancelled(_tradeId);
    }

    function getTrade(uint256 _tradeId) public view returns (
        uint256, uint256, uint256, uint256, uint256, string memory, uint8,
        uint256, uint256, uint256, uint256, uint256, string memory, string memory,
        uint256, uint256, address, address, address, address, uint8
    ) {
        Trade memory trade = trades[_tradeId];
        return (
            trade.tradeId,
            trade.tradeDate,
            trade.startDate,
            trade.startTime,
            trade.maturityDate,
            trade.maturityTime,
            trade.bondIsin,
            uint8(trade.counterparty1Type),
            trade.nominal,
            trade.cleanPrice,
            trade.dirtyPrice,
            trade.haircut,
            trade.startAmount,
            trade.currency,
            trade.dayCountConvention,
            trade.repoRate,
            trade.interestAmount,
            trade.counterparty1,
            trade.counterparty2,
            trade.cashToken,
            trade.bondToken,
            uint8(trade.status)
        );
    }
}