// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

//import "@openzeppelin/contracts@4.8.3/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts@4.8.3/access/Ownable.sol";
//import "@openzeppelin/contracts@4.8.3/utils/structs/EnumerableSet.sol";

interface IERC20Like {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);
}

/**
 * @title BondToken
 * @notice A simplified bond token using ERC20 standard. Each bond token
 *         represents a bond unit. Holders can receive coupon payments
 *         in a specified ERC20 "cashToken" (e.g., stablecoin).
 */
contract BondToken is ERC20, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    // Bond parameters
    uint256 public couponRate;         // Annual coupon rate in basis points (e.g., 500 = 5%)
    uint256 public faceValue;          // Face value (principal) per bond token
    uint256 public maturityDate;       // Timestamp of the bond’s maturity date
    uint256 public couponInterval;     // Seconds between coupon payments (0 => ad-hoc only)

    // Timestamp for the next coupon payment
    uint256 public nextCouponDate;

    // The ERC20 token used for coupon payments & redemption (renamed from "stablecoin")
    IERC20Like public cashToken;

    // Role: issuer (distinct from owner). The issuer can deposit coupons.
    address public issuer;

    // Track bond holders for coupon distribution
    EnumerableSet.AddressSet private _holders;

    // Events
    event CouponPaid(address indexed holder, uint256 amount);
    event Redeemed(address indexed holder, uint256 amount);
    event CouponsDeposited(address indexed from, uint256 amount);
    event IssuerUpdated(address indexed newIssuer);

    /**
     * @dev Constructor sets the parameters for the bond.
     * @param _name          ERC20 token name
     * @param _symbol        ERC20 token symbol
     * @param _couponRate    Annual coupon rate in basis points (e.g., 500 = 5%)
     * @param _faceValue     Face value (principal) per bond token
     * @param _maturityDate  Timestamp at which the bond matures
     * @param _couponInterval Seconds between coupon payments (0 => ad-hoc only)
     * @param _totalSupply   Number of bond tokens to mint initially
     * @param _cashToken     Address of the ERC20 token used for coupons/redemption
     * @param _issuer        The address designated as the issuer (can deposit coupons)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _couponRate,
        uint256 _faceValue,
        uint256 _maturityDate,
        uint256 _couponInterval,
        uint256 _totalSupply,
        address _cashToken,
        address _issuer
    ) ERC20(_name, _symbol) {
        require(_maturityDate > block.timestamp, "Maturity must be in the future");
        require(_couponRate > 0, "Coupon rate must be > 0");
        require(_faceValue > 0, "Face value must be > 0");
        require(_totalSupply > 0, "Total supply must be > 0");
        require(_cashToken != address(0), "Invalid cash token address");
        require(_issuer != address(0), "Issuer cannot be zero address");

        couponRate = _couponRate;
        faceValue = _faceValue;
        maturityDate = _maturityDate;
        couponInterval = _couponInterval;

        cashToken = IERC20Like(_cashToken);
        issuer = _issuer;

        // If couponInterval > 0, schedule the first coupon
        if (_couponInterval > 0) {
            nextCouponDate = block.timestamp + _couponInterval;
        } else {
            // ad-hoc mode
            nextCouponDate = 0;
        }

        // Mint initial supply to the contract owner (issuer might be a different address)
        _mint(msg.sender, _totalSupply);

        // Track the owner as the initial holder
        _holders.add(msg.sender);
    }

    // ---------------------------
    // MODIFIERS & ROLE FUNCTIONS
    // ---------------------------

    modifier onlyOwnerOrIssuer() {
        require(
            msg.sender == owner() || msg.sender == issuer,
            "Not owner or issuer"
        );
        _;
    }

    /**
     * @notice Updates the issuer address. Only the owner can do this.
     * @param _newIssuer The new issuer address
     */
    function setIssuer(address _newIssuer) external onlyOwner {
        require(_newIssuer != address(0), "Cannot set issuer to zero");
        issuer = _newIssuer;
        emit IssuerUpdated(_newIssuer);
    }

    // ---------------------------
    // DEPOSIT / PAY COUPONS
    // ---------------------------

    /**
     * @notice Checks if `wallet` has approved at least `amount` of `cashToken`
     *         for this contract to transfer on their behalf.
     * @param wallet The wallet address to check
     * @param amount The amount of `cashToken` allowance to verify
     * @return Boolean indicating if allowance >= amount
     */
    function hasSufficientAllowanceForDeposit(address wallet, uint256 amount)
        external
        view
        returns (bool)
    {
        uint256 currentAllowance = cashToken.allowance(wallet, address(this));
        return (currentAllowance >= amount);
    }

    /**
     * @notice Deposit `cashToken` into this contract (e.g. to fund coupons).
     *         The caller (owner or issuer) must have approved this contract
     *         to transfer `cashToken` from their wallet.
     * @param amount The amount of `cashToken` to deposit.
     */
    function depositCoupons(uint256 amount) external onlyOwnerOrIssuer {
        require(amount > 0, "Deposit amount must be > 0");

        bool success = cashToken.transferFrom(issuer, address(this), amount);
        require(success, "cashToken transfer failed");
        emit CouponsDeposited(issuer, amount);
    }

    /**
     * @notice Pay coupon to all bond token holders.
     *         - If couponInterval == 0 => ad-hoc. nextCouponDate must be > 0.
     *         - If couponInterval > 0 => scheduled. Must be >= nextCouponDate.
     */
    function payCoupon() external {
        require(nextCouponDate != 0, "No coupon date set");
        require(block.timestamp >= nextCouponDate, "Too early for next coupon payment");

        // Calculate the coupon per token
        uint256 couponPerToken = calculateNextCouponPerToken();

        uint256 holdersLength = _holders.length();
        for (uint256 i = 0; i < holdersLength; i++) {
            address holder = _holders.at(i);
            uint256 holderBalance = balanceOf(holder);

            if (holderBalance > 0) {
                uint256 paymentAmount = holderBalance * couponPerToken;
                if (paymentAmount > 0) {
                    require(
                        cashToken.balanceOf(address(this)) >= paymentAmount,
                        "Not enough cashToken in contract"
                    );

                    cashToken.transfer(holder, paymentAmount);
                    emit CouponPaid(holder, paymentAmount);
                }
            }
        }

        // If there's a recurring schedule, move the next date
        if (couponInterval > 0) {
            nextCouponDate += couponInterval;
        }
        // Otherwise, in ad-hoc mode, it stays until set again.
    }

    // ---------------------------
    // REDEMPTION
    // ---------------------------

    /**
     * @notice Redeem bond tokens at or after maturity to receive faceValue in `cashToken`.
     * @param amount Number of bond tokens to redeem.
     */
    function redeem(uint256 amount) external {
        require(block.timestamp >= maturityDate, "Bond not matured yet");
        require(balanceOf(msg.sender) >= amount, "Insufficient bond tokens");

        uint256 redemptionAmount = amount * faceValue;
        require(
            cashToken.balanceOf(address(this)) >= redemptionAmount,
            "Contract has insufficient cashToken"
        );

        // Burn tokens
        _burn(msg.sender, amount);

        // Transfer `cashToken` to redeemer
        cashToken.transfer(msg.sender, redemptionAmount);
        emit Redeemed(msg.sender, redemptionAmount);
    }

    // ---------------------------
    // SURPLUS WITHDRAW
    // ---------------------------

    /**
     * @notice Allows the owner to withdraw surplus `cashToken` if there's more
     *         than needed for coupons/redemption.
     * @param amount The amount of `cashToken` to withdraw.
     */
    function withdrawSurplus(uint256 amount) external onlyOwner {
        require(amount > 0, "Withdraw amount must be > 0");
        require(
            cashToken.balanceOf(address(this)) >= amount,
            "Not enough cashToken in contract"
        );
        cashToken.transfer(owner(), amount);
    }

    // ---------------------------
    // AD-HOC SCHEDULING
    // ---------------------------

    /**
     * @notice Sets the `nextCouponDate` to the current block timestamp.
     *         This is for ad-hoc scheduling of coupon payments if interval == 0.
     */
    function setNextCouponDateToNow() external onlyOwnerOrIssuer {
        nextCouponDate = block.timestamp;
    }

    // ---------------------------
    // VIEWS / HELPERS
    // ---------------------------

    /**
     * @notice Returns the number of current bond token holders.
     */
    function holderCount() external view returns (uint256) {
        return _holders.length();
    }

    /**
     * @notice Returns a holder address at a given index in the internal set.
     * @param index The index in the holder set.
     */
    function holderAt(uint256 index) external view returns (address) {
        return _holders.at(index);
    }

    /**
     * @notice Returns all current bond holders, their balances, and their projected next coupon.
     */
    function bondHolders()
        external
        view
        returns (
            address[] memory holders,
            uint256[] memory balances,
            uint256[] memory nextCoupons
        )
    {
        uint256 length = _holders.length();
        holders = new address[](length);
        balances = new uint256[](length);
        nextCoupons = new uint256[](length);

        uint256 couponPerToken = calculateNextCouponPerToken();

        for (uint256 i = 0; i < length; i++) {
            address holder = _holders.at(i);
            uint256 balanceOfHolder = balanceOf(holder);

            holders[i] = holder;
            balances[i] = balanceOfHolder;
            nextCoupons[i] = balanceOfHolder * couponPerToken;
        }
    }

    /**
     * @dev Overridden hook from ERC20 to keep track of holders in `_holders` set.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._afterTokenTransfer(from, to, amount);

        if (from != address(0) && balanceOf(from) == 0) {
            _holders.remove(from);
        }
        if (to != address(0) && balanceOf(to) > 0) {
            _holders.add(to);
        }
    }

    /**
     * @dev Internal helper to calculate the coupon amount per token for the next coupon payment cycle.
     */
    function calculateNextCouponPerToken() public view returns (uint256) {
        // Suppose 1 year = 365 days = 31,536,000 seconds.
        // yearlyCouponPerToken = (faceValue * couponRate) / 10000
        // couponPerToken = yearlyCouponPerToken * (couponInterval / secondsInYear)
        // If couponInterval == 0 => no scheduled coupons => return 0 by default for "scheduled" logic.
        uint256 secondsInYear = 365 days;
        uint256 yearlyCouponPerToken = (faceValue * couponRate) / 10000;

        if (couponInterval == 0) {
            return 0;
        } else {
            uint256 couponPerToken = (yearlyCouponPerToken * couponInterval) / secondsInYear;
            return couponPerToken;
        }
    }
}
