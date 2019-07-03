pragma solidity ^0.5.10;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Capped.sol';

contract AirTokens is ERC20Detailed, ERC20Capped{
    constructor() ERC20Detailed("AIR", "AIR", 18) ERC20Capped(100000000*10**18) public {
        _mint(msg.sender, 100000000*10**18);
    }

}