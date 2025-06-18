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
        string securityName;
        string isinNumber;
        uint256 faceValue; // Scaled by 10^18 (e.g., 100.5 * 10^18)
        uint256 couponRate; // In basis points (e.g., 500 = 5%)
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
    mapping(address => bool) private _admins;
    mapping(uint256 => bool) private _couponPaid;
    uint256 public couponCount;

    // Events
    event CouponPaid(address indexed to, uint256 couponpaid, uint256 timestamp, uint256 couponIndex);
    event Blacklisted(address indexed account);
    event Unblacklisted(address indexed account);
    event TokensBurned(address indexed account, uint256 amount);
    event AdminAdded(address indexed account);
    event AdminRemoved(address indexed account);
    event BondConfigUpdated(
        string securityName,
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

    event DebugUint(string message, uint256 value);
    event DebugAddress(string message, address addr);

    modifier onlyOwnerOrAdmin() {
        require(_msgSender() == owner() || _admins[_msgSender()], "Bond: Caller is not owner or admin");
        _;
    }

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol,
        BondConfig memory _config
    ) ERC20(_tokenName, _tokenSymbol) Ownable(msg.sender) {
        require(_config.totalSupply > 0, "Bond: Total supply must be greater than zero");
        _validateConfig(_config);
        config = _config;
        if (_config.couponRate > 0 && _config.couponInterval > 0) {
            uint256 tenure = _config.maturityDate - _config.issueDate;
            couponCount = tenure / _config.couponInterval + (tenure % _config.couponInterval > 0 ? 1 : 0);
        }
        _mint(msg.sender, _config.totalSupply);
    }

    function updateBondConfig(BondConfig memory _config) public onlyOwner {
        require(_config.totalSupply >= totalSupply(), "Bond: New total supply cannot be less than current supply");
        _validateConfig(_config);
        config = _config;
        if (_config.couponRate > 0 && _config.couponInterval > 0) {
            uint256 tenure = _config.maturityDate - _config.issueDate;
            couponCount = tenure / _config.couponInterval + (tenure % _config.couponInterval > 0 ? 1 : 0);
        } else {
            couponCount = 0;
        }
        emit BondConfigUpdated(
            _config.securityName,
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
        require(_config.maturityDate > _config.issueDate, "Bond: Maturity date must be after issue date");
        require(_config.couponInterval == 0 || _config.couponRate == 0 || _config.couponInterval >= 1 days, "Bond: Invalid coupon interval");
        require(_config.cashToken != address(0), "Bond: Invalid cash token address");
        require(_config.totalSupply > 0, "Bond: Total supply must be greater than zero");
        // Ensure dates are reasonable (e.g., not beyond year 2100, i.e., 4102444800 seconds)
        require(_config.issueDate <= 4102444800, "Bond: Issue date too far in future");
        require(_config.maturityDate <= 4102444800, "Bond: Maturity date too far in future");
    }

    function mint(address account, uint256 amount) public onlyOwner {
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
        return (block.timestamp <= config.maturityDate || _msgSender() == owner() || _admins[_msgSender()]) && !_blacklist[account];
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function addAdmin(address account) public onlyOwner {
        require(account != address(0), "Bond: Cannot add zero address as admin");
        require(!_admins[account], "Bond: Account is already an admin");
        _admins[account] = true;
        emit AdminAdded(account);
    }

    function removeAdmin(address account) public onlyOwner {
        require(_admins[account], "Bond: Account is not an admin");
        _admins[account] = false;
        emit AdminRemoved(account);
    }

    function isAdmin(address account) public view returns (bool) {
        return _admins[account];
    }

    function payCoupon(uint256 couponIndex, address[] calldata holderList, uint256[] calldata amounts) public onlyOwnerOrAdmin {
        require(config.couponRate > 0, "Bond: No coupon payments configured");
        require(couponIndex < couponCount, "Bond: Invalid coupon index");
        require(!_couponPaid[couponIndex], "Bond: Coupon already paid");
        require(block.timestamp >= config.issueDate, "Bond: Coupon payment not started");
        require(block.timestamp <= config.maturityDate, "Bond: Bond has matured");
        require(block.timestamp >= config.issueDate + (couponIndex * config.couponInterval), "Bond: Coupon period not reached");
        require(holderList.length == amounts.length, "Bond: Invalid input lengths");

        _couponPaid[couponIndex] = true;
        IERC20 cashToken = IERC20(config.cashToken);
        //uint256 couponPerToken = (config.faceValue * config.couponRate) / 10000;
        uint256 scalingFactor = 10 ** decimals(); // Returns 10^18
        //emit DebugUint("payCoupon(): couponPerToken is:", couponPerToken);
        emit DebugUint("payCoupon(): scalingFactor is:", scalingFactor);
        emit DebugUint("payCoupon(): faceValue", config.faceValue);
        emit DebugUint("payCoupon(): couponRate", config.couponRate);
        emit DebugUint("payCoupon(): couponInterval is:", config.couponInterval);

        for (uint256 i = 0; i < holderList.length; i++) {
            address holder = holderList[i];
            if (balanceOf(holder) > 0 && !_blacklist[holder]) {
                uint256 couponAdjustment = 0;
                if (config.couponInterval == 31536000) {
                    couponAdjustment = 12;
                } else if (config.couponInterval == 15768000) {
                    couponAdjustment = 6;
                } else if (config.couponInterval == 7884000) {
                    couponAdjustment = 3;
                } else if (config.couponInterval == 2628000) {
                    couponAdjustment = 1;
                }

                // Correct formula expectedAmount = (amounts[i]) * (config.couponRate / 10000) * (couponAdjustment / 12);
                // rearrange to avoid becoming decimals ==> 0
                uint256 expectedAmount = (amounts[i] * config.couponRate * couponAdjustment) / (12 * 10000);

                emit DebugUint("payCoupon(): balanceOf(holder)", balanceOf(holder));
                emit DebugUint("payCoupon(): couponAdjustment is:", couponAdjustment);
                emit DebugUint("payCoupon(): expectedAmount is:", expectedAmount);
                emit DebugUint("payCoupon(): amounts[i] is:", amounts[i]);

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

    function burnAllTokens(address[] calldata holderList) public onlyOwnerOrAdmin {
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

    function addToBlacklist(address account) public onlyOwnerOrAdmin {
        require(account != address(0), "Bond: Cannot blacklist zero address");
        require(account != owner(), "Bond: Cannot blacklist owner");
        require(!_admins[account], "Bond: Cannot blacklist admin");
        _blacklist[account] = true;
        emit Blacklisted(account);
    }

    function removeFromBlacklist(address account) public onlyOwnerOrAdmin {
        require(_blacklist[account], "Bond: Account not blacklisted");
        _blacklist[account] = false;
        emit Unblacklisted(account);
    }

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklist[account];
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