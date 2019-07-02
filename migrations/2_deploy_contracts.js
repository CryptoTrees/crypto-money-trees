const Trees = artifacts.require("Trees");
const CryptoTrees = artifacts.require("CryptoTrees");

module.exports = deployer => {
  deployer.deploy(CryptoTrees).then(() => {
    return deployer.deploy(Trees, CryptoTrees.address);
  });
};
