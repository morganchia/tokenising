// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
//import "./TokenizedBankDeposit.sol";  // Import the deposit contract
import "./ERC20TokenDSGD.sol"; 

// Smart Contract for Tokenized Payable (updated for escrow integration)
contract TokenizedPayable is ERC1155, Ownable, Pausable {
    using EnumerableSet for EnumerableSet.UintSet;

//  TokenizedBankDeposit public depositContract;  // Reference to the TokenizedBankDeposit contract
    ERC20TokenDSGD public depositContract;  // Reference to the ERC20TokenDSGD contract

    struct Payable {
        uint256 value;          // Face value in wei
        uint256 maturityDate;   // Unix timestamp for maturity
        bool realized;          // True if conditions met and unlocked
        address issuer;         // Anchor or upstream issuer
        string conditions;      // Metadata for conditions (e.g., JSON string for milestones)
        uint256 escrowedDeposit;  // Amount of escrowed deposit tokens
    }

    mapping(uint256 => Payable) public payables; // Token ID => Payable details
    EnumerableSet.UintSet private tokenIds;     // Track all token IDs

    event PayableCreated(uint256 indexed id, uint256 value, uint256 maturityDate, address issuer);
    event PayableSplit(uint256 indexed originalId, uint256 newId, uint256 splitValue);
    event PayableRealized(uint256 indexed id, address holder);
    event PayableTransferred(uint256 indexed id, address from, address to, uint256 amount);
    event WrappedDeposit(uint256 indexed id, uint256 depositAmount);
    event UnwrappedDeposit(uint256 indexed id, uint256 depositAmount, address holder);
    event MilestoneUpdated(uint256 id, bool completed);

    constructor(string memory uri, address _depositContract) ERC1155(uri) Ownable(msg.sender) {
//      depositContract = TokenizedBankDeposit(_depositContract);
        depositContract = ERC20TokenDSGD(_depositContract);
    }

    function setMilestoneCompleted(uint256 id, bool completed) external onlyOwner {
        require(payables[id].value > 0, "Payable does not exist");
        payables[id].milestoneCompleted = completed;
        emit MilestoneUpdated(id, completed);  // New event: event MilestoneUpdated(uint256 indexed id, bool completed);
    }

    // Create a new tokenized payable (mint as ERC1155 with amount=1)
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
            conditions: conditions,
            escrowedDeposit: 0  // Initially no escrow
        });
        _mint(msg.sender, id, 1, "");
        tokenIds.add(id);
        emit PayableCreated(id, value, maturityDate, msg.sender);
    }

    // Wrap: Escrow deposit tokens and mint a payable
    function wrapDepositToPayable(
        uint256 id,
        uint256 depositAmount,
        uint256 maturityDate,
        string memory conditions
    ) external whenNotPaused {
        // Transfer deposit tokens to this contract (escrow)
        depositContract.transferFrom(msg.sender, address(this), depositAmount);
        
        // Create the payable
        require(payables[id].value == 0, "Payable ID already exists");
        payables[id] = Payable({
            value: depositAmount,  // Value matches escrowed amount
            maturityDate: maturityDate,
            realized: false,
            issuer: msg.sender,
            conditions: conditions,
            escrowedDeposit: depositAmount
        });
        _mint(msg.sender, id, 1, "");
        tokenIds.add(id);
        emit WrappedDeposit(id, depositAmount);
        emit PayableCreated(id, depositAmount, maturityDate, msg.sender);
    }

    // Split a payable into a new one (for downstream transfers)
    function splitPayable(uint256 originalId, uint256 splitValue, uint256 newId) external whenNotPaused {
        require(balanceOf(msg.sender, originalId) == 1, "Not owner of payable");
        require(splitValue < payables[originalId].value, "Split value too large");
        require(payables[newId].value == 0, "New ID already exists");

        // Pro-rate escrowed deposit for the split
        uint256 splitEscrow = (splitValue * payables[originalId].escrowedDeposit) / payables[originalId].value;

        payables[originalId].value -= splitValue;
        payables[originalId].escrowedDeposit -= splitEscrow;

        payables[newId] = Payable({
            value: splitValue,
            maturityDate: payables[originalId].maturityDate,
            realized: false,
            issuer: payables[originalId].issuer,
            conditions: payables[originalId].conditions,
            escrowedDeposit: splitEscrow
        });
        _mint(msg.sender, newId, 1, "");
        tokenIds.add(newId);
        emit PayableSplit(originalId, newId, splitValue);
    }

    // Realize (unlock) the payable if conditions met (e.g., via oracle or owner confirmation)
    function realizePayable(uint256 id) external onlyOwner whenNotPaused {
        require(block.timestamp >= payables[id].maturityDate, "Not matured");
        require(!payables[id].realized, "Already realized");
        require(payables[id].milestoneCompleted, "Milestone not completed");
        payables[id].realized = true;
        emit PayableRealized(id, ownerOf(id));
    }

    // Unwrap: Burn payable and release escrowed deposit if realized
    function unwrapToDeposit(uint256 id) external whenNotPaused {
        require(balanceOf(msg.sender, id) == 1, "Not owner of payable");
        require(payables[id].realized, "Not realized");

        uint256 escrowed = payables[id].escrowedDeposit;
        _burn(msg.sender, id, 1);
        delete payables[id];  // Clean up
        tokenIds.remove(id);

        depositContract.transfer(msg.sender, escrowed);
        emit UnwrappedDeposit(id, escrowed, msg.sender);
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