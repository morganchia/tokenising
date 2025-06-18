// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BondToken is ERC20, ERC20Pausable, Ownable {
    // Bond-specific fields
    struct BondConfig {
        string securityName;
        string isinNumber;
        uint256 faceValue;
        uint256 couponRate; // In basis points (e.g., 500 = 5%)
        uint256 couponInterval; // In seconds
        uint256 issueDate;
        uint256 maturityDate;
        string issuer;
        uint256 totalIssueSize;
        string prospectusUrl;
    }

    BondConfig public config;
    IERC20 public cashToken; // Token used for coupon payments
    mapping(address => bool) private _blacklist;
    mapping(address => bool) private _admins;
    mapping(uint256 => bool) private _couponPaid;
    uint256 public couponCount;

    // Events
    event CouponPaid(address indexed to, uint256 amount, uint256 timestamp, uint256 couponIndex);
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
        uint256 totalIssueSize,
        address cashToken,
        string prospectusUrl
    );

    modifier onlyOwnerOrAdmin() {
        require(_msgSender() == owner() || _admins[_msgSender()], "Bond: Caller is not owner or admin");
        _;
    }

    constructor(
        string memory _securityName,
        string memory _isinNumber,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _faceValue,
        uint256 _couponRate,
        uint256 _couponInterval,
        uint256 _issueDate,
        uint256 _maturityDate,
        string memory _issuer,
        uint256 _totalIssueSize,
        address _cashToken,
        string memory _prospectusUrl
    ) ERC20(_tokenName, _tokenSymbol) Ownable() {
        require(_maturityDate > _issueDate, "Bond: Maturity date must be after issue date");
        require(_couponInterval == 0 || _couponRate == 0 || _couponInterval >= 1 days, "Bond: Invalid coupon interval");
        require(_cashToken != address(0), "Bond: Invalid cash token address");

        config = BondConfig({
            securityName: _securityName,
            isinNumber: _isinNumber,
            faceValue: _faceValue,
            couponRate: _couponRate,
            couponInterval: _couponInterval,
            issueDate: _issueDate,
            maturityDate: _maturityDate,
            issuer: _issuer,
            totalIssueSize: _totalIssueSize,
            prospectusUrl: _prospectusUrl
        });

        cashToken = IERC20(_cashToken);

        if (_couponRate > 0 && _couponInterval > 0) {
            uint256 tenure = _maturityDate - _issueDate;
            couponCount = tenure / _couponInterval + (tenure % _couponInterval > 0 ? 1 : 0);
        }

        _mint(msg.sender, _totalIssueSize);
    }

    function updateBondConfig(
        string memory _securityName,
        string memory _isinNumber,
        uint256 _faceValue,
        uint256 _couponRate,
        uint256 _couponInterval,
        uint256 _issueDate,
        uint256 _maturityDate,
        string memory _issuer,
        uint256 _totalIssueSize,
        address _cashToken,
        string memory _prospectusUrl
    ) public onlyOwner {
        require(_maturityDate > _issueDate, "Bond: Maturity date must be after issue date");
        require(_couponInterval == 0 || _couponRate == 0 || _couponInterval >= 1 days, "Bond: Invalid coupon interval");
        require(_cashToken != address(0), "Bond: Invalid cash token address");
        require(_totalIssueSize >= totalSupply(), "Bond: Total issue size cannot be less than current supply");

        // Update config
        config = BondConfig({
            securityName: _securityName,
            isinNumber: _isinNumber,
            faceValue: _faceValue,
            couponRate: _couponRate,
            couponInterval: _couponInterval,
            issueDate: _issueDate,
            maturityDate: _maturityDate,
            issuer: _issuer,
            totalIssueSize: _totalIssueSize,
            prospectusUrl: _prospectusUrl
        });

        // Update cash token
        cashToken = IERC20(_cashToken);

        // Recalculate coupon count
        if (_couponRate > 0 && _couponInterval > 0) {
            uint256 tenure = _maturityDate - _issueDate;
            couponCount = tenure / _couponInterval + (tenure % _couponInterval > 0 ? 1 : 0);
        } else {
            couponCount = 0;
        }

        // Emit event
        emit BondConfigUpdated(
            _securityName,
            _isinNumber,
            _faceValue,
            _couponRate,
            _couponInterval,
            _issueDate,
            _maturityDate,
            _issuer,
            _totalIssueSize,
            _cashToken,
            _prospectusUrl
        );
    }

    function transfer(address recipient, uint256 amount) public override whenNotPaused returns (bool) {
        require(_isActionAllowed(_msgSender()), "Bond: Action restricted");
        return super.transfer(recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override whenNotPaused returns (bool) {
        require(_isActionAllowed(sender), "Bond: Action restricted");
        return super.transferFrom(sender, recipient, amount);
    }

    function approve(address spender, uint256 amount) public override whenNotPaused returns (bool) {
        require(_isActionAllowed(_msgSender()), "Bond: Action restricted");
        return super.approve(spender, amount);
    }

    function increaseAllowance(address spender, uint256 addedValue) public override whenNotPaused returns (bool) {
        require(_isActionAllowed(_msgSender()), "Bond: Action restricted");
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public override whenNotPaused returns (bool) {
        require(_isActionAllowed(_msgSender()), "Bond: Action restricted");
        return super.decreaseAllowance(spender, subtractedValue);
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
        uint256 couponPerToken = (config.faceValue * config.couponRate) / 10000;

        for (uint256 i = 0; i < holderList.length; i++) {
            address holder = holderList[i];
            if (balanceOf(holder) > 0 && !_blacklist[holder]) {
                uint256 expectedAmount = (couponPerToken * balanceOf(holder)) / 1e18;
                require(amounts[i] == expectedAmount, "Bond: Invalid coupon amount");
                require(cashToken.balanceOf(address(this)) >= amounts[i], "Bond: Insufficient cash token balance");
                require(cashToken.transfer(holder, amounts[i]), "Bond: Cash token transfer failed");
                emit CouponPaid(holder, amounts[i], block.timestamp, couponIndex);
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

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
        require(_isActionAllowed(from), "Bond: Action restricted");
    }

    receive() external payable {
        revert("Bond: Delegatecall not allowed");
    }

    fallback() external payable {
        revert("Bond: Delegatecall not allowed");
    }
}