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
  describe("Tokens::Access", () => {
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

    it("user cannot buy a tree if sends low ether", async () => {
      await this.trees.buyTree(2, {
        from: user2,
        value: web3.utils.toWei("50", "finney")
      }).should.be.rejected;
    });
  });
});
