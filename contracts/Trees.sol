pragma solidity ^0.5.10;

import './CryptoTrees.sol';
import './AirTokens.sol';

contract Admin {
  address payable public owner;
  mapping(address => bool) public isAdmin;

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  modifier onlyAdmin() {
    require(isAdmin[msg.sender]);
    _;
  }

  constructor() public {
    owner = msg.sender;
    addAdmin(owner);
  }

  function addAdmin(address _admin) public onlyOwner {
    isAdmin[_admin] = true;
  }

  function removeAdmin(address _admin) public onlyOwner {
    isAdmin[_admin] = false;
  }
}

/**
 * @title Trees
 * @dev CryptoTrees App solidity backend, that keeps track of tree details,
 *      trees on sale, and allows users to buy and exchange their trees
 * @author @merlox @wafflemakr
 */
contract Trees is Admin {

  // --- EVENTS ---
  event LogWaterTree(uint256 indexed treeId, address indexed owner, uint256 date);
  event LogRewardPicked(uint256 indexed treeId, address indexed owner, uint256 date, uint256 amount);

  // Get the tree information given the id
  mapping(uint256 => Tree) public trees;

  // A mapping with all the tree IDs of that owner
  // mapping(address => uint256[]) public ownerTreesIds;
  
  // --- TREE Details ---
  struct Tree {
    uint256 treeId;
    address owner;
    uint256 airProduction; //starts at 1, then add 1 per day
    uint salePrice;
    bool onSale;
    uint lastAirClaim; // Time when last air tokens were claimed
    uint purchaseDate;
    uint timesExchanged;
  }

  uint256[] public treesOnSale;

  //Initil owner when trees are generated
  address public defaultTreesOwner = msg.sender;

  uint256 public defaultAirProduction = 1; // 1 AIR token per day
  uint256 public defaultSalePrice = 0.1 ether;
  uint256 public timeBetweenRewards = 1 days;
  uint256 public totalAirProduction;

  CryptoTrees public cryptoTrees;
  AirTokens public airTokens;


  constructor (address treesAddress, address airAddress) public {
    cryptoTrees = CryptoTrees(treesAddress);
    airTokens = AirTokens(airAddress);
  }

  function updateTokenContract(address newTreesAddress, address newAirAddress) external onlyAdmin{
    cryptoTrees = CryptoTrees(newTreesAddress);
    airTokens = AirTokens(newAirAddress);
  }

  /**
   * @dev This will be called automatically by the server. The contract itself will hold the initial trees
   * @param _amountToGenerate amount of new trees to generate
   */
  function generateTrees(uint256 _amountToGenerate) public onlyAdmin {
    for(uint256 i = 0; i < _amountToGenerate; i++) {
        uint256 newTreeId = cryptoTrees.totalSupply() + 1;

        Tree memory newTree = Tree(newTreeId, address(this), defaultAirProduction, defaultSalePrice, true, 0, 0, 0);

        // Mint new tree
        cryptoTrees.mint(address(this), newTreeId);

        // Update the treeBalances and treeOwner mappings
        // We add the tree to the same array position to find it easier
        // ownerTreesIds[defaultTreesOwner].push(newTreeId);
        trees[newTreeId] = newTree;
        treesOnSale.push(newTreeId);
        totalAirProduction += defaultAirProduction;
    }
  }

  // This is payable, the user will send the payment here
  // We delete the tree from the owner first and we add that to the receiver
  // When you sell you're actually putting the tree on the market, not losing it yet
  function putTreeOnSale(uint256 _treeNumber, uint256 _salePrice) public {
    require(msg.sender == trees[_treeNumber].owner, 'You are not the owner of this tree');
    require(!trees[_treeNumber].onSale, 'Tree is already on sale');
    require(_salePrice > 0, 'Sale price has too be grater than 0');

    // User needs to approve this contract to transfer tokens first
    cryptoTrees.transferFrom(msg.sender, address(this), _treeNumber);

    treesOnSale.push(_treeNumber);
    trees[_treeNumber].salePrice = _salePrice;
    trees[_treeNumber].onSale = true;
  }

  // To buy a tree paying ether
  function buyTree(uint256 _treeNumber) public payable {
    require(msg.sender != trees[_treeNumber].owner, 'You already own this tree');
    require(trees[_treeNumber].onSale, 'Tree is not on sale');
    require(msg.value >= trees[_treeNumber].salePrice, 'Sale price is higher than the amount sent');
    address payable newOwner = msg.sender;

    // If its a new tree
    if(trees[_treeNumber].timesExchanged == 0) {
        // Transfer ownership of the tree to new owner
        // default owner needs to approve this contract to transfer kitties
        cryptoTrees.transferFrom(owner, newOwner, _treeNumber);
        
        // Reward the owner for the initial trees as a way of monetization. Keep half for the treasury
        //owner.transfer(msg.value / 2);
    } else {
        // Transfer ownership of the tree to new owner
        // previous owner needs to approve this contract to transfer kitties (putTreeOnSale function)
        cryptoTrees.transferFrom(owner, newOwner, _treeNumber);
        //trees[_treeNumber].owner.transfer(msg.value * 90 / 100); // Keep 0.1% in the treasury
    }

    // Remove the tree from the array of trees on sale
    for(uint256 a = 0; a < treesOnSale.length; a++) {
        if(treesOnSale[a] == _treeNumber) {
            delete treesOnSale[a];
            break;
        }
    }
    
    //Update tree details
    trees[_treeNumber].onSale = false;
    trees[_treeNumber].owner = newOwner;
    trees[_treeNumber].purchaseDate = now;
    trees[_treeNumber].timesExchanged += 1;
  }

  // To take a tree out of the market without selling it
  function cancelTreeSell(uint256 _treeId) public {
    require(msg.sender == trees[_treeId].owner);
    require(trees[_treeId].onSale);
    // Remove the tree from the array of trees on sale
    for(uint256 a = 0; a < treesOnSale.length; a++) {
        if(treesOnSale[a] == _treeId) {
            delete treesOnSale[a];
            break;
        }
    }
    trees[_treeId].onSale = false;
  }

  // To get the AIR tokens from the rewards
  function pickReward(uint256 _treeId) public {
    require(msg.sender == trees[_treeId].owner);
    require(now - trees[_treeId].lastAirClaim > timeBetweenRewards);

    uint256[] memory formatedId = new uint256[](1);
    formatedId[0] = _treeId;
    uint256[] memory rewards = checkRewards(formatedId);
    trees[_treeId].lastAirClaim = now;
    msg.sender.transfer(rewards[0]);
    emit LogRewardPicked(_treeId, msg.sender, now, rewards[0]);
  }


  // Returns an array of how much AIR all those trees have generated today
  // There is a fixed
  function checkRewards(uint256[] memory _treeIds) public view returns(uint256[] memory results) {
    
  }

  // To get all the tree IDs of one user
  function getTreeIds(address _account) public view returns(uint256[] memory) {
    
  }

  // To get all the trees on sale
  function getTreesOnSale() public view returns(uint256[] memory) {
      return treesOnSale;
  }

  // To extract the ether in an emergency
  function emergencyExtract() public onlyOwner {
    owner.transfer(address(this).balance);
  }
}
