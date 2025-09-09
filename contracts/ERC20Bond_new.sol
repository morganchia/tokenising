// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/math/Math.sol"; 
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; 

//import "@openzeppelin/contracts@5.0.2/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts@5.0.2/token/ERC20/IERC20.sol";
//import "@openzeppelin/contracts@5.0.2/access/Ownable.sol";
//import "@openzeppelin/contracts@5.0.2/token/ERC20/extensions/ERC20Pausable.sol";
//import "@openzeppelin/contracts@5.0.2/utils/Strings.sol";

contract BondToken is ERC20, ERC20Pausable, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Bond configuration
    struct BondConfig {
        string tokenName; // Token name (e.g., "SGS 2.625 08012032")
        string tokenSymbol; // Token symbol (e.g., "EAPS")
        string isinNumber;
        uint256 faceValue; // Scaled by 10^18 (e.g., 100.5 * 10^18)
        uint256 couponRate; // In 0.001% units (e.g., 262500 = 2.625%)
        uint256 couponInterval; // In seconds (e.g., 15768000 for semi-annual)
        uint256 issueDate; // Unix timestamp in seconds
        uint256 maturityDate; // Unix timestamp in seconds
        string issuer;
        uint256 totalSupply; // Total supply of tokens, scaled by 10^18
        address cashToken;
        string prospectusUrl;
    }

    BondConfig public config;
    mapping(address => bool) private _blacklist;
    mapping(address => bool) public admins;
    mapping(uint256 => bool) private _couponPaid;
    uint256 public couponCount;
    bool public initialized; // Tracks whether bond has been initialized

    // Events
    event CouponPaid(address indexed to, uint256 couponpaid, uint256 timestamp, uint256 couponIndex);
    event BlacklistUpdated(address indexed account, bool isBlacklisted);
    event TokensBurned(address indexed account, uint256 amount);
    event AdminUpdated(address indexed admin, bool isAdded);
    event BondConfigUpdated(
        string tokenName,
        string tokenSymbol,
        string isinNumber,
        uint256 faceValue,
        uint256 couponRate,
        uint256 couponInterval,
        uint256 issueDate,
        uint256 maturityDate,
        string issuer,
        uint256 totalSupply,
        address cashToken,
        string prospectusUrl
    );

//    event DebugUint(string message, uint256 value);
//    event DebugAddress(string message, address addr);

    modifier onlyAdminOrOwner() {
        require(msg.sender == owner() || admins[msg.sender], "Bond: Only owner or admin can call this function");
        _;
    }

    // NEW: explicit constants for clarity and correctness 
    uint256 private constant SECONDS_PER_YEAR = 365 days; 
    uint256 private constant RATE_DENOMINATOR = 10_000_000; // couponRate in 0.00001% units; 100% = 10,000,000 

    // Constructor accepts only BondConfig to initialize bond during deployment
    constructor(BondConfig memory _config) ERC20(_config.tokenName, _config.tokenSymbol) Ownable(msg.sender) {
        // If valid bond parameters are provided, initialize the bond
        if (
            _config.totalSupply > 0 &&
            _config.cashToken != address(0) &&
            _config.maturityDate > _config.issueDate
        ) {
            _validateConfig(_config);
            config = _config;
            initialized = true;
            if (_config.couponRate > 0 && _config.couponInterval > 0) {
                uint256 tenure = _config.maturityDate - _config.issueDate;
                couponCount = tenure / _config.couponInterval; // Integer division rounds down
                if (tenure % _config.couponInterval > 0) {
                    couponCount += 1; // Add final coupon at maturity if there's a remainder
                }
            }
            _mint(msg.sender, _config.totalSupply);
            emit BondConfigUpdated(
                _config.tokenName,
                _config.tokenSymbol,
                _config.isinNumber,
                _config.faceValue,
                _config.couponRate,
                _config.couponInterval,
                _config.issueDate,
                _config.maturityDate,
                _config.issuer,
                _config.totalSupply,
                _config.cashToken,
                _config.prospectusUrl
            );
        }
    }

    // Function to create/initialize bond with parameters, callable only if not initialized
    function createBond(BondConfig memory _config) public onlyAdminOrOwner {
        require(!initialized, "Bond: Already initialized");
        require(_config.totalSupply > 0, "Bond: Total supply must be greater than zero");
        require(_config.cashToken != address(0), "Bond: Invalid cash token address");
        require(_config.maturityDate > _config.issueDate, "Bond: Maturity date must be after issue date");

        _validateConfig(_config);
        config = _config;
        initialized = true;
        if (_config.couponRate > 0 && _config.couponInterval > 0) {
            uint256 tenure = _config.maturityDate - _config.issueDate;
            couponCount = tenure / _config.couponInterval; // Integer division rounds down
            if (tenure % _config.couponInterval > 0) {
                couponCount += 1; // Add final coupon at maturity if there's a remainder
            }
        }
        _mint(msg.sender, _config.totalSupply);
        emit BondConfigUpdated(
            _config.tokenName,
            _config.tokenSymbol,
            _config.isinNumber,
            _config.faceValue,
            _config.couponRate,
            _config.couponInterval,
            _config.issueDate,
            _config.maturityDate,
            _config.issuer,
            _config.totalSupply,
            _config.cashToken,
            _config.prospectusUrl
        );
    }

    function updateBondConfig(BondConfig memory _config) public onlyAdminOrOwner {
        // Enforce metadata immutability to avoid on-chain/off-chain mismatch
        require(keccak256(bytes(_config.tokenName)) == keccak256(bytes(name())), "Bond: tokenName immutable");
        require(keccak256(bytes(_config.tokenSymbol)) == keccak256(bytes(symbol())), "Bond: tokenSymbol immutable");
        require(_config.totalSupply >= totalSupply(), "Bond: New total supply cannot be less than current supply");
        _validateConfig(_config);
        config = _config;
        if (_config.couponRate > 0 && _config.couponInterval > 0) {
            uint256 tenure = _config.maturityDate - _config.issueDate;
            couponCount = tenure / _config.couponInterval;
            if (tenure % _config.couponInterval > 0) {
                couponCount += 1; // Add final coupon at maturity
            }
        } else {
            couponCount = 0;
        }
        emit BondConfigUpdated(
            _config.tokenName,
            _config.tokenSymbol,
            _config.isinNumber,
            _config.faceValue,
            _config.couponRate,
            _config.couponInterval,
            _config.issueDate,
            _config.maturityDate,
            _config.issuer,
            _config.totalSupply,
            _config.cashToken,
            _config.prospectusUrl
        );
    }

    // Returns all BondConfig parameters
    function getBondDetails() public view returns (
        string memory tokenName,
        string memory tokenSymbol,
        string memory isinNumber,
        uint256 faceValue,
        uint256 couponRate,
        uint256 couponInterval,
        uint256 issueDate,
        uint256 maturityDate,
        string memory issuer,
        uint256 totalSupply,
        address cashToken,
        string memory prospectusUrl
    ) {
        return (
            config.tokenName,
            config.tokenSymbol,
            config.isinNumber,
            config.faceValue,
            config.couponRate,
            config.couponInterval,
            config.issueDate,
            config.maturityDate,
            config.issuer,
            config.totalSupply,
            config.cashToken,
            config.prospectusUrl
        );
    }

    function _validateConfig(BondConfig memory _config) private pure {
        require(bytes(_config.tokenName).length > 0, "Bond: Token name cannot be empty");
        require(bytes(_config.tokenSymbol).length > 0, "Bond: Token symbol cannot be empty");
        require(bytes(_config.isinNumber).length > 0, "Bond: ISIN number cannot be empty");
        require(_config.maturityDate > _config.issueDate, "Bond: Maturity date must be after issue date");
        // FIX: coupon rules 
        // - If couponRate == 0 then couponInterval must be 0
        // - If couponRate > 0 then couponInterval >= 1 day 
        if ( _config.couponRate == 0) { 
            require (_config.couponInterval == 0, "Bond: couponInterval must be 0 when couponRate is 0"); 
        } else { 
            require(_config.couponInterval > 1 days, "Bond: couponInterval too short"); 
        }

//        require(_config.couponInterval == 0 || _config.couponRate == 0 || _config.couponInterval >= 1 days, "Bond: Invalid coupon interval");
        require(_config.cashToken != address(0), "Bond: Invalid cash token address");
        require(_config.totalSupply > 0, "Bond: Total supply must be greater than zero");
        require(_config.issueDate <= 4102444800, "Bond: Issue date too far in future");
        require(_config.maturityDate <= 4102444800, "Bond: Maturity date too far in future");
        // NOTE: couponRate is in 0.00001% units; 100% = 10,000,000
        require(_config.couponRate <= RATE_DENOMINATOR, "Bond: Coupon rate exceeds 100%"); 
    }

    function mint(address account, uint256 amount) public onlyAdminOrOwner {
        require(totalSupply() + amount <= config.totalSupply, "Bond: Exceeds configured total supply");
        _mint(account, amount);
    }

    function transfer(address recipient, uint256 amount) public override whenNotPaused returns (bool) {
        require(_isActionAllowed(_msgSender()), "Bond: Action restricted");
        require(_isActionAllowed(recipient), "Bond: Action restricted");
        return super.transfer(recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override whenNotPaused returns (bool) {
        require(_isActionAllowed(sender), "Bond: Action restricted");
        require(_isActionAllowed(recipient), "Bond: Action restricted");
        return super.transferFrom(sender, recipient, amount);
    }

    function approve(address spender, uint256 amount) public override whenNotPaused returns (bool) {
        require(_isActionAllowed(_msgSender()), "Bond: Action restricted");
        return super.approve(spender, amount);
    }

    function increaseAllowance(address spender, uint256 addedValue) public whenNotPaused returns (bool) {
        require(_isActionAllowed(_msgSender()), "Bond: Action restricted");
        _approve(_msgSender(), spender, allowance(_msgSender(), spender) + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public whenNotPaused returns (bool) {
        require(_isActionAllowed(_msgSender()), "Bond: Action restricted");
        uint256 currentAllowance = allowance(_msgSender(), spender);
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        _approve(_msgSender(), spender, currentAllowance - subtractedValue);
        return true;
    }

    function _isActionAllowed(address account) private view returns (bool) {
        return (block.timestamp <= config.maturityDate || msg.sender == owner() || admins[msg.sender]) && !_blacklist[account];
    }

    function pause() public onlyAdminOrOwner {
        _pause();
    }

    function unpause() public onlyAdminOrOwner {
        _unpause();
    }

    function manageAdmins(address _admin, bool _add) public onlyOwner {
        require(_admin != address(0), "Bond: Invalid admin address");
        require(admins[_admin] != _add, "Bond: Admin status already set");
        admins[_admin] = _add;
        emit AdminUpdated(_admin, _add);
    }

    function manageBlacklist(address _account, bool _add) public onlyAdminOrOwner {
        require(_account != address(0), "Bond: Cannot blacklist zero address");
        require(_account != owner(), "Bond: Cannot blacklist owner");
        require(!admins[_account], "Bond: Cannot blacklist admin");
        require(_blacklist[_account] != _add, "Bond: Blacklist status already set");
        _blacklist[_account] = _add;
        emit BlacklistUpdated(_account, _add);
    }

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklist[account];
    }

    function payCoupon(uint256 couponIndex, address[] calldata holderList, uint256[] calldata amounts) public onlyAdminOrOwner whenNotPaused nonReentrant {
        require(config.couponRate > 0, "Bond: No coupon payments configured");
        require(couponIndex < couponCount, "Bond: Invalid coupon index");
        require(!_couponPaid[couponIndex], "Bond: Coupon already paid");
        require(block.timestamp >= config.issueDate, "Bond: Coupon payment not started");
        require(block.timestamp <= config.maturityDate, "Bond: Bond has matured");
        require(holderList.length == amounts.length, "Bond: Length mismatch");

        // Calculate the expected coupon payment time
        uint256 couponPaymentTime;
        if (couponIndex == couponCount - 1 && (config.maturityDate - config.issueDate) % config.couponInterval > 0) {
            couponPaymentTime = config.maturityDate; // Last coupon at maturity
        } else {
            couponPaymentTime = config.issueDate + (couponIndex + 1) * config.couponInterval; // Regular coupons
        }
        require(block.timestamp >= couponPaymentTime, "Bond: Coupon period not reached");

        IERC20 cashToken = IERC20(config.cashToken);
        uint8 bondDec = decimals();
        uint8 cashDec = IERC20Metadata(config.cashToken).decimals();

        // Pre-cals total expected to fail early if underfunded
        uint256 totalExpectedCash = 0;

//        uint256 scalingFactor = 10 ** decimals(); // Returns 10^18
//        emit DebugUint("payCoupon(): scalingFactor is:", scalingFactor);
//        emit DebugUint("payCoupon(): faceValue", config.faceValue);
//        emit DebugUint("payCoupon(): couponRate", config.couponRate);
//        emit DebugUint("payCoupon(): couponInterval is:", config.couponInterval);

        for (uint256 i = 0; i < holderList.length; i++) {
            // Optional safety: do not pay blacklisted or zero-amount entries
            if (balanceOf(holderList[i]) == 0 || _blacklist[holderList[i]] || amounts[i] == 0) continue;

            // Sanity: amounts[i] must not exceed current balance (prevents obvious mispayments)
            require(amounts[i] <= balanceOf(holderList[i]), "Bond: amount exceeds holder balance");

            // expected in bond decimals first 
            uint256 expectedBond = Math.mulDiv( 
                amounts[i], 
                config.couponRate * config.couponInterval, 
                SECONDS_PER_YEAR * RATE_DENOMINATOR
            );

            // normalize to cash token decimals 
            uint256 expectedCash = bondDec == cashDec 
            ? expectedBond 
            : Math.mulDiv(expectedBond, 10 ** cashDec, 10 ** bondDec);

            totalExpectedCash += expectedCash;
        }
        require(cashToken.balanceOf(address(this)) >= totalExpectedCash, "Bond: Insufficient cash token balance");

        _couponPaid[couponIndex] = true;


        for (uint256 i = 0; i < holderList.length; i++) {
            address holder = holderList[i];
            if (balanceOf(holder) >0 && !_blacklist[holder] && amounts[i] > 0) {
                // expected in bond decimals first 
                uint256 expectedBond = Math.mulDiv( 
                    amounts[i],
                    config.couponRate * config.couponInterval, 
                    SECONDS_PER_YEAR * RATE_DENOMINATOR
                );

                // normalize to cash token decimals 
                uint256 expectedCash = bondDec == cashDec 
                    ? expectedBond 
                    : Math.mulDiv(expectedBond, 10 ** cashDec, 10 ** bondDec);

                // Safe transfer 
                cashToken.safeTransfer(holder, expectedCash); 
                emit CouponPaid(holder, expectedCash, block.timestamp, couponIndex);
            }
        }
    }

    function isCouponPaid(uint256 couponIndex) public view returns (bool) {
        return _couponPaid[couponIndex];
    }

    function burnAllTokens(address[] calldata holderList) public onlyAdminOrOwner {
        require(block.timestamp > config.maturityDate, "Bond: Cannot burn before maturity");
        for (uint256 i = 0; i < holderList.length; i++) {
            address holder = holderList[i];
            uint256 balance = balanceOf(holder);
            if (balance > 0) {
                _burn(holder, balance);
                emit TokensBurned(holder, balance);
            }
        }
    }

    // Owner rescue functions for operational safety 
    function rescueETH(address payable to, uint256 amount) external onlyOwner { 
        require(to != address(0), "Bond: zero address");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Bond: ETH transfer failed");
    }

    function rescueERC20(address token, address to, uint256 amount) external onlyOwner { 
        require(token != address(this), "Bond: cannot rescue BondToken"); 
        require(to != address(0), "Bond: zero address"); 
        IERC20(token).safeTransfer(to, amount);
    }

    // Override _update to handle both ERC20 and ERC20Pausable
    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Pausable) {
        require(_isActionAllowed(from), "Bond: Action restricted");
        require(_isActionAllowed(to), "Bond: Action restricted");
        super._update(from, to, amount);
    }

    receive() external payable {
        revert("Bond: ETH not allowed");
    }

    fallback() external payable {
        revert("Bond: Fallback not allowed");
    }
}