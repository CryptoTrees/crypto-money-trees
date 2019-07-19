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
    uint purchaseDate; // when it was purchased, either a new tree or a tree sold by another user
    uint startDate;   // when new tree was purchased (AIR prod starts to increase)
    uint timesExchanged;
  }

   // Get the tree information given the id
  mapping(uint256 => Tree) public trees;

  uint256[] public treesOnSale;

  uint256 public defaultAirProduction = 1; // 1 AIR token per day
  uint256 public defaultSalePrice = 1 ether; // 1 AIR
  uint256 public timeBetweenRewards = 1 days;
  uint256 public totalAirProduction;
  uint256 public airExchangeRate = 10; // 1 AIR = 0.1 ether, or 10 AIR/ETH

  CryptoTrees public cryptoTrees;
  AirTokens public airTokens;


  constructor (address treesAddress, address airAddress) public {
    cryptoTrees = CryptoTrees(treesAddress);
    airTokens = AirTokens(airAddress);
  }

  /**
   * @notice Updates tokens contract addresses
   */
  function updateTokenContract(address newTreesAddress, address newAirAddress) external onlyAdmin{
    cryptoTrees = CryptoTrees(newTreesAddress);
    airTokens = AirTokens(newAirAddress);
  }

  /**
   * @notice Updates contract default values
   */
  function updateDefaultValues
  (
    uint _defaultAirProduction, uint _defaultSalePrice, 
    uint _timeBetweenRewards, uint _airExchangeRate
  ) 
    external onlyAdmin
  {
    defaultAirProduction = _defaultAirProduction;
    defaultSalePrice = _defaultSalePrice;
    timeBetweenRewards = _timeBetweenRewards;
    airExchangeRate = _airExchangeRate;
  }

  /**
   * @notice Exchange ether for AIR tokens
   * @dev 1 AIR = 0.1 ether  
   */
  function buyAirTokens() public payable{
    // TODO: Checks?
    airTokens.transferFrom(owner, msg.sender, msg.value.mul(airExchangeRate));
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
        
        Tree memory newTree = Tree(newTreeId, address(uint160(address(this))), defaultAirProduction, defaultSalePrice, true, now.sub((lastAirClaim.mul(1 days))), 0, 0, 0);

        // Mint new tree
        cryptoTrees.mint(address(this), newTreeId);

        // Update the treeBalances and treeOwner mappings
        // We add the tree to the same array position to find it easier
        trees[newTreeId] = newTree;
        treesOnSale.push(newTreeId);
        totalAirProduction += defaultAirProduction;
    }
  }

  /**
   * @notice User that wants to puts tree on sale
   * @dev tree is transferred to the contract first, calling approve with tokenID
   * @param _treeNumber tree Id
   * @param _salePrice sale price in AIR tokens, including decimals
   */
  function putTreeOnSale(uint256 _treeNumber, uint256 _salePrice) public {
    require(msg.sender == trees[_treeNumber].owner, 'You are not the owner of this tree');
    require(!trees[_treeNumber].onSale, 'Tree is already on sale');
    require(_salePrice > 0, 'Sale price has to be greater than 0');

    // User needs to approve this contract to transfer the tree to us
    require(cryptoTrees.getApproved(_treeNumber) == address(this), "You need to approve this contract first");

    // Transfer Tree from user    
    cryptoTrees.transferFrom(msg.sender, address(this), _treeNumber);

    treesOnSale.push(_treeNumber);
    trees[_treeNumber].salePrice = _salePrice;
    trees[_treeNumber].onSale = true;
  }

  /**
   * @notice Buy a tree with AIR tokens
   * @dev user must approve the air contract first
   * @dev if its a new tree, transfer tokens to us
   * @param _treeId tree Id
   */
  function buyTree(uint256 _treeId) public{
    require(msg.sender != trees[_treeId].owner, 'You already own this tree');
    require(trees[_treeId].onSale, 'Tree is not on sale');
    require(airTokens.allowance(msg.sender, address(this)) >= trees[_treeId].salePrice, 'Sale price is higher than the amount allowed to spend');
    
    // If its a new tree, send payment to owner of contract
    if(trees[_treeId].timesExchanged == 0) airTokens.transferFrom(msg.sender, owner, trees[_treeId].salePrice);
    // Else, send payment to previous owner
    else airTokens.transferFrom(msg.sender, trees[_treeId].owner, trees[_treeId].salePrice);

    // Transfer ownership of the tree to new owner
    cryptoTrees.transferFrom(address(this), msg.sender, _treeId);

    // Remove the tree from the array of trees on sale
    for(uint256 a = 0; a < treesOnSale.length; a++) {
        if(treesOnSale[a] == _treeId) {
            delete treesOnSale[a];
            break;
        }
    }
    
    //Update tree details
    trees[_treeId].onSale = false;
    trees[_treeId].owner = msg.sender;
    trees[_treeId].purchaseDate = now;
    if(trees[_treeId].timesExchanged == 0) trees[_treeId].startDate = now;
    trees[_treeId].timesExchanged = trees[_treeId].timesExchanged.add(1);
  }


  /**
   * @notice To take a tree out of the market without selling it
   * @dev transfer tree from contract to owner
   * @param _treeId tree Id
   */
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

  /**
   * @notice To get the AIR tokens from the rewards
   * @dev only for one specific tree
   * @param _treeId tree Id
   */
  function pickReward(uint256 _treeId) public {
    require(msg.sender == trees[_treeId].owner, "You are not the owner of this tree");
    require(now.sub(trees[_treeId].lastAirClaim) > timeBetweenRewards, "You cannot claim rewards yet");

    //Send as array, as that function is used for a batch of tree ids
    uint256[] memory formatedId = new uint256[](1);
    formatedId[0] = _treeId;
    uint256[] memory rewards = checkRewards(formatedId);

    require(updateAirProduction(_treeId));

    // Send AIR tokens to owner of TREE
    airTokens.transferFrom(owner, msg.sender, rewards[0].mul(1 ether));

    trees[_treeId].lastAirClaim = now;
    emit LogRewardPicked(_treeId, msg.sender, now, rewards[0]);
  }

  /**
   * @notice Update a tree's production
   * @dev called by pickReward
   * @param _treeId tree Id
   */
  function updateAirProduction(uint256 _treeId) internal returns(bool) {
    uint256 prevProd = trees[_treeId].airProduction;
    uint daysPassed = daysSinceLastClaim(_treeId);

    if (prevProd.add(daysPassed) > 100) trees[_treeId].airProduction = 100;
    else trees[_treeId].airProduction = prevProd.add(daysPassed);

    return true;
  }

   /**
   * @notice how many days since the last AIR claim
   * @param _treeId tree Id
   */
  function daysSinceLastClaim(uint256 _treeId) public view returns(uint) {
    uint256 lastClaim = trees[_treeId].lastAirClaim;
    return (now.sub(lastClaim).div(1 days));
  }

  /**
   * @notice Returns an array of how much AIR the tree Ids ahve generated until today
   * @param _treeIds array of tree ids
   */
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

  /**
   * @notice Return calculated air production, but does not update it here
   * @param _treeIds array of tree ids
   */
  function getTreesAirProduction(uint256[] memory _treeIds) public view returns(uint256[] memory productions){
    productions = new uint256[](_treeIds.length);
    
    for(uint256 i = 0; i < _treeIds.length; i++) {
      // Only for purchased trees
      if (trees[_treeIds[i]].startDate != 0) {
        //Equal to days passed since purchase, as it increases 1 AIR per day
        uint airProduction = now.sub(trees[_treeIds[i]].startDate).div(1 days);

        if (airProduction > 100) airProduction = 100;
        if (airProduction == 0) airProduction = defaultAirProduction;
        
        productions[i] = airProduction;
      }
      else productions[i] = defaultAirProduction;
    }
    return productions;
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

  //fallback
  function() external payable{
    revert();
  }
}
