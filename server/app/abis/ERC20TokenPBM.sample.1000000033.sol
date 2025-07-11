// SPDX-License-Identifier: MIT
// https://github.com/opengovsg/cbdc-smart-contracts/blob/master/contracts/PBMToken.sol
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/interfaces/IPBM.sol";


/// @title PBM contract
/// @author Open Government Products
/// @notice Implementation of the IPBM interface

interface IONSManager {
    function getCustomEntry(string memory key) external view returns (address);
}


contract PBMToken is ERC20Pausable, AccessControl, IPBM {
    using SafeERC20 for IERC20Metadata;

    IERC20Metadata public immutable underlyingToken;
    address public immutable owner;

    string public field1;
    string public field1value;
    string public field2;
    string public field2value;
    string public operator;

    uint256 public contractExpiry;

    // RBAC related constants
    bytes32 public constant MERCHANT_ROLE = keccak256("MERCHANT_ROLE");
    bytes32 public constant MERCHANT_ADMIN_ROLE = keccak256("MERCHANT_ADMIN_ROLE");

    IONSManager public onsManager;

    modifier onlyOwner() {
        require(_msgSender() == owner, "not owner");
        _;
    }

    modifier onlyApprovedMerchant(address recipient) {
        require(hasRole(MERCHANT_ROLE, recipient), "recipient not an approved merchant");
        _;
    }

    modifier whenNotExpired() {
        require(block.timestamp < contractExpiry, "contract expired");
        _;
    }

    constructor(
        address _underlyingAddress,
        string memory _name,
        string memory _symbol,
        uint256 _contractExpiry,
        string memory _field1,
        string memory _field1value,
        string memory _operator,
        string memory _field2,
        string memory _field2value
    ) ERC20(_name, _symbol) {
        owner = _msgSender();
        // Initialises the base DSGD token
        underlyingToken = IERC20Metadata(_underlyingAddress);

        // Sets up required roles for merchant management
        _grantRole(MERCHANT_ADMIN_ROLE, owner);
        _setRoleAdmin(MERCHANT_ROLE, MERCHANT_ADMIN_ROLE);

        field1 = _field1;
        field1value = _field1value;
        operator = _operator;
        field2 = _field2;
        field2value = _field2value;
        
        // Sets the contract expiry
        contractExpiry = _contractExpiry;
    }

    function setONSaddress(address _onsManagerAddress) public onlyOwner {
        // Initialize the IONSManager interface with the deployed ONSManager address
        onsManager = IONSManager(_onsManagerAddress);
    }

    // Function to call getCustomEntry from ONSManager
    function queryCustomEntry(string memory key) public view returns (address) {
        return onsManager.getCustomEntry(key);
    }

    event wMint(address msgsender, address toUser, address currentAddress, uint256 amount);
    event MintError(string errorMessage);

    /**
     * @dev Allows owner/minter to mint tokens from underlying tokens
     *
     * PREREQUISITE: Owners/Minters should have already approved this contract address to spend the underlying tokens
     * on behalf of the owner/minter.
     *
     * Requirements:
     *
     * - the caller must be `owner`. <-- removed
     * - the contract is not paused
     * - the contract is not expired
     * - there has to be sufficient underlying token held by the owners that have been approved for
     *
     *  Emits a { Transfer } on success, inherited from {ERC20}
     */
    function wrapMint(address toUser, uint256 amount) external  whenNotExpired {
        //require(underlyingToken.allowance(_msgSender(), address(this)) >= amount, "Insufficient allowance");

        underlyingToken.transferFrom(toUser, address(this), amount);  // <-- transfer from toUser!!
        _mint(toUser, amount);
        emit wMint(owner, toUser, address(this), amount);
    }


    /**
     * @dev Allows PBM recipients to unwrap and credit underlying token to a merchant
     *
     * Requirements:
     *
     * - the caller must have already owned PBM tokens
     * - the contract is not paused
     * - the contract is not expired
     *
     * Emits a { Redemption } on success
     */
    function redeem(address toUser, uint256 amount, string memory _field1, string memory _field1value, string memory _operator, string memory _field2, string memory _field2value) external whenNotExpired onlyApprovedMerchant(toUser) {
        require(               (                 (                  (keccak256(bytes(field1))      == keccak256(bytes(_field1))     )                   &&                   (keccak256(bytes(field1value)) == keccak256(bytes(_field1value)) )                 )             &&  (              (keccak256(bytes(field2))      == keccak256(bytes(_field2))     )               &&               (keccak256(bytes(field2value)) == keccak256(bytes(_field2value)) )             ))             , "PBM redeem condition failed");


        underlyingToken.safeTransfer(toUser, amount);
        _burn(_msgSender(), amount);
        emit Redemption(_msgSender(), toUser, amount);
    }

    /**
     * @dev Allows PBM owner to withdraw a campaign once the stipulated conditions are met
     *
     * For this implementation, an owner should be allowed to withdraw all unused DSGD
     * after a pre-determined expiry has been met
     *

     * Requirements:
     *
     * - the contract is already expired
     * - the caller is owner
     *
     */
    function withdraw() external onlyOwner returns (bool) {
        require(block.timestamp > contractExpiry, "contract expiry not reached");
        uint256 underlyingBalance = underlyingToken.balanceOf(address(this));
        underlyingToken.safeTransfer(owner, underlyingBalance);
        emit OwnerWithdrawal(_msgSender(), underlyingBalance);
        return true;
    }

    /**
     * @dev Allows for pausing of contract activities
     *
     * Caller has to be owner
     *
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Allows for resumption of an already paused contract of contract by owner
     *
     * Caller has to be owner
     *
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @dev Implemented as a wrapper of {AccessControl}
    /// @inheritdoc	IPBM
    function revokeMerchantRole(address account) external {
        revokeRole(MERCHANT_ROLE, account);
        emit MerchantRevoked(account, _msgSender());
    }

    /// @dev Implemented as a wrapper of {AccessControl}
    /// @inheritdoc	IPBM
    function grantMerchantRole(address account) external {
        grantRole(MERCHANT_ROLE, account);
        emit MerchantAdded(account, _msgSender());
    }

    /// @inheritdoc	IPBM
    function extendExpiry(uint256 expiryDate) external onlyOwner whenNotExpired {
        require(expiryDate > contractExpiry, "cannot shorten expiry date");
        contractExpiry = expiryDate;
        emit CampaignExtended(_msgSender());
    }

    function setExpiry(uint256 expiryDate) external onlyOwner whenNotExpired {
        contractExpiry = expiryDate;
        emit CampaignExtended(_msgSender());
    }

    /// @dev Additional control measure to maintain total supply parity should underlying tokens be credited to contract
    function recover(address account) external onlyOwner returns (uint256) {
        uint256 overBalance = underlyingToken.balanceOf(address(this)) - totalSupply();

        _mint(account, overBalance);
        return overBalance;
    }

    /// @inheritdoc ERC20
    function decimals() public view override returns (uint8) {
        try underlyingToken.decimals() returns (uint8 value) {
            return value;
        } catch {
            return 18;
        }
    }

    /**
     * @dev Overriden functionality to prevent self-renouncing of roles from {AccessControl}
     *
     * This is a temporary measure for the context of this trial.
     *
     */
    function renounceRole(bytes32 _role, address _account) public override {
        require(false, "feature blocked for current trial");
    }

    /**
     * @dev Implements additional contract expiry checks before any token transfer
     *
     * NOTE: _beforeTokenTransfer is a hook provided from {ERC20Pausable}. This hook is called before any
     * token transfers/mints.
     *
     * @inheritdoc ERC20Pausable
     */
     
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC20Pausable) whenNotExpired {
        super._beforeTokenTransfer(from, to, tokenId);
    }
    
}
