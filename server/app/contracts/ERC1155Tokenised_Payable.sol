// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./ERC20TokenDSGD.sol";  // Import the deposit contract

contract TokenizedPayable is ERC1155, Ownable, Pausable {
    using EnumerableSet for EnumerableSet.UintSet;

    ERC20TokenDSGD public depositContract;

    struct Payable {
        uint256 value;
        uint256 maturityDate;
        bool realized;
        address issuer;
        string conditions;
        uint256 escrowedDeposit;
        uint256 milestoneId;  // New: Groups payables by milestone
    }

    mapping(uint256 => Payable) public payables; // Token ID => Payable
    mapping(uint256 => EnumerableSet.UintSet) private milestoneToTokens; // Milestone ID => Set of token IDs
    EnumerableSet.UintSet private tokenIds;
    mapping(uint256 => address) public tokenOwners; // Track owner per token ID (NFT-like)
    uint256 private nextTokenId = 1;  // Start from 1

    event PayableCreated(uint256 indexed id, uint256 value, uint256 maturityDate, address issuer, uint256 milestoneId);
    event PayableSplit(uint256 indexed originalId, uint256 newId, uint256 splitValue);
    event PayableRealized(uint256 indexed id, address holder);
    event PayableTransferred(uint256 indexed id, address from, address to, uint256 amount);
    event WrappedDeposit(uint256 indexed id, uint256 depositAmount, uint256 milestoneId);
    event UnwrappedDeposit(uint256 indexed id, uint256 depositAmount, address holder);
    event MilestoneRealized(uint256 indexed milestoneId, uint256 tokenCount);

    constructor(string memory uri, address _depositContract) ERC1155(uri) Ownable(msg.sender) {
        depositContract = ERC20TokenDSGD(_depositContract);
    }

    // Create a new tokenized payable with milestone grouping without wrapping/escrow
    function createPayable(
        uint256 value,
        uint256 maturityDate,
        string memory conditions,
        uint256 milestoneId
    ) external onlyOwner whenNotPaused returns (uint256 id) {
        id = nextTokenId++;
        require(payables[id].value == 0, "Payable ID already exists");
        payables[id] = Payable({
            value: value,
            maturityDate: maturityDate,
            realized: false,
            issuer: msg.sender,
            conditions: conditions,
            escrowedDeposit: 0,
            milestoneId: milestoneId
        });
        _mint(msg.sender, id, 1, "");
        tokenOwners[id] = msg.sender;
        tokenIds.add(id);
        milestoneToTokens[milestoneId].add(id);
        emit PayableCreated(id, value, maturityDate, msg.sender, milestoneId);
        return id;
    }

    // Wrap: Escrow deposit tokens and mint a payable with milestone
    function wrapDepositToPayable(
        uint256 depositAmount,
        uint256 maturityDate,
        string memory conditions,
        uint256 milestoneId
    ) external whenNotPaused returns (uint256 id) {
        if (depositAmount > 0) {  // Optional escrow
            depositContract.transferFrom(msg.sender, address(this), depositAmount);
        }
        
        id = nextTokenId++;
        payables[id] = Payable({
            value: depositAmount,  // Or separate value param if non-1:1
            maturityDate: maturityDate,
            realized: false,
            issuer: msg.sender,
            conditions: conditions,
            escrowedDeposit: depositAmount,
            milestoneId: milestoneId
        });
        _mint(msg.sender, id, 1, "");
        tokenIds.add(id);
        milestoneToTokens[milestoneId].add(id);
        emit WrappedDeposit(id, depositAmount, milestoneId);
        emit PayableCreated(id, depositAmount, maturityDate, msg.sender, milestoneId);
        return id;
    }

    // Split a payable (inherits milestoneId)
    function splitPayable(uint256 originalId, uint256 splitValue) external whenNotPaused returns (uint256 newId) {
        require(balanceOf(msg.sender, originalId) == 1, "Not owner of payable");
        require(splitValue < payables[originalId].value, "Split value too large");

        newId = nextTokenId++;  // Auto-increment new ID

        uint256 splitEscrow = (splitValue * payables[originalId].escrowedDeposit) / payables[originalId].value;

        payables[originalId].value -= splitValue;
        payables[originalId].escrowedDeposit -= splitEscrow;

        uint256 milestoneId = payables[originalId].milestoneId;  // Inherit milestone
        payables[newId] = Payable({
            value: splitValue,
            maturityDate: payables[originalId].maturityDate,
            realized: false,
            issuer: payables[originalId].issuer,
            conditions: payables[originalId].conditions,
            escrowedDeposit: splitEscrow,
            milestoneId: milestoneId
        });
        _mint(msg.sender, newId, 1, "");
        tokenIds.add(newId);
        milestoneToTokens[milestoneId].add(newId);
        emit PayableSplit(originalId, newId, splitValue);
    }

    // Realize all payables for a milestone (OR time/milestone per payable)
    function realizeMilestone(uint256 milestoneId) external onlyOwner whenNotPaused {
        uint256[] memory tokens = milestoneToTokens[milestoneId].values();
        uint256 count = 0;

        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 id = tokens[i];
            if (payables[id].realized) continue;  // Skip already realized

            bool timeMet = block.timestamp >= payables[id].maturityDate;
            bool milestoneMet = true;  // Assume milestone completion unlocks all in group; customize if needed
            if (timeMet || milestoneMet) {
                payables[id].realized = true;
                emit PayableRealized(id, tokenOwners[id]);
                count++;
            }
        }

        emit MilestoneRealized(milestoneId, count);
    }

    // Unwrap: Burn payable and release escrowed deposit if realized
    function unwrapToDeposit(uint256 id) external whenNotPaused {
        require(balanceOf(msg.sender, id) == 1, "Not owner of payable");
        require(payables[id].realized, "Not realized");

        uint256 escrowed = payables[id].escrowedDeposit;
        uint256 milestoneId = payables[id].milestoneId;
        _burn(msg.sender, id, 1);
        delete payables[id];
        tokenIds.remove(id);
        milestoneToTokens[milestoneId].remove(id);
        delete tokenOwners[id];

        depositContract.transfer(msg.sender, escrowed);
        emit UnwrappedDeposit(id, escrowed, msg.sender);
    }

    // Override safeTransferFrom to emit custom event
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) public override {
        super.safeTransferFrom(from, to, id, amount, data);
        if (amount == 1) {
            tokenOwners[id] = to;
        }
        emit PayableTransferred(id, from, to, amount);
    }

    // Pause for compliance
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Helper to get all token IDs for a milestone
    function getTokensForMilestone(uint256 milestoneId) external view returns (uint256[] memory) {
        return milestoneToTokens[milestoneId].values();
    }

    // Helper to get all token IDs
    function getAllTokenIds() external view returns (uint256[] memory) {
        return tokenIds.values();
    }
}