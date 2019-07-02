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
          `https://ropsten.infura.io/${process.env.INFURAKEY}`
        ); // The last parameter is the account to use from that mnemonic
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
  }
};

// Steps to deploy using infura to any network:
// 1. Install and import 'truffle-hdwallet-provider'
// 2. Get a mnemonic from 'testrpc' and save it here as a variable
// 3. Create the configuration with networks: {ropsten: {}}
// 4. Make sude to provide the HdProvider with the mnemonic, the infura network and the account to use from that mnemonic
// 5. Deploy with 'truffle migrate --network=ropsten'
// 6. Make sure to specify the gas to avoid errors
