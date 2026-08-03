// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Long-lived escrow contract deployed once per chain. Each cross-chain Repo leg
// (start or maturity) is locked here, and released once a 2-of-3 relayer quorum
// confirms the matching leg was also locked on the counterparty's chain.
contract CrossChainRepoEscrow {
    using SafeERC20 for IERC20;

    address public owner;
    bool public paused;
    uint256 public threshold;
    uint256 public relayerCount;

    mapping(address => bool) public admins;
    mapping(address => bool) public relayers;

    enum Status { None, Locked, Released, Refunded }

    struct Leg {
        address token;
        address depositor;
        address beneficiary;
        uint256 amount;
        uint256 deadline;
        Status status;
        uint256 confirmCount;
        mapping(address => bool) confirmedBy;
    }

    mapping(bytes32 => Leg) private legs;

    event Locked(bytes32 indexed legId, address indexed token, address indexed depositor, address beneficiary, uint256 amount, uint256 deadline);
    event Confirmed(bytes32 indexed legId, address indexed relayer, uint256 confirmCount);
    event Released(bytes32 indexed legId, address indexed beneficiary, uint256 amount);
    event Refunded(bytes32 indexed legId, address indexed depositor, uint256 amount);
    event RelayerUpdated(address indexed relayer, bool isAdded);
    event ThresholdUpdated(uint256 newThreshold);
    event AdminUpdated(address indexed admin, bool isAdded);
    event Paused(bool isPaused);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAdminOrOwner() {
        require(msg.sender == owner || admins[msg.sender], "Only owner or admin can call this function");
        _;
    }

    modifier onlyRelayer() {
        require(relayers[msg.sender], "Only a registered relayer can call this function");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor(address[] memory _relayers, uint256 _threshold) {
        require(_threshold > 0 && _threshold <= _relayers.length, "Invalid threshold");
        owner = msg.sender;
        admins[msg.sender] = true;
        threshold = _threshold;
        for (uint256 i = 0; i < _relayers.length; i++) {
            require(_relayers[i] != address(0), "Invalid relayer address");
            require(!relayers[_relayers[i]], "Duplicate relayer address");
            relayers[_relayers[i]] = true;
            emit RelayerUpdated(_relayers[i], true);
        }
        relayerCount = _relayers.length;
    }

    function manageAdmins(address _admin, bool _add) public onlyOwner {
        require(_admin != address(0), "Invalid admin address");
        admins[_admin] = _add;
        emit AdminUpdated(_admin, _add);
    }

    function manageRelayers(address _relayer, bool _add) public onlyOwner {
        require(_relayer != address(0), "Invalid relayer address");
        require(relayers[_relayer] != _add, "No change");
        relayers[_relayer] = _add;
        relayerCount = _add ? relayerCount + 1 : relayerCount - 1;
        require(threshold <= relayerCount, "Threshold exceeds relayer count");
        emit RelayerUpdated(_relayer, _add);
    }

    function setThreshold(uint256 _threshold) public onlyOwner {
        require(_threshold > 0 && _threshold <= relayerCount, "Invalid threshold");
        threshold = _threshold;
        emit ThresholdUpdated(_threshold);
    }

    function pauseUnpause(bool _pause) public onlyAdminOrOwner {
        paused = _pause;
        emit Paused(_pause);
    }

    // Pulls `amount` of `token` from `depositor` (who must have approved this contract)
    // and escrows it under `legId` until a relayer quorum releases or the deadline passes.
    function lock(
        bytes32 legId,
        address token,
        address depositor,
        address beneficiary,
        uint256 amount,
        uint256 deadline
    ) public onlyAdminOrOwner whenNotPaused {
        Leg storage leg = legs[legId];
        require(leg.status == Status.None, "Leg already exists");
        require(token != address(0) && depositor != address(0) && beneficiary != address(0), "Invalid address");
        require(amount > 0, "Amount must be positive");
        require(deadline > block.timestamp, "Deadline must be in the future");

        leg.token = token;
        leg.depositor = depositor;
        leg.beneficiary = beneficiary;
        leg.amount = amount;
        leg.deadline = deadline;
        leg.status = Status.Locked;

        IERC20(token).safeTransferFrom(depositor, address(this), amount);

        emit Locked(legId, token, depositor, beneficiary, amount, deadline);
    }

    // Called independently by each relayer once it has observed the matching leg
    // locked on the counterparty's chain. Auto-releases once `threshold` is reached.
    function confirmRelease(bytes32 legId) public onlyRelayer whenNotPaused {
        Leg storage leg = legs[legId];
        require(leg.status == Status.Locked, "Leg not locked");
        require(!leg.confirmedBy[msg.sender], "Already confirmed by this relayer");

        leg.confirmedBy[msg.sender] = true;
        leg.confirmCount += 1;
        emit Confirmed(legId, msg.sender, leg.confirmCount);

        if (leg.confirmCount >= threshold) {
            leg.status = Status.Released;
            IERC20(leg.token).safeTransfer(leg.beneficiary, leg.amount);
            emit Released(legId, leg.beneficiary, leg.amount);
        }
    }

    // Safety valve: if the counterparty's leg never gets locked/relayed before the
    // deadline, the depositor (or an admin, on their behalf) can reclaim the funds.
    function refund(bytes32 legId) public whenNotPaused {
        Leg storage leg = legs[legId];
        require(leg.status == Status.Locked, "Leg not refundable");
        require(block.timestamp > leg.deadline, "Deadline not yet passed");
        require(msg.sender == leg.depositor || admins[msg.sender] || msg.sender == owner, "Not authorized to refund");

        leg.status = Status.Refunded;
        IERC20(leg.token).safeTransfer(leg.depositor, leg.amount);
        emit Refunded(legId, leg.depositor, leg.amount);
    }

    function getLeg(bytes32 legId) public view returns (
        address token,
        address depositor,
        address beneficiary,
        uint256 amount,
        uint256 deadline,
        uint8 status,
        uint256 confirmCount
    ) {
        Leg storage leg = legs[legId];
        return (leg.token, leg.depositor, leg.beneficiary, leg.amount, leg.deadline, uint8(leg.status), leg.confirmCount);
    }

    function hasConfirmed(bytes32 legId, address relayer) public view returns (bool) {
        return legs[legId].confirmedBy[relayer];
    }
}
