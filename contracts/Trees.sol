pragma solidity ^0.5.10;

import './CryptoTrees.sol';
import './AirTokens.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

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

  using SafeMath for uint256;

  // --- EVENTS ---
  event LogRewardPicked(uint256 indexed treeId, address indexed owner, uint256 date, uint256 amount);

  // A mapping with all the tree IDs of that owner
  // mapping(address => uint256[]) public ownerTreesIds;
  
  // --- TREE Details ---
  struct Tree {
    uint256 treeId;
    address payable owner;
    uint256 airProduction; //starts at 1, then add 1 per day
    uint salePrice;
    bool onSale;
    uint lastAirClaim; // Time when last air tokens were claimed
    uint purchaseDate;
    uint timesExchanged;
  }

   // Get the tree information given the id
  mapping(uint256 => Tree) public trees;

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
        uint256 newTreeId = cryptoTrees.totalSupply().add(1);

        //Only for development phase, set lastAirClaim from 1-20 days ago randomly
        uint256 lastAirClaim = uint256(keccak256(abi.encodePacked(newTreeId, now))).mod(20).add(1);
        
        Tree memory newTree = Tree(newTreeId, address(uint160(address(this))), defaultAirProduction, defaultSalePrice, true, now.sub((lastAirClaim.mul(1 days))), 0, 0);

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
    require(_salePrice > 0, 'Sale price has too be greater than 0');

    // User needs to approve this contract to transfer the tree to us
    require(cryptoTrees.getApproved(_treeNumber) == address(this), "You need to approve this contract first");    
    cryptoTrees.transferFrom(msg.sender, address(this), _treeNumber);

    treesOnSale.push(_treeNumber);
    trees[_treeNumber].salePrice = _salePrice;
    trees[_treeNumber].onSale = true;
  }

  // To buy a tree paying ether
  function buyTree(uint256 _treeId) public payable {
    require(msg.sender != trees[_treeId].owner, 'You already own this tree');
    require(trees[_treeId].onSale, 'Tree is not on sale');
    require(msg.value >= trees[_treeId].salePrice, 'Sale price is higher than the amount sent');
    address payable newOwner = msg.sender;

    // Transfer ownership of the tree to new owner
    cryptoTrees.transferFrom(address(this), newOwner, _treeId);

    // If its a new tree, send payment to owner
    if(trees[_treeId].timesExchanged == 0) owner.transfer(msg.value);
    // Send payment to previous owner
    else trees[_treeId].owner.transfer(msg.value);

    // Remove the tree from the array of trees on sale
    for(uint256 a = 0; a < treesOnSale.length; a++) {
        if(treesOnSale[a] == _treeId) {
            delete treesOnSale[a];
            break;
        }
    }
    
    //Update tree details
    trees[_treeId].onSale = false;
    trees[_treeId].owner = newOwner;
    trees[_treeId].purchaseDate = now;
    trees[_treeId].timesExchanged += 1;
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
    cryptoTrees.transferFrom(address(this), msg.sender, _treeId);
    trees[_treeId].onSale = false;
  }

  // To get the AIR tokens from the rewards
  function pickReward(uint256 _treeId) public {
    require(msg.sender == trees[_treeId].owner, "You are not the owner of this tree");
    require(now.sub(trees[_treeId].lastAirClaim) > timeBetweenRewards, "You cannot claim rewards yet");

    uint256[] memory formatedId = new uint256[](1);
    formatedId[0] = _treeId;
    uint256[] memory rewards = checkRewards(formatedId);

    require(updateAirProduction(_treeId));

    // Send AIR tokens to owner of TREE
    airTokens.transferFrom(owner, msg.sender, rewards[0].mul(1 ether));

    trees[_treeId].lastAirClaim = now;
    emit LogRewardPicked(_treeId, msg.sender, now, rewards[0]);
  }

  function updateAirProduction(uint256 _treeId) internal returns(bool) {
    uint256 prevProd = trees[_treeId].airProduction;
    uint daysPassed = daysSinceLastClaim(_treeId);

    if (prevProd.add(daysPassed) > 100) trees[_treeId].airProduction = 100;
    else trees[_treeId].airProduction = prevProd.add(daysPassed);

    return true;
  }

  function daysSinceLastClaim(uint256 _treeId) public view returns(uint) {
    uint256 lastClaim = trees[_treeId].lastAirClaim;
    return (now.sub(lastClaim).div(1 days));
  }

  // Returns an array of how much AIR the tree Ids ahve generated until today
  function checkRewards(uint256[] memory _treeIds) public view returns(uint256[] memory results) {
    results = new uint256[](_treeIds.length);

    for(uint256 i = 0; i < _treeIds.length; i++) {
        uint daysPassed = daysSinceLastClaim(_treeIds[i]);
        uint256 prevProd = trees[_treeIds[i]].airProduction;

        //Because when it reaches 100 prod, it does not keep increasing
        if (prevProd == 100) results[i] = daysPassed.mul(100);

        //One scenario when i.e. prod is 88 and 30 days have passed sin last claim
        //We need to add the prod before 100 and after
        if (prevProd + daysPassed > 100) {
          //Add the total air prod until it reached 100
          uint maxDays = 100;
          uint incresingDays = maxDays.sub(prevProd);
          uint firstResults = (incresingDays.mul(prevProd.add(101))).div(2);

          //Add prev result to the mult of days of 100 air prod
          results[i] = firstResults.add(((prevProd.add(daysPassed)).sub(100)).mul(100));          
        }
        // When we can just add the series (because we have not reached 100 prod/day)
        else results[i] = (daysPassed.mul(prevProd.add(daysPassed))).div(2);
    }
    return results;   

  }

  // To get all the tree IDs of one user
  function getOwnerTrees(address _account) public view returns(uint256[] memory) {
    return cryptoTrees.getOwnerTrees(_account);
  }

  // To get all the trees on sale
  function getTreesOnSale() public view returns(uint256[] memory) {
      return treesOnSale;
  }

  // To extract all tokens in an emergency
  function emergencyExtract() public onlyOwner {
    owner.transfer(address(this).balance);
  }
}
