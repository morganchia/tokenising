// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ERCTokenDVP {
    address public owner;
    string  public name;
    address public counterparty1;
    address public counterparty2;
    address public token1;
    address public token2;
    uint256 public amount1;
    uint256 public amount2;
    uint256 public startdate;
    uint256 public enddate;

    event TradeExecuted(address indexed counterparty1, address indexed counterparty2, uint256 amount1, uint256 amount2);
    event TradeFailed(string reason);
    event ExchangeRateUpdated(uint256 newAmount1, uint256 newAmount2);
    event CounterpartiesUpdated(address newCounterparty1, address newCounterparty2);
    event TokensUpdated(address newToken1, address newToken2);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier withinDateRange() {
        require(block.timestamp >= startdate && block.timestamp <= enddate, "Current date is out of the allowed range");
        _;
    }

    constructor(
        string memory _name,
        address _counterparty1,
        address _counterparty2,
        address _token1,
        address _token2,
        uint256 _amount1,   // exchange rate between token1 and 2
        uint256 _amount2,   // exchange rate between token1 and 2
        uint256 _startdate,
        uint256 _enddate
    ) {
        require(_startdate <= _enddate, "Start date must be before or equal to end date");

        owner = msg.sender;
        name = _name;
        counterparty1 = _counterparty1;
        counterparty2 = _counterparty2;
        token1 = _token1;
        token2 = _token2;
        amount1 = _amount1;
        amount2 = _amount2;
        startdate = _startdate;
        enddate = _enddate;
    }

    function updateExchangeRate(uint256 newAmount1, uint256 newAmount2) public onlyOwner {
        amount1 = newAmount1;
        amount2 = newAmount2;
        emit ExchangeRateUpdated(newAmount1, newAmount2);
    }

    function updateCounterparties(address newCounterparty1, address newCounterparty2) public onlyOwner {
        counterparty1 = newCounterparty1;
        counterparty2 = newCounterparty2;
        emit CounterpartiesUpdated(newCounterparty1, newCounterparty2);
    }

    function updateTokens(address newToken1, address newToken2) public onlyOwner {
        token1 = newToken1;
        token2 = newToken2;
        emit TokensUpdated(newToken1, newToken2);
    }

    function updateDates(uint256 newStartdate, uint256 newEnddate) public onlyOwner {
        startdate = newStartdate;
        enddate = newEnddate;
    }

//    function executeTrade() public withinDateRange {
    function executeTrade() public  {
        require(IERC20(token1).balanceOf(counterparty1) >= amount1, "Counterparty 1 has insufficient token1 balance");
        require(IERC20(token2).balanceOf(counterparty2) >= amount2, "Counterparty 2 has insufficient token2 balance");

        bool success1 = IERC20(token1).transferFrom(counterparty1, address(this), amount1);
        bool success2 = IERC20(token2).transferFrom(counterparty2, address(this), amount2);

        if (success1 && success2) {
            bool transfer1 = IERC20(token1).transfer(counterparty2, amount1);
            bool transfer2 = IERC20(token2).transfer(counterparty1, amount2);

            if (transfer1 && transfer2) {
                emit TradeExecuted(counterparty1, counterparty2, amount1, amount2);
            } else {
                emit TradeFailed("Trade failed during final transfer");
                // Revert the transfers if the final transfer fails
                if (transfer1) {
                    IERC20(token1).transfer(counterparty1, amount1);
                }
                if (transfer2) {
                    IERC20(token2).transfer(counterparty2, amount2);
                }
            }
        } else {
            emit TradeFailed("Trade failed during initial transfer");
            // Revert the initial transfer if any of them fails
            if (success1) {
                IERC20(token1).transfer(counterparty1, amount1);
            }
            if (success2) {
                IERC20(token2).transfer(counterparty2, amount2);
            }
        }
    }
}
