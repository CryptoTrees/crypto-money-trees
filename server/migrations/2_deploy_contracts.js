const Trees = artifacts.require("Trees");
const CryptoTrees = artifacts.require("CryptoTrees");
const AirTokens = artifacts.require("AirTokens");

const BigNumber = web3.utils.BN;

const CONTRACT_AIR_ALLOWANCE = new BigNumber(
  web3.utils.toWei("100000000", "ether") //100 Million
);

const INITIAL_TREES_AMOUNT = 10;

module.exports = (deployer, network, accounts) => {
  deployer
    .deploy(CryptoTrees, {from:accounts[0]})
    .then(() => {
      return deployer.deploy(AirTokens, {from:accounts[0]});
    })
    .then(() => {
      return deployer.deploy(Trees, CryptoTrees.address, AirTokens.address, {from:accounts[0]});
    })
    .then(async () => {
      let tokenTreesInst = await CryptoTrees.deployed();
      await tokenTreesInst.addMinter(Trees.address, {from:accounts[0]});

      let treesInst = await Trees.deployed();
      await treesInst.generateTrees(INITIAL_TREES_AMOUNT, 1, {from:accounts[0]});

      let airTokensInst = await AirTokens.deployed();
      await airTokensInst.approve(treesInst.address, CONTRACT_AIR_ALLOWANCE, { from: accounts[0] });
    });
};
