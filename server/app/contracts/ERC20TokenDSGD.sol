// SPDX-License-Identifier: MIT
// https://github.com/samc621/TokenFactory/blob/master/contracts/ERC20Token.sol
pragma solidity >=0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
//import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

contract ERC20TokenDSGD is ERC20 {
    address public immutable owner;
    uint256 private _totalSupply;
    uint256 public _incirculation = 0;
    uint8 public constant DECIMALS = 18;

//  uint256 private MAXIMUMSUPPLY; // N*10**18;
    mapping(address => uint256) private tokenBalances;
	mapping(address => mapping(address => uint256 ) ) allowed;  

    event Update(address sender, uint256 newTotalSupply);
    event Burn(address sender, uint256 _amount);
    event BurnFrom(address sender, address account, uint256 _amount);

    constructor(
        string memory name,
        string memory symbol,
        uint256 total_Supply
//      uint8 decimals,
//      address _owner
    ) ERC20(name, symbol) {
        owner = msg.sender;
        _totalSupply = total_Supply;
        tokenBalances[msg.sender] = 0;

       // _mint(_owner, initialSupply * 10**uint256(decimals));
    }

    function balanceOf(address tokenOwner) public override view returns (uint256) {
        return tokenBalances[tokenOwner];
    }

    function mint(address _recipient, uint256 _amount) external onlyOwner {
        // TODO: Consider having minting restricted to not be to self

        require((_incirculation + _amount) <= _totalSupply, "Total supply has been reached");
        require( _amount > 0 , "Amount must be more than 0");

        _incirculation += _amount;
        tokenBalances[_recipient] += _amount;

        _mint(_recipient, _amount);

		emit Transfer( msg.sender, _recipient, _amount ); 
    }

    function transfer(address _recipient, uint256 _amount) public override returns (bool success) {
		require( tokenBalances[ msg.sender ] >= _amount, "Insufficient token");

		tokenBalances[ msg.sender ] -= _amount;
		tokenBalances[ _recipient ] += _amount; 
	
		emit Transfer( msg.sender, _recipient, _amount ); 
        return true;
	}

    function totalSupply() public view override returns (uint256) {
        return(_totalSupply);
    }

    function updateTotalSupply(uint256 newTotalSupply) public onlyOwner returns (bool success)  {
        require( newTotalSupply >= _incirculation , "New total is less than minted tokens");
        require( newTotalSupply > 0 , "New total must be more than 0");

        _totalSupply = newTotalSupply;

        emit Update( msg.sender, newTotalSupply ); 

        return true;
    }


    // TODO: Rethink this. Used for payouts
    // Consider having a payout mapping? Seperate contract account?
    function burn(uint256 _amount) public onlyOwner {
        if (tokenBalances[ owner ] >= _amount) {
            _burn(owner, _amount);
            _incirculation -= _amount;
            tokenBalances[ owner ] -= _amount; 
        } else {
            _burn(owner, tokenBalances[ owner ]);
            _incirculation -= tokenBalances[ owner ];
            tokenBalances[ owner ] = 0; 
        }

        emit Burn( msg.sender, _amount );

    }

    function burnFrom(address account, uint256 _amount) public onlyOwner {
        if (tokenBalances[ account ] >= _amount) {
            _burn(account, _amount);
            tokenBalances[ account ] -= _amount; 
        } else {
            _burn(account, tokenBalances[ account ]);
            tokenBalances[ account ] = 0; 
        }

        emit BurnFrom( msg.sender, account, _amount );
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

/*
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
*/

}