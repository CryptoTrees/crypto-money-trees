pragma solidity ^0.5.1;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Mintable.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Burnable.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Pausable.sol';

contract CryptoTrees is ERC721Full, ERC721Mintable, ERC721Burnable, ERC721Pausable{
    constructor() ERC721Full("CryptoTree", "TREE") public {
    }

}