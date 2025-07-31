// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

//import "@openzeppelin/contracts@5.0.2/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts@5.0.2/token/ERC20/IERC20.sol";
//import "@openzeppelin/contracts@5.0.2/access/Ownable.sol";
//import "@openzeppelin/contracts@5.0.2/token/ERC20/extensions/ERC20Pausable.sol";
//import "@openzeppelin/contracts@5.0.2/utils/Strings.sol";

contract BondToken is ERC20, ERC20Pausable, Ownable {
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

    function _validateConfig(BondConfig memory _config) private pure {
        require(bytes(_config.tokenName).length > 0, "Bond: Token name cannot be empty");
        require(bytes(_config.tokenSymbol).length > 0, "Bond: Token symbol cannot be empty");
        require(bytes(_config.isinNumber).length > 0, "Bond: ISIN number cannot be empty");
        require(_config.maturityDate > _config.issueDate, "Bond: Maturity date must be after issue date");
        require(_config.couponInterval == 0 || _config.couponRate == 0 || _config.couponInterval >= 1 days, "Bond: Invalid coupon interval");
        require(_config.cashToken != address(0), "Bond: Invalid cash token address");
        require(_config.totalSupply > 0, "Bond: Total supply must be greater than zero");
        require(_config.issueDate <= 4102444800, "Bond: Issue date too far in future");
        require(_config.maturityDate <= 4102444800, "Bond: Maturity date too far in future");
        require(_config.couponRate <= 10000000, "Bond: Coupon rate exceeds 100%"); // 100% = 10,000,000 in 0.001%
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

    function payCoupon(uint256 couponIndex, address[] calldata holderList, uint256[] calldata amounts) public onlyAdminOrOwner whenNotPaused {
        require(config.couponRate > 0, "Bond: No coupon payments configured");
        require(couponIndex < couponCount, "Bond: Invalid coupon index");
        require(!_couponPaid[couponIndex], "Bond: Coupon already paid");
        require(block.timestamp >= config.issueDate, "Bond: Coupon payment not started");
        require(block.timestamp <= config.maturityDate, "Bond: Bond has matured");
        
        // Calculate the expected coupon payment time
        uint256 couponPaymentTime;
        if (couponIndex == couponCount - 1 && (config.maturityDate - config.issueDate) % config.couponInterval > 0) {
            couponPaymentTime = config.maturityDate; // Last coupon at maturity
        } else {
            couponPaymentTime = config.issueDate + (couponIndex + 1) * config.couponInterval; // Regular coupons
        }
        require(block.timestamp >= couponPaymentTime, "Bond: Coupon period not reached");

        _couponPaid[couponIndex] = true;
        IERC20 cashToken = IERC20(config.cashToken);
        uint256 scalingFactor = 10 ** decimals(); // Returns 10^18
//        emit DebugUint("payCoupon(): scalingFactor is:", scalingFactor);
//        emit DebugUint("payCoupon(): faceValue", config.faceValue);
//        emit DebugUint("payCoupon(): couponRate", config.couponRate);
//        emit DebugUint("payCoupon(): couponInterval is:", config.couponInterval);

        for (uint256 i = 0; i < holderList.length; i++) {
            address holder = holderList[i];
            if (balanceOf(holder) > 0 && !_blacklist[holder]) {
                // Calculate coupon: (amount * couponRate * couponInterval) / (31536000 * 1000000)
                // couponRate is in 0.001% (10^6 units), so divide by 10^6
                uint256 expectedAmount = (amounts[i] * config.couponRate * config.couponInterval) / (31536000 * 1000000);

//                emit DebugUint("payCoupon(): balanceOf(holder)", balanceOf(holder));
//                emit DebugUint("payCoupon(): expectedAmount is:", expectedAmount);
//                emit DebugUint("payCoupon(): amounts[i] is:", amounts[i]);

                string memory errormsg2 = string(abi.encodePacked("Bond: Insufficient cash token balance. Balance=", Strings.toString(cashToken.balanceOf(address(this))), ", Required=", Strings.toString(expectedAmount)));
                require(cashToken.balanceOf(address(this)) >= expectedAmount, errormsg2);
                require(cashToken.transfer(holder, expectedAmount), "Bond: Cash token transfer failed");

                emit CouponPaid(holder, expectedAmount, block.timestamp, couponIndex);
            }
        }
    }

    function isCouponPaid(uint256 couponIndex) public view returns (bool) {
        return _couponPaid[couponIndex];
    }

    function burnAllTokens(address[] calldata holderList) public onlyAdminOrOwner {
        require(block.timestamp > config.maturityDate, "Error: Cannot burn before maturity");
        for (uint256 i = 0; i < holderList.length; i++) {
            address holder = holderList[i];
            uint256 balance = balanceOf(holder);
            if (balance > 0) {
                _burn(holder, balance);
                emit TokensBurned(holder, balance);
            }
        }
    }

    // Override _update to handle both ERC20 and ERC20Pausable
    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Pausable) {
        require(_isActionAllowed(from), "Bond: Action restricted");
        require(_isActionAllowed(to), "Bond: Action restricted");
        super._update(from, to, amount);
    }

    receive() external payable {
        revert("Bond: Delegatecall not allowed");
    }

    fallback() external payable {
        revert("Bond: Delegatecall not allowed");
    }
}