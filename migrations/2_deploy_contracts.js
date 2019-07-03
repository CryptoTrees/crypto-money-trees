const Trees = artifacts.require("Trees");
const CryptoTrees = artifacts.require("CryptoTrees");
const AirTokens = artifacts.require("AirTokens");

module.exports = deployer => {
  deployer
    .deploy(CryptoTrees)
    .then(() => {
      return deployer.deploy(AirTokens);
    })
    .then(() => {
      return deployer.deploy(Trees, CryptoTrees.address, AirTokens.address);
    });
};
