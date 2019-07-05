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

contract("CryptoTrees", ([admin, user1, user2]) => {
  before(async () => {
    this.trees = await Trees.deployed();
    this.treeTokens = await CryptoTrees.deployed();
    this.airTokens = await AirTokens.deployed();

    await this.treeTokens.addMinter(this.trees.address);
    await this.airTokens.approve(this.trees.address, CONTRACT_AIR_ALLOWANCE);
  });

  describe("Tokens::Access", () => {
    it("correct owner of base contract", async () => {
      let owner = await this.trees.owner();
      owner.should.be.equal(admin);
    });

    it("correct contract allowance to spend AIR tokens", async () => {
      let allowance = await this.airTokens.allowance(admin, this.trees.address);
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
  });
});
