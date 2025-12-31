// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// Smart Contract for Tokenized Bank Deposit (unchanged, for reference)
contract TokenizedBankDeposit is ERC20, Ownable, Pausable {
    uint256 public constant DECIMALS = 18;

    event DepositMinted(address indexed depositor, uint256 amount, uint256 fiatAmount);
    event DepositRedeemed(address indexed redeemer, uint256 amount, uint256 fiatAmount);

    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}

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