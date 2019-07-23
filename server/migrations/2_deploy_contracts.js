const Trees = artifacts.require("Trees");
const CryptoTrees = artifacts.require("CryptoTrees");
const AirTokens = artifacts.require("AirTokens");

const BigNumber = web3.utils.BN;

const CONTRACT_AIR_ALLOWANCE = new BigNumber(
  web3.utils.toWei("100000000", "ether") //100 Million
);

const TOKEN_TRANSFER = new BigNumber(
  web3.utils.toWei("10", "ether") // 10 AIR each
);

const INITIAL_TREES_AMOUNT = 10;

module.exports = (deployer, network, accounts) => {
  deployer
    .deploy(CryptoTrees)
    .then(() => {
      return deployer.deploy(AirTokens);
    })
    .then(() => {
      return deployer.deploy(Trees, CryptoTrees.address, AirTokens.address);
    })
    .then(async () => {
      let tokenTreesInst = await CryptoTrees.deployed();
      await tokenTreesInst.addMinter(Trees.address);

      let treesInst = await Trees.deployed();
      await treesInst.generateTrees(INITIAL_TREES_AMOUNT);

      let airTokensInst = await AirTokens.deployed();
      await airTokensInst.approve(treesInst.address, CONTRACT_AIR_ALLOWANCE, { from: accounts[0] });

      await airTokensInst.transfer(accounts[1], TOKEN_TRANSFER, { from: accounts[0] });
      await airTokensInst.transfer(accounts[2], TOKEN_TRANSFER, { from: accounts[0] });
    });
};
