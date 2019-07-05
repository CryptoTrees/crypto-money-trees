const HdProvider = require("truffle-hdwallet-provider");

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      network_id: "*",
      port: 8545
    },
    ropsten: {
      provider: function() {
        return new HdProvider(
          process.env.MNEMONIC,
          `https://ropsten.infura.io/v3/${process.env.INFURAKEY}`
        );
      },
      network_id: 3,
      gas: 6e6
    }
  },
  compilers: {
    solc: {
      version: "^0.5.10",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  plugins: ["truffle-plugin-verify"],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API
  },
  mocha: {
    useColors: true,
    reporter: "eth-gas-reporter",
    reporterOptions: {
      currency: "USD",
      gasPrice: 20
    }
  }
};

// Steps to deploy using infura to any network:
// 1. Install and import 'truffle-hdwallet-provider'
// 2. Get a mnemonic from 'testrpc' and save it in the .env file
// 3. Create the configuration with networks: {ropsten: {}}
// 4. Create Infura key and save it to .env file
// 5. Make sure to provide the HdProvider with the mnemonic and the infura key
// 6. Deploy with 'source .env && truffle migrate --reset --network=ropsten'
// 7. Make sure to specify the gas to avoid errors
