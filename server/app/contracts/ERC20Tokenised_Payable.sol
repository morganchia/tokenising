// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Smart Contract for Tokenized Payable
// This uses ERC1155 for splittability (multi-token IDs for different payables). Each token ID represents a unique payable/receivable.
// Conditions are enforced via smart contract logic (e.g., locked until maturity or milestone). Supports splitting/transfers for deep tiers.
contract TokenizedPayable is ERC1155, Ownable, Pausable {
    using EnumerableSet for EnumerableSet.UintSet;

    struct Payable {
        uint256 value;          // Face value in wei
        uint256 maturityDate;   // Unix timestamp for maturity
        bool realized;          // True if conditions met and unlocked
        address issuer;         // Anchor or upstream issuer
        string conditions;      // Metadata for conditions (e.g., JSON string for milestones)
    }

    mapping(uint256 => Payable) public payables; // Token ID => Payable details
    EnumerableSet.UintSet private tokenIds;     // Track all token IDs

    event PayableCreated(uint256 indexed id, uint256 value, uint256 maturityDate, address issuer);
    event PayableSplit(uint256 indexed originalId, uint256 newId, uint256 splitValue);
    event PayableRealized(uint256 indexed id, address holder);
    event PayableTransferred(uint256 indexed id, address from, address to, uint256 amount);

    constructor(string memory uri) ERC1155(uri) Ownable(msg.sender) {}

    // Create a new tokenized payable (mint as ERC1155 with amount=1 for non-fungible-like behavior, but splittable)
    function createPayable(
        uint256 id,
        uint256 value,
        uint256 maturityDate,
        string memory conditions
    ) external onlyOwner whenNotPaused {
        require(payables[id].value == 0, "Payable ID already exists");
        payables[id] = Payable({
            value: value,
            maturityDate: maturityDate,
            realized: false,
            issuer: msg.sender,
            conditions: conditions
        });
        _mint(msg.sender, id, 1, ""); // Mint 1 unit (non-fungible for payable)
        tokenIds.add(id);
        emit PayableCreated(id, value, maturityDate, msg.sender);
    }

    // Split a payable into a new one (for downstream transfers)
    function splitPayable(uint256 originalId, uint256 splitValue, uint256 newId) external whenNotPaused {
        require(balanceOf(msg.sender, originalId) == 1, "Not owner of payable");
        require(splitValue < payables[originalId].value, "Split value too large");
        require(payables[newId].value == 0, "New ID already exists");

        payables[originalId].value -= splitValue;
        payables[newId] = Payable({
            value: splitValue,
            maturityDate: payables[originalId].maturityDate,
            realized: false,
            issuer: payables[originalId].issuer,
            conditions: payables[originalId].conditions
        });
        _mint(msg.sender, newId, 1, "");
        tokenIds.add(newId);
        emit PayableSplit(originalId, newId, splitValue);
    }

    // Realize (unlock) the payable if conditions met (e.g., via oracle or owner confirmation)
    function realizePayable(uint256 id) external onlyOwner whenNotPaused {
        require(block.timestamp >= payables[id].maturityDate, "Not matured");
        require(!payables[id].realized, "Already realized");
        payables[id].realized = true;
        emit PayableRealized(id, ownerOf(id)); // Assuming single owner
        // Funds can now be redeemed off-chain or via integrated escrow
    }

    // Override safeTransferFrom to emit custom event
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) public override {
        super.safeTransferFrom(from, to, id, amount, data);
        emit PayableTransferred(id, from, to, amount);
    }

    // Pause for compliance
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Helper to get all token IDs
    function getAllTokenIds() external view returns (uint256[] memory) {
        return tokenIds.values();
    }
}
