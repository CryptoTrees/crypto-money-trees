const Trees = artifacts.require("Trees");
const CryptoTrees = artifacts.require("CryptoTrees");

module.exports = (deployer, network, accounts) => {
  deployer.deploy(CryptoTrees, { from: accounts[0] }).then(() => {
    return deployer.deploy(Trees, CryptoTrees.address, { from: accounts[0] });
  });
};
