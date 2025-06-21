// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
    uint256 public endDate; // Timestamp (UTC) after which most functions are disabled; input as SGT (UTC+8) converted to UTC
    bool public paused; // Contract pause state
    mapping(address => bool) public admins; // Mapping of admin addresses

    enum RepoType { Repo, ReverseRepo } // Repo: borrow cash, lend bonds; ReverseRepo: lend cash, borrow bonds
    enum Status { Pending, Started, Matured, Cancelled }

    struct Trade {
        uint256 tradeId;
        uint256 startDateTime; // UTC timestamp; input as SGT (UTC+8) converted to UTC
        uint256 maturityDateTime; // UTC timestamp; input as SGT (UTC+8) converted to UTC
        string bondIsin;
        RepoType counterparty1RepoType; // Repo: borrow cash, lend bonds; ReverseRepo: lend cash, borrow bonds
        uint256 bondAmount; // Bond token amount
        uint256 startAmount; // Cash token amount at start
        uint256 interestAmount; // Interest added to cash at maturity
        uint256 cashAmount;
        address counterparty1;
        address counterparty2;
        address cashToken;
        address bondToken;
        Status status;
    }

    // Struct for trade creation parameters
    struct TradeInput {
        uint256 startDateTime; // UTC timestamp; input as SGT (UTC+8) converted to UTC
        uint256 maturityDateTime; // UTC timestamp; input as SGT (UTC+8) converted to UTC
        string bondIsin;
        uint8 counterparty1RepoType;
        uint256 bondAmount;
        uint256 startAmount;
        uint256 interestAmount;
        uint256 cashAmount;
        address counterparty1;
        address counterparty2;
        address cashToken;
        address bondToken;
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
    event TokensWithdrawn(uint256 indexed tradeId, address indexed token, address indexed to, uint256 amount);

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

    // Constructor accepts an optional TradeInput to create a trade during deployment; if invalid or empty, no trade is created
    constructor(TradeInput memory input) {
        owner = msg.sender;
        tradeCount = 0;
        paused = false;
        endDate = 0; // No end date by default
        admins[msg.sender] = true; // Owner is an admin by default

        // If valid trade parameters are provided, create a trade
        if (
            input.counterparty1 != address(0) &&
            input.counterparty2 != address(0) &&
            input.cashToken != address(0) &&
            input.bondToken != address(0) &&
            input.bondAmount > 0 &&
            input.startAmount > 0 &&
            input.startDateTime <= input.maturityDateTime
        ) {
            tradeCount++;
            trades[tradeCount] = Trade(
                tradeCount,
                input.startDateTime,
                input.maturityDateTime,
                input.bondIsin,
                RepoType(input.counterparty1RepoType),
                input.bondAmount,
                input.startAmount,
                input.interestAmount,
                input.cashAmount,
                input.counterparty1,
                input.counterparty2,
                input.cashToken,
                input.bondToken,
                Status.Pending
            );

            emit TradeCreated(tradeCount, input.counterparty1, input.counterparty2);
        }
    }

    // Set the contract end date, after which most functions are disabled
    // _newEndDate: UTC timestamp; input as SGT (UTC+8) converted to UTC (subtract 28,800 seconds)
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

    // Create trade with all parameters
    // input.startDateTime and input.maturityDateTime: UTC timestamps; input as SGT (UTC+8) converted to UTC
    function createTrade(TradeInput memory input) public onlyAdminOrOwner notAfterEndDate returns (uint256) {
        require(input.startDateTime <= input.maturityDateTime, "Start must be before maturity");
        require(input.counterparty1 != address(0) && input.counterparty2 != address(0), "Invalid counterparty addresses");
        require(input.cashToken != address(0) && input.bondToken != address(0), "Invalid token addresses");
        require(input.bondAmount > 0, "Bond amount must be positive");
        require(input.startAmount > 0, "Start amount must be positive");

        tradeCount++;
        trades[tradeCount] = Trade(
            tradeCount,
            input.startDateTime,
            input.maturityDateTime,
            input.bondIsin,
            RepoType(input.counterparty1RepoType),
            input.bondAmount,
            input.startAmount,
            input.interestAmount,
            input.cashAmount,
            input.counterparty1,
            input.counterparty2,
            input.cashToken,
            input.bondToken,
            Status.Pending
        );

        emit TradeCreated(tradeCount, input.counterparty1, input.counterparty2);
        return tradeCount;
    }

    function startTrade(uint256 _tradeId) public onlyAdminOrOwner notAfterEndDate whenNotPaused {
        Trade storage trade = trades[_tradeId];
        require(trade.counterparty1 != address(0), "Trade does not exist");
        require(trade.status == Status.Pending, "Trade not pending");
        require(block.timestamp >= trade.startDateTime, "Too early for start");
        require(block.timestamp <= trade.startDateTime + 72 hours, "Start window expired");

        address cashSender = trade.counterparty1RepoType == RepoType.Repo ? trade.counterparty2 : trade.counterparty1;
        address bondSender = trade.counterparty1RepoType == RepoType.Repo ? trade.counterparty1 : trade.counterparty2;

        // Check allowances and balances
        require(IERC20(trade.cashToken).allowance(cashSender, address(this)) >= trade.startAmount, "Insufficient cash token allowance");
        require(IERC20(trade.bondToken).allowance(bondSender, address(this)) >= trade.bondAmount, "Insufficient bond token allowance");
        require(IERC20(trade.cashToken).balanceOf(cashSender) >= trade.startAmount, "Insufficient cash balance");
        require(IERC20(trade.bondToken).balanceOf(bondSender) >= trade.bondAmount, "Insufficient bond balance");

        // Transfer cash to contract (escrow)
        bool successCash = IERC20(trade.cashToken).transferFrom(cashSender, address(this), trade.startAmount);
        if (!successCash) {
            emit TradeFailed(_tradeId, "Cash transfer to contract failed");
            return;
        }

        // Attempt bond transfer
        bool successBond = IERC20(trade.bondToken).transferFrom(bondSender, cashSender, trade.bondAmount);
        if (!successBond) {
            // Refund cash from contract to cashSender
            bool refundSuccess = IERC20(trade.cashToken).transfer(cashSender, trade.startAmount);
            if (!refundSuccess) {
                // Note: cashTokens are stuck in contract; need to handle manually
                emit TradeFailed(_tradeId, "Bond transfer and cash refund failed");
                return;
            }
            emit TradeFailed(_tradeId, "Bond transfer failed, cashToken refunded");
            return;
        }

        // Both transfers succeeded; send cash from contract to bondSender
        bool finalCashSuccess = IERC20(trade.cashToken).transfer(bondSender, trade.startAmount);
        if (!finalCashSuccess) {
            // Note: cashTokens are stuck in contract; need to handle manually
            // This should not happen if balance checks are correct
            emit TradeFailed(_tradeId, "Final cash transfer failed");
            return;
        }

        trade.status = Status.Started;
        emit TradeStarted(_tradeId);
    }

    function matureTrade(uint256 _tradeId) public onlyAdminOrOwner notAfterEndDate whenNotPaused {
        Trade storage trade = trades[_tradeId];
        require(trade.counterparty1 != address(0), "Trade does not exist");
        require(trade.status == Status.Started, "Trade not started");
        require(block.timestamp >= trade.maturityDateTime, "Too early for maturity");
        require(block.timestamp <= trade.maturityDateTime + 72 hours, "Maturity window expired");

        // For Repo (Counterparty1 returns cash + interest, Counterparty2 returns bonds)
        address cashSender = trade.counterparty1RepoType == RepoType.Repo ? trade.counterparty1 : trade.counterparty2;
        address bondSender = trade.counterparty1RepoType == RepoType.Repo ? trade.counterparty2 : trade.counterparty1;

        uint256 cashAmount = trade.startAmount + trade.interestAmount;

        // Check allowances and balances
        require(IERC20(trade.cashToken).allowance(cashSender, address(this)) >= cashAmount, "Insufficient cash token allowance");
        require(IERC20(trade.bondToken).allowance(bondSender, address(this)) >= trade.bondAmount, "Insufficient bond token allowance");
        require(IERC20(trade.cashToken).balanceOf(cashSender) >= cashAmount, "Insufficient cash balance");
        require(IERC20(trade.bondToken).balanceOf(bondSender) >= trade.bondAmount, "Insufficient bond balance");

        // Transfer cash to contract (escrow)
        bool successCash = IERC20(trade.cashToken).transferFrom(cashSender, address(this), cashAmount);
        if (!successCash) {
            emit TradeFailed(_tradeId, "Cash maturity transfer to contract failed");
            return;
        }

        // Attempt bond transfer
        bool successBond = IERC20(trade.bondToken).transferFrom(bondSender, cashSender, trade.bondAmount);
        if (!successBond) {
            // Refund cash from contract to cashSender
            bool refundSuccess = IERC20(trade.cashToken).transfer(cashSender, cashAmount);
            if (!refundSuccess) {
                emit TradeFailed(_tradeId, "Bond maturity transfer and cash refund failed");
                return;
            }
            emit TradeFailed(_tradeId, "Bond maturity transfer failed");
            return;
        }

        // Both transfers succeeded; send cash from contract to bondSender
        bool finalCashSuccess = IERC20(trade.cashToken).transfer(bondSender, cashAmount);
        if (!finalCashSuccess) {
            emit TradeFailed(_tradeId, "Final cash maturity transfer failed");
            return;
        }

        trade.status = Status.Matured;
        emit TradeMatured(_tradeId);
    }

    // withdrawTokens() is meant for manual recovery to transfer locked tokens out of the Repo smart contract
    function withdrawTokens(uint256 _tradeId, address _token, address _to, uint256 _amount) public onlyAdminOrOwner notAfterEndDate whenNotPaused {
        Trade storage trade = trades[_tradeId];
        require(trade.counterparty1 != address(0), "Trade does not exist");
        require(_token == trade.cashToken || _token == trade.bondToken, "Invalid token address");
        require(_amount > 0, "Amount must be positive");

        // Determine cashSender and bondSender based on RepoType
        address cashSender = trade.counterparty1RepoType == RepoType.Repo ? trade.counterparty2 : trade.counterparty1;
        address bondSender = trade.counterparty1RepoType == RepoType.Repo ? trade.counterparty1 : trade.counterparty2;

        // Restrict withdrawal to cashSender or bondSender
        require(_to == cashSender || _to == bondSender, "Recipient must be cashSender or bondSender");

        // Check contract's token balance
        require(IERC20(_token).balanceOf(address(this)) >= _amount, "Insufficient token balance in contract");

        // Transfer tokens to the recipient
        bool success = IERC20(_token).transfer(_to, _amount);
        require(success, "Token transfer failed");

        emit TokensWithdrawn(_tradeId, _token, _to, _amount);
    }

    function cancelTrade(uint256 _tradeId) public onlyAdminOrOwner notAfterEndDate whenNotPaused {
        Trade storage trade = trades[_tradeId];
        require(trade.counterparty1 != address(0), "Trade does not exist");
        require(trade.status == Status.Pending, "Trade cannot be cancelled");
        trade.status = Status.Cancelled;
        emit TradeCancelled(_tradeId);
    }

    // Get basic trade information (UTC timestamps)
    function getTradeBasics(uint256 _tradeId) public view returns (
        uint256 tradeId,
        uint256 startDateTime,
        uint256 maturityDateTime,
        string memory bondIsin,
        uint8 counterparty1RepoType,
        uint256 startAmount,
        uint256 interestAmount,
        uint256 bondAmount,
        uint256 cashAmount,
        uint8 status
    ) {
        Trade storage trade = trades[_tradeId];
        return (
            trade.tradeId,
            trade.startDateTime,
            trade.maturityDateTime,
            trade.bondIsin,
            uint8(trade.counterparty1RepoType),
            trade.startAmount,
            trade.interestAmount,
            trade.bondAmount,
            trade.cashAmount,
            uint8(trade.status)
        );
    }

    // Get trade details (addresses and status)
    function getTradeDetails(uint256 _tradeId) public view returns (
        uint256 tradeId,
        address counterparty1,
        address counterparty2,
        address cashToken,
        address bondToken,
        uint8 status
    ) {
        Trade storage trade = trades[_tradeId];
        return (
            trade.tradeId,
            trade.counterparty1,
            trade.counterparty2,
            trade.cashToken,
            trade.bondToken,
            uint8(trade.status)
        );
    }

    // Get basic trade information with timestamps adjusted to SGT (UTC+8)
    function getTradeBasicsSGT(uint256 _tradeId) public view returns (
        uint256 tradeId,
        uint256 startDateTime, // SGT timestamp (UTC + 28,800 seconds)
        uint256 maturityDateTime, // SGT timestamp (UTC + 28,800 seconds)
        string memory bondIsin,
        uint8 counterparty1RepoType,
        uint256 startAmount,
        uint256 interestAmount,
        uint256 bondAmount,
        uint256 cashAmount,
        uint8 status
    ) {
        Trade storage trade = trades[_tradeId];
        return (
            trade.tradeId,
            trade.startDateTime + 28800, // Add 8 hours to convert UTC to SGT
            trade.maturityDateTime + 28800, // Add 8 hours to convert UTC to SGT
            trade.bondIsin,
            uint8(trade.counterparty1RepoType),
            trade.startAmount,
            trade.interestAmount,
            trade.bondAmount,
            trade.cashAmount,
            uint8(trade.status)
        );
    }

    // Get contract end date adjusted to SGT (UTC+8)
    function getEndDateSGT() public view returns (uint256) {
        return endDate == 0 ? 0 : endDate + 28800; // Add 8 hours to convert UTC to SGT
    }
}