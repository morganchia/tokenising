// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// Smart Contract for Tokenized Bank Deposit
// This is an ERC20 token representing tokenized bank deposits. It can be minted by the owner (bank) when fiat is deposited,
// and burned/redeemed for fiat withdrawal. It includes pausability for compliance.
contract TokenizedBankDeposit is ERC20, Ownable, Pausable {
    uint256 public constant DECIMALS = 18; // Matches standard ERC20 for fiat representation (e.g., USD with 18 decimals)

    event DepositMinted(address indexed depositor, uint256 amount, uint256 fiatAmount);
    event DepositRedeemed(address indexed redeemer, uint256 amount, uint256 fiatAmount);

    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}

    // Mint tokens when fiat is deposited (only owner/bank can call)
    function mint(address to, uint256 amount) external onlyOwner whenNotPaused {
        _mint(to, amount);
        emit DepositMinted(to, amount, amount / (10 ** DECIMALS)); // Assuming 1:1 fiat to token ratio
    }

    // Burn tokens for fiat redemption (user calls, but owner approves off-chain)
    function redeem(uint256 amount) external whenNotPaused {
        _burn(msg.sender, amount);
        emit DepositRedeemed(msg.sender, amount, amount / (10 ** DECIMALS));
        // Off-chain: Bank transfers fiat to user
    }

    // Pause contract for emergencies (e.g., compliance issues)
    function pause() external onlyOwner {
        _pause();
    }

    // Unpause contract
    function unpause() external onlyOwner {
        _unpause();
    }
}