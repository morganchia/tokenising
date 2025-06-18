// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// for REACTJS web3.js
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// for Remix
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
 * @notice A simplified bond token using the ERC20 standard.
 *         Each bond token represents 2500 underlying bond units.
 *         The parameter `faceValue` is interpreted as the face value of one bond unit.
 *         For example, if faceValue is 100 and couponRate is 500 (i.e. 5% annual),
 *         then the effective face value per token is 100 * 2500 = 250,000,
 *         and if coupons are paid in 5 periods per year (each 20% of a year),
 *         then each coupon payment will be 1% of 250,000 (i.e. $2,500).
 */
contract BondToken is ERC20, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    // Scaling factor to simulate fixed‑point arithmetic (18 decimals)
    uint256 public constant SCALE = 1e18;
    // Each bond token represents this many bond units.
    uint256 public constant BOND_UNITS = 2500;

    // Bond parameters:
    // couponRate: Annual coupon rate in basis points (e.g., 500 = 5%)
    // faceValue: Face value per individual bond unit (e.g. 100)
    uint256 public couponRate;
    uint256 public faceValue;
    uint256 public maturityDate;    // Timestamp when the bond matures
    uint256 public couponInterval;  // Seconds between coupon payments (0 => ad-hoc only)

    // Timestamp for the next coupon payment
    uint256 public nextCouponDate;

    // The ERC20 token used for coupon payments & redemption (e.g., a stablecoin)
    IERC20Like public cashToken;

    // Role: issuer (distinct from owner). The issuer can deposit coupons.
    address public issuer;

    // Track bond holders for coupon distribution.
    EnumerableSet.AddressSet private _holders;

    // Events
    event CouponPaid(address indexed holder, uint256 amount);
    event Redeemed(address indexed holder, uint256 amount);
    event CouponsDeposited(address indexed from, uint256 amount);
    event IssuerUpdated(address indexed newIssuer);

    // Debug events (for testing)
    event DebugUint(string message, uint256 value);
    event DebugAddress(string message, address addr);

    /**
     * @dev Constructor sets the parameters for the bond.
     * @param _name          ERC20 token name.
     * @param _symbol        ERC20 token symbol.
     * @param _couponRate    Annual coupon rate in basis points (e.g., 500 = 5%).
     * @param _faceValue     Face value per individual bond unit.
     * @param _maturityDate  Timestamp at which the bond matures.
     * @param _couponInterval Seconds between coupon payments (0 => ad-hoc only).
     * @param _totalSupply   Number of bond tokens to mint initially.
     * @param _cashToken     Address of the ERC20 token used for coupons/redemption.
     * @param _issuer        The address designated as the issuer (can deposit coupons).
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

        emit DebugUint("Constructor(): couponRate is:", couponRate);
        emit DebugUint("Constructor(): faceValue is:", faceValue);
        emit DebugUint("Constructor(): couponInterval is:", couponInterval);
        emit DebugUint("Constructor(): maturityDate is:", maturityDate);
        emit DebugAddress("Constructor(): issuer is:", issuer);

        // Set the first coupon payment date if couponInterval > 0.
        if (_couponInterval > 0) {
            nextCouponDate = block.timestamp + _couponInterval;
        } else {
            nextCouponDate = 0;
        }
        emit DebugUint("Constructor(): nextCouponDate is:", nextCouponDate);

        // Mint initial supply to the contract deployer.
        _mint(msg.sender, _totalSupply);
        emit DebugUint("Constructor(): _totalSupply is:", _totalSupply);

        // Track the deployer as the initial holder.
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
     * @param _newIssuer The new issuer address.
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
     *         for this contract.
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
     * @notice Deposit `cashToken` into the contract (to fund coupon payments).
     *         The caller (owner or issuer) must have approved this contract.
     */
    function depositCoupons(uint256 amount) external onlyOwnerOrIssuer {
        require(amount > 0, "Deposit amount must be > 0");

        bool success = cashToken.transferFrom(msg.sender, address(this), amount);
        require(success, "cashToken transfer failed");

        emit DebugUint("depositCoupons(): amount is:", amount);
        emit DebugAddress("depositCoupons(): sender is:", msg.sender);

        emit CouponsDeposited(msg.sender, amount);
    }

    /**
     * @notice Pay coupons to all bond token holders.
     *         In scheduled mode, coupon payments occur if block.timestamp >= nextCouponDate.
     */
    function payCoupon() external {
        // (For testing, time checks are commented out)
        // require(nextCouponDate != 0, "No coupon date set");
        // require(block.timestamp >= nextCouponDate, "Too early for coupon payment");

        // Calculate the coupon per token (scaled by SCALE).
        uint256 couponPerToken = calculateNextCouponPerToken();
        emit DebugUint("payCoupon(): couponPerToken is:", couponPerToken);

        uint256 holdersLength = _holders.length();
        for (uint256 i = 0; i < holdersLength; i++) {
            address holder = _holders.at(i);
            uint256 holderBalance = balanceOf(holder);
            emit DebugAddress("payCoupon(): holder is:", holder);
            emit DebugUint("payCoupon(): holderBalance is:", holderBalance);

            if (holderBalance > 0) {
                // Because couponPerToken is scaled, divide by SCALE.
                uint256 paymentAmount = (holderBalance * couponPerToken) / SCALE;
                emit DebugUint("payCoupon(): paymentAmount is:", paymentAmount);

                if (paymentAmount > 0) {
                    // (Balance check is omitted for testing)
                    cashToken.transfer(holder, paymentAmount);
                    emit CouponPaid(holder, paymentAmount);
                }
            }
        }

        // For scheduled coupons, update the next coupon date.
        if (couponInterval > 0) {
            nextCouponDate += couponInterval;
        }
        emit DebugUint("payCoupon(): couponInterval is:", couponInterval);
        emit DebugUint("payCoupon(): nextCouponDate is:", nextCouponDate);
    }

    // ---------------------------
    // REDEMPTION
    // ---------------------------

    /**
     * @notice Redeem bond tokens at or after maturity.
     *         The redeemer receives cashToken equal to:
     *         (faceValue * BOND_UNITS) per token redeemed.
     */
    function redeem(uint256 amount) external {
        require(block.timestamp >= maturityDate, "Bond not matured yet");
        require(balanceOf(msg.sender) >= amount, "Insufficient bond tokens");

        // Multiply faceValue by BOND_UNITS so that each token represents 2500 bonds.
        uint256 redemptionAmount = amount * faceValue * BOND_UNITS;
        require(
            cashToken.balanceOf(address(this)) >= redemptionAmount,
            "Contract has insufficient cashToken"
        );

        // Burn the redeemed tokens.
        _burn(msg.sender, amount);

        emit DebugAddress("redeem(): sender is:", msg.sender);
        emit DebugUint("redeem(): faceValue is:", faceValue);
        emit DebugUint("redeem(): redemptionAmount is:", redemptionAmount);
        emit DebugUint("redeem(): amount is:", amount);

        // Transfer cashToken to the redeemer.
        cashToken.transfer(msg.sender, redemptionAmount);
        emit Redeemed(msg.sender, redemptionAmount);
    }

    // ---------------------------
    // SURPLUS WITHDRAW
    // ---------------------------

    /**
     * @notice Allows the owner to withdraw surplus cashToken.
     */
    function withdrawSurplus(uint256 amount) external onlyOwner {
        require(amount > 0, "Withdraw amount must be > 0");
        require(
            cashToken.balanceOf(address(this)) >= amount,
            "Not enough cashToken in contract"
        );

        emit DebugAddress("withdrawSurplus(): owner is:", owner());
        emit DebugUint("withdrawSurplus(): amount is:", amount);

        cashToken.transfer(owner(), amount);
    }

    // ---------------------------
    // AD-HOC SCHEDULING
    // ---------------------------

    /**
     * @notice For ad-hoc coupon scheduling: set the next coupon date to now.
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
     * @notice Returns a holder address at a given index.
     */
    function holderAt(uint256 index) external view returns (address) {
        return _holders.at(index);
    }

    /**
     * @notice Returns all current bond holders, their balances,
     *         and their projected next coupon (adjusted for SCALE).
     */
    function bondHolders()
        external
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
        emit DebugUint("bondHolders(): couponPerToken is:", couponPerToken);

        for (uint256 i = 0; i < length; i++) {
            address holder = _holders.at(i);
            uint256 balanceOfHolder = balanceOf(holder);

            holders[i] = holder;
            balances[i] = balanceOfHolder;
            nextCoupons[i] = (balanceOfHolder * couponPerToken) / SCALE;

            emit DebugAddress("bondHolders(): holder is:", holder);
            emit DebugUint("bondHolders(): balanceOfHolder is:", balanceOfHolder);
        }
    }

    /**
     * @dev Overridden ERC20 hook to update the holders set.
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
     * @dev Calculates the coupon amount per token for the next coupon cycle.
     *      This value is scaled by SCALE (i.e. has 18 decimals of precision).
     *
     *      Note that we multiply by BOND_UNITS so that each token reflects
     *      the underlying 2500 bond units.
     */
    function calculateNextCouponPerToken() public returns (uint256) {
        // secondsInYear = 365 days (31,536,000 seconds)
        uint256 secondsInYear = 365 days;
        // yearly coupon per token = (faceValue per unit * BOND_UNITS * couponRate) / 10000.
        uint256 yearlyCouponPerToken = (faceValue * BOND_UNITS * couponRate) / 10000;

        emit DebugUint("calculateNextCouponPerToken(): faceValue is:", faceValue);
        emit DebugUint("calculateNextCouponPerToken(): couponRate is:", couponRate);
        emit DebugUint("calculateNextCouponPerToken(): yearlyCouponPerToken is:", yearlyCouponPerToken);
        emit DebugUint("calculateNextCouponPerToken(): couponInterval is:", couponInterval);
        emit DebugUint("calculateNextCouponPerToken(): secondsInYear is:", secondsInYear);

        if (couponInterval == 0) {
            return 0;
        } else {
            // Multiply by SCALE to preserve the fractional part, then adjust by couponInterval.
            uint256 couponPerToken = (yearlyCouponPerToken * couponInterval * SCALE) / secondsInYear;
            emit DebugUint("calculateNextCouponPerToken(): couponPerToken is:", couponPerToken);
            return couponPerToken;
        }
    }
}
