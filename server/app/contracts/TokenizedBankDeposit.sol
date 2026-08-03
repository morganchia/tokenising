// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

// Smart Contract for Tokenized Bank Deposit (unchanged, for reference)
contract TokenizedBankDeposit is Initializable, ERC20Upgradeable, OwnableUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    uint256 public constant DECIMALS = 18;

    uint256[50] private __gap;

    event DepositMinted(address indexed depositor, uint256 amount, uint256 fiatAmount);
    event DepositRedeemed(address indexed redeemer, uint256 amount, uint256 fiatAmount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory name, string memory symbol) public initializer {
        __ERC20_init(name, symbol);
        __Ownable_init(msg.sender);
        __Pausable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function mint(address to, uint256 amount) external onlyOwner whenNotPaused {
        _mint(to, amount);
        emit DepositMinted(to, amount, amount / (10 ** DECIMALS));
    }

    function redeem(uint256 amount) external whenNotPaused {
        _burn(msg.sender, amount);
        emit DepositRedeemed(msg.sender, amount, amount / (10 ** DECIMALS));
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}