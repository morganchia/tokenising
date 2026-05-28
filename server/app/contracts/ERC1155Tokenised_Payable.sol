// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./ERC20TokenDSGD.sol";

contract TokenizedPayable is Initializable, ERC1155Upgradeable, OwnableUpgradeable, PausableUpgradeable, UUPSUpgradeable, MulticallUpgradeable {
    using EnumerableSet for EnumerableSet.UintSet;

    ERC20TokenDSGD public depositContract;

    // escrowCommitment = keccak256(abi.encodePacked(escrowAmount, salt))
    // The plaintext amount and salt are stored off-chain (server DB + Lit-encrypted metadata).
    // conditions are removed from on-chain storage entirely — they live in Lit-encrypted metadata.
    struct Payable {
        bytes32 escrowCommitment;
        uint256 maturityDate;
        bool realized;
        address issuer;
        uint256 milestoneId;
    }

    mapping(uint256 => Payable) public payables;
    mapping(uint256 => EnumerableSet.UintSet) private milestoneToTokens;
    mapping(uint256 => string) private _tokenURIs;
    EnumerableSet.UintSet private tokenIds;
    mapping(uint256 => address) public tokenOwners;
    uint256 private nextTokenId;

    uint256[50] private __gap;

    event PayableCreated(uint256 indexed id, bytes32 commitment, uint256 maturityDate, address issuer, uint256 milestoneId);
    event PayableSplit(uint256 indexed originalId, uint256 newId, bytes32 newCommitment, uint256 newMilestoneId, uint256 newMaturityDate);
    event PayableRealized(uint256 indexed id, address holder);
    event PayableTransferred(uint256 indexed id, address from, address to, uint256 amount);
    event WrappedDeposit(uint256 indexed id, bytes32 commitment, uint256 milestoneId);
    event UnwrappedDeposit(uint256 indexed id, address holder);
    event UnwrapFailed(uint256 indexed id, string reason);
    event MilestoneRealized(uint256 indexed milestoneId, uint256 tokenCount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _uri, address _depositContract) public initializer {
        __ERC1155_init(_uri);
        __Ownable_init(msg.sender);
        __Pausable_init();
        depositContract = ERC20TokenDSGD(_depositContract);
        nextTokenId = 1;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function setTokenURI(uint256 tokenId, string memory newuri) public onlyOwner {
        _tokenURIs[tokenId] = newuri;
        emit URI(newuri, tokenId);
    }

    function createPayable(
        bytes32 commitment,
        uint256 maturityDate,
        uint256 milestoneId,
        string memory tokenMetadataUri
    ) external onlyOwner whenNotPaused returns (uint256 id) {
        id = nextTokenId++;
        require(payables[id].escrowCommitment == bytes32(0), "Payable ID already exists");
        payables[id] = Payable({
            escrowCommitment: commitment,
            maturityDate: maturityDate,
            realized: false,
            issuer: msg.sender,
            milestoneId: milestoneId
        });
        _mint(msg.sender, id, 1, "");
        _tokenURIs[id] = tokenMetadataUri;
        emit URI(tokenMetadataUri, id);
        tokenOwners[id] = msg.sender;
        tokenIds.add(id);
        milestoneToTokens[milestoneId].add(id);
        emit PayableCreated(id, commitment, maturityDate, msg.sender, milestoneId);
        return id;
    }

    function wrapDepositToPayable(
        uint256 depositAmount,
        bytes32 commitment,
        uint256 maturityDate,
        uint256 milestoneId,
        string memory tokenMetadataUri
    ) external whenNotPaused returns (uint256 id) {
        if (depositAmount > 0) {
            depositContract.transferFrom(msg.sender, address(this), depositAmount);
        }
        id = nextTokenId++;
        payables[id] = Payable({
            escrowCommitment: commitment,
            maturityDate: maturityDate,
            realized: false,
            issuer: msg.sender,
            milestoneId: milestoneId
        });
        _mint(msg.sender, id, 1, "");
        _tokenURIs[id] = tokenMetadataUri;
        emit URI(tokenMetadataUri, id);
        tokenIds.add(id);
        milestoneToTokens[milestoneId].add(id);
        emit WrappedDeposit(id, commitment, milestoneId);
        emit PayableCreated(id, commitment, maturityDate, msg.sender, milestoneId);
        return id;
    }

    // The server computes split math off-chain and provides pre-computed commitments.
    // newTokenCommitment    = keccak256(abi.encodePacked(splitAmount, splitSalt))
    // updatedOriginalCommitment = keccak256(abi.encodePacked(remainingAmount, newOriginalSalt))
    function splitPayable(
        uint256 originalId,
        uint256 newMilestoneId,
        bytes32 newTokenCommitment,
        bytes32 updatedOriginalCommitment,
        uint256 newMaturityDate,
        string memory newMetadataUri,
        string memory updatedSourceUri
    ) external whenNotPaused returns (uint256 newId) {
        require(balanceOf(msg.sender, originalId) == 1, "Not owner of payable");

        payables[originalId].escrowCommitment = updatedOriginalCommitment;

        if (bytes(updatedSourceUri).length > 0) {
            _tokenURIs[originalId] = updatedSourceUri;
            emit URI(updatedSourceUri, originalId);
        }

        newId = nextTokenId++;
        payables[newId] = Payable({
            escrowCommitment: newTokenCommitment,
            maturityDate: newMaturityDate,
            realized: false,
            issuer: payables[originalId].issuer,
            milestoneId: newMilestoneId
        });
        _mint(msg.sender, newId, 1, "");
        _tokenURIs[newId] = newMetadataUri;
        emit URI(newMetadataUri, newId);
        tokenIds.add(newId);
        milestoneToTokens[newMilestoneId].add(newId);
        emit PayableSplit(originalId, newId, newTokenCommitment, newMilestoneId, newMaturityDate);
    }

    function realizeMilestoneAgainstMaturityDate(uint256 milestoneId) external onlyOwner whenNotPaused {
        uint256[] memory tokens = milestoneToTokens[milestoneId].values();
        uint256 count = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 id = tokens[i];
            if (payables[id].realized) continue;
            if (block.timestamp >= payables[id].maturityDate) {
                payables[id].realized = true;
                emit PayableRealized(id, tokenOwners[id]);
                count++;
            }
        }
        emit MilestoneRealized(milestoneId, count);
    }

    function forceRealizeMilestone(uint256 milestoneId) external onlyOwner whenNotPaused {
        uint256[] memory tokens = milestoneToTokens[milestoneId].values();
        uint256 count = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 id = tokens[i];
            if (!payables[id].realized) {
                payables[id].realized = true;
                emit PayableRealized(id, tokenOwners[id]);
                count++;
            }
        }
        emit MilestoneRealized(milestoneId, count);
    }

    function updateTokenisedPayableDetails(
        uint256 tokenId,
        uint256 newMaturityDate,
        bool newRealized,
        bytes32 newCommitment
    ) external onlyOwner {
        require(payables[tokenId].escrowCommitment != bytes32(0), "Token does not exist");
        if (newMaturityDate != 0) {
            payables[tokenId].maturityDate = newMaturityDate;
        }
        payables[tokenId].realized = newRealized;
        if (newCommitment != bytes32(0)) {
            payables[tokenId].escrowCommitment = newCommitment;
        }
    }

    // Caller reveals the plaintext amount and salt; contract verifies commitment before releasing.
    function unwrapToDeposit(uint256 id, uint256 amount, bytes32 salt) external whenNotPaused {
        require(balanceOf(msg.sender, id) == 1, "Not owner of payable");
        require(payables[id].realized || block.timestamp >= payables[id].maturityDate, "Not yet realised");
        require(
            keccak256(abi.encodePacked(amount, salt)) == payables[id].escrowCommitment,
            "Invalid commitment reveal"
        );
        uint256 milestoneId = payables[id].milestoneId;
        _burn(msg.sender, id, 1);
        delete payables[id];
        tokenIds.remove(id);
        milestoneToTokens[milestoneId].remove(id);
        delete tokenOwners[id];
        depositContract.transfer(msg.sender, amount);
        emit UnwrappedDeposit(id, msg.sender);
    }

    function batchUnwrapToDeposit(
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes32[] calldata salts
    ) external whenNotPaused {
        require(ids.length == amounts.length && amounts.length == salts.length, "Length mismatch");
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            if (balanceOf(msg.sender, id) != 1) continue;
            if (!payables[id].realized && block.timestamp < payables[id].maturityDate) continue;
            if (keccak256(abi.encodePacked(amounts[i], salts[i])) != payables[id].escrowCommitment) continue;

            uint256 milestoneId = payables[id].milestoneId;
            try depositContract.transfer(msg.sender, amounts[i]) {
                _burn(msg.sender, id, 1);
                delete payables[id];
                tokenIds.remove(id);
                milestoneToTokens[milestoneId].remove(id);
                delete tokenOwners[id];
                emit UnwrappedDeposit(id, msg.sender);
            } catch {
                emit UnwrapFailed(id, "Transfer failed - possible blacklist");
            }
        }
    }

    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) public override {
        super.safeTransferFrom(from, to, id, amount, data);
        if (amount == 1) {
            tokenOwners[id] = to;
        }
        emit PayableTransferred(id, from, to, amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function getTokensForMilestone(uint256 milestoneId) external view returns (uint256[] memory) {
        return milestoneToTokens[milestoneId].values();
    }

    function getAllTokenIds() external view returns (uint256[] memory) {
        return tokenIds.values();
    }
}
