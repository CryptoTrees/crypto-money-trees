//const BigNumber = require("bignumber.js");
const BigNumber = web3.utils.BN;
require("chai")
  .use(require("chai-shallow-deep-equal"))
  .use(require("chai-bignumber")(BigNumber))
  .use(require("chai-as-promised"))
  .should();

const Trees = artifacts.require("Trees");
const CryptoTrees = artifacts.require("CryptoTrees");
const AirTokens = artifacts.require("AirTokens");

const CONTRACT_AIR_ALLOWANCE = new BigNumber(
  web3.utils.toWei("100000000", "ether")
);

contract("CryptoTrees", ([owner, admin, user1, user2, random]) => {
  before(async () => {
    this.treeTokens = await CryptoTrees.deployed();
    this.airTokens = await AirTokens.deployed();
    this.trees = await Trees.deployed();

    await this.treeTokens.addMinter(this.trees.address);
    await this.airTokens.approve(this.trees.address, CONTRACT_AIR_ALLOWANCE);
  });
  describe("Trees::Access", () => {
    it("Only owner can call addAdmin", async () => {
      await this.trees.addAdmin(admin, { from: owner }).should.be.fulfilled;
      await this.trees.addAdmin(admin, { from: random }).should.be.rejected;
    });

    it("Only owner can call removeAdmin", async () => {
      await this.trees.removeAdmin(admin, { from: owner }).should.be.fulfilled;
      await this.trees.removeAdmin(admin, { from: random }).should.be.rejected;
    });
  });

  describe("Tokens::Access", () => {
    it("correct owner of base contract", async () => {
      let owner = await this.trees.owner();
      owner.should.be.equal(owner);
    });

    it("correct contract allowance to spend AIR tokens", async () => {
      let allowance = await this.airTokens.allowance(owner, this.trees.address);
      allowance.toString().should.be.equal(CONTRACT_AIR_ALLOWANCE.toString());
    });

    it("correct minter role for TREE tokens", async () => {
      let isMinter = await this.treeTokens.isMinter(this.trees.address);
      isMinter.should.be.true;
    });
  });

  describe("Trees::Minting", () => {
    it("can generate 5 new trees", async () => {
      await this.trees.generateTrees(5).should.be.fulfilled;
      let balance = await this.treeTokens.totalSupply();
      balance.toNumber().should.be.equal(5);
    });

    it("only owner can generate trees", async () => {
      await this.trees.generateTrees(5, { from: user1 }).should.be.rejected;
    });

    it("correct newly minted tree details", async () => {
      await this.trees.generateTrees(5).should.be.fulfilled;
      let tree = await this.trees.trees(1);
      tree.treeId.toString().should.be.equal("1");
      tree.owner.toString().should.be.equal(this.trees.address);
      tree.purchaseDate.toString().should.be.equal("0");
      tree.onSale.should.be.true;
    });
  });

  describe("Trees::Buying", () => {
    it("owner cannot buy its own tree", async () => {
      await this.trees.buyTree(1, { from: owner }).should.be.rejected;
    });

    it("user can buy a tree if sends enough ether", async () => {
      await this.trees.buyTree(1, {
        from: user1,
        value: web3.utils.toWei("100", "finney")
      }).should.be.fulfilled;
    });

    it("bought tree is not on sale anymore", async () => {
      let tree = await this.trees.trees(1);
      tree.onSale.should.be.false;
    });

    it("user cannot buy a tree if sends low ether", async () => {
      await this.trees.buyTree(2, {
        from: user2,
        value: web3.utils.toWei("50", "finney")
      }).should.be.rejected;
    });
  });

  describe("Trees::Selling", () => {
    it("cannot put tree on sale without approving first", async () => {
      await this.trees.putTreeOnSale(1, 1000, { from: user1 }).should.be
        .rejected;
    });

    it("should be able to put tree on sale", async () => {
      //Approve contract to transfer tree
      await this.treeTokens.approve(this.trees.address, 1, { from: user1 })
        .should.be.fulfilled;
      // How will FrontEnd specify the sell price?
      await this.trees.putTreeOnSale(1, 1000, { from: user1 }).should.be
        .fulfilled;

      // Check on sale details
      let tree = await this.trees.trees(1);
      tree.onSale.should.be.true;
      tree.salePrice.toString().should.be.equal("1000");

      //Base contract now owns this tree (was put on sale)
      let newOwner = await this.treeTokens.ownerOf(1);
      newOwner.should.be.equal(this.trees.address);
    });

    it("user can remove tree from sale", async () => {
      await this.trees.cancelTreeSell(1, { from: user1 }).should.be.fulfilled;
    });
  });

  describe("Trees::Rewards", () => {
    it("users cannot claim rewards of a tree they don't own", async () => {
      await this.trees.pickReward(1, { from: random }).should.be.rejected;
      let tree = await this.trees.trees(1);
    });

    it("correct rewards calculation", async () => {
      //Only for less than 100 days passed
      let rewards = await this.trees.checkRewards([3]);
      let daysPassed = await this.trees.daysSinceLastClaim(3);
      daysPassed = Number(daysPassed.toString());
      let expectedRewards = (daysPassed * (1 + daysPassed)) / 2;
      rewards.toString().should.be.equal(String(expectedRewards));
    });

    it("users can claim rewards of one tree successfully", async () => {
      await this.trees.buyTree(4, {
        from: user2,
        value: web3.utils.toWei("100", "finney")
      }).should.be.fulfilled;

      let daysPassed = await this.trees.daysSinceLastClaim(4);
      daysPassed = Number(daysPassed.toString());
      let rewards = (daysPassed * (1 + daysPassed)) / 2;

      //Temporal function in contract simulates as time has passed
      await this.trees.pickReward(4, { from: user2 }).should.be.fulfilled;

      let airBalance = await this.airTokens.balanceOf(user2);
      airBalance
        .toString()
        .should.be.equal(String(web3.utils.toWei(String(rewards), "ether")));
    });

    it("air production should update after claiming rewatds", async () => {
      let tree = await this.trees.trees(4);
      tree.airProduction.toString().should.not.be.equal("1"); //default is 1
    });
  });

  describe("FrontEnd::Getters", () => {
    it("can get all trees by owner", async () => {
      await this.trees.buyTree(2, {
        from: user2,
        value: web3.utils.toWei("100", "finney")
      }).should.be.fulfilled;
      let treesOwned = await this.trees.getOwnerTrees(user2);
      //user 2 has bought treeId 2 and 4
      expect(treesOwned.toString()).to.include("2");
      expect(treesOwned.toString()).to.include("4");
    });

    it("can get all tree ids on sale", async () => {
      let treesOnSale = await this.trees.getTreesOnSale();
      //tree id 3 and 5 are on sale
      expect(treesOnSale.toString()).to.include("3");
      expect(treesOnSale.toString()).to.include("5");
    });
  });
});
