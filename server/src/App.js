import React from "react"
import { render } from "react-dom"
import { BrowserRouter, Route, Switch } from "react-router-dom"
import Web3 from "web3"

import { abi as contractAbi } from "./../build/contracts/Trees.json"
import { abi as treeTokenAbi } from "./../build/contracts/CryptoTrees.json"
import { abi as airTokenAbi } from "./../build/contracts/AirTokens.json"
import "./index.styl"

import Market from './components/market/Market'
import MyTrees from './components/dashboard/Dashboard'
import InitialPage from './components/InitialPage'
import Login from './components/Login'
import airToken from '../build/contracts/AirTokens.json'
import cryptoTrees from '../build/contracts/CryptoTrees.json'
import trees from '../build/contracts/Trees.json'

//Temporal functions to use in console
// contract.methods.generateTrees(10).send({from:'0x39e1CF2ef6F2730ae3E980949Cb62a38BB567933'})
// contract.methods.cancelTreeSell(7).send({from:'0x69310fC745bf6ff51966AE456Ee09Fa5402F5FcB'})
// contract.methods.buyAirTokens().send({from:'0x69310fC745bf6ff51966AE456Ee09Fa5402F5FcB', value:'200000000000000000'}) //Buy 2 AIR tokens

// --- CONTRACTS ---
const contractAddress = trees.networks['3'].address
const treesTokenAddress = cryptoTrees.networks['3'].address
const airTokenAddress = airToken.networks['3'].address
console.log('Trees address', contractAddress)
console.log('CryptoTrees address', treesTokenAddress)
console.log('Air address', airTokenAddress)
// -----------------

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      isWeb3Defined: false,
      currentAccount: ''
    }

    this.setup()
  }

  async setup() {
    let account;
    if (!this.state.currentAccount) {

      // Modern dapp browsers...
      if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        web3.eth.transactionConfirmationBlocks = 1; //Hard code number of blocks needed
        try {
          await ethereum.enable()
          ethereum.on('accountsChanged', function () {
            console.log('Account Changed!');
          })
          account = ethereum.selectedAddress
        } catch (error) {
          console.error("You must approve this dApp to interact with it")
        }
      }

      // Legacy dapp browsers...
      else if (window.web3) {
        window.web3 = new Web3(web3.currentProvider)
        let accounts = await web3.eth.getAccounts()
        account = accounts[0]
      }

      // Non-dapp browsers...
      else {
        // Get all the trees on sale except yours)
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
        window.web3 = new Web3('https://ropsten.infura.io/v3/6a622f155ca346e1b3521e8160c71b65');
        let newAccount = await web3.eth.accounts.create();
        //TODO: Save in DB
        account = newAccount.address
      }

      window.contract = new web3.eth.Contract(contractAbi, contractAddress)
      window.treeContract = new web3.eth.Contract(treeTokenAbi, treesTokenAddress)
      window.airContract = new web3.eth.Contract(airTokenAbi, airTokenAddress)

      this.setState({ currentAccount: account, isWeb3Defined: true })

    }
  }

  async generateTree(amount) {
    let result = await contract.methods.generateTrees(amount).send({
      from: this.state.currentAccount
    });
    return result;
  }

  async getTreeDetails(id) {
    let result = await contract.methods.trees(id).call()
    return result;
  }

  async getTreeIds() {
    let result = await contract.methods.getOwnerTrees(this.state.currentAccount).call()
    return result;
  }

  async putTreeOnSale(id, price) {
    //Approve Tree token
    let result = await treeContract.methods.approve(contractAddress, id).send({
      from: this.state.currentAccount
    })
    //Send sell call
    result = await contract.methods.putTreeOnSale(id, web3.utils.toWei(price)).send({
      from: this.state.currentAccount
    });
    return result;
  }

  async buyTree(id, price) {
    //Approve AIR tokens
    let result = await airContract.methods.approve(contractAddress, web3.utils.toWei(price)).send({
      from: this.state.currentAccount
    })
    //Send buy call if approve was successful
    if (result.status === true) {
      result = await contract.methods.buyTree(id).send({
        from: this.state.currentAccount
      });
    }

    return result;

  }

  async buyMultipleTrees(type, amount) {
    //get Tree price
    let treePrice = await this.getTreePrice(type);

    //Approve AIR tokens
    let result = await airContract.methods.approve(contractAddress, web3.utils.toWei(String(treePrice * amount))).send({
      from: this.state.currentAccount
    })
    //Send buy call if approve was successful
    if (result.status === true) {
      result = await contract.methods.buyMultipleTrees(type, amount).send({
        from: this.state.currentAccount
      });
    }

    return result;

  }

  async getTreesOnSale() {
    let result = await contract.methods.getTreesOnSale().call()
    return result;
  }

  async cancelTreeSell(id) {
    let result = await contract.methods.cancelTreeSell(id).send({
      from: this.state.currentAccount
    });
    return result;
  }

  async pickReward(id) {
    let result = await contract.methods.pickReward(id).send({
      from: this.state.currentAccount
    });
    return result;
  }

  async checkRewards(ids) {
    let result = await contract.methods.checkRewards(ids).call();
    return result;
  }

  async getTreePrice(treeType) {
    let result = await contract.methods.priceByType(treeType).call();
    return web3.utils.fromWei(result.toString());
  }

  async checkAirProductions(ids) {
    //TODO: check function on smart contract

    //console.log('air productions', result);
    // let airProd = Array.from({ length: ids.length }, () => Math.floor(Math.random() * 100))
    // return airProd;

    let result = await contract.methods.getTreesAirProduction(ids).call()
    return result;

  }

  redirectTo(history, location) {
    history.push(location);
  }

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route path="/" exact render={() => (
            <InitialPage
              isWeb3Defined={this.state.isWeb3Defined}
            />
          )} />
          <Route
            path="/dashboard"
            render={context => (
              <MyTrees
                isWeb3Defined={this.state.isWeb3Defined}
                history={context.history}
                redirectTo={(history, location) =>
                  this.redirectTo(history, location)
                }
                getTreeIds={() => this.getTreeIds()}
                getTreeDetails={id => this.getTreeDetails(id)}
                sellTree={(id, price) => this.putTreeOnSale(id, price)}
                cancelSell={id => this.cancelTreeSell(id)}
                pickReward={id => this.pickReward(id)}
                checkRewards={ids => this.checkRewards(ids)}
                currentAccount={this.state.currentAccount}
              />
            )}
          />
          <Route
            path="/market"
            render={context => (
              <Market
                isWeb3Defined={this.state.isWeb3Defined}
                history={context.history}
                redirectTo={(history, location) =>
                  this.redirectTo(history, location)
                }
                getTreesOnSale={() => this.getTreesOnSale()}
                getTreeIds={() => this.getTreeIds()}
                getTreeDetails={id => this.getTreeDetails(id)}
                buyTree={(id, price) => this.buyTree(id, price)}
                buyMultipleTrees={(type, amount) => this.buyMultipleTrees(type, amount)}
                checkAirProductions={(ids) => this.checkAirProductions(ids)}
                getTreePrice={(treeType) => this.getTreePrice(treeType)}
                currentAccount={this.state.currentAccount}
              />
            )}
          />
          <Route
            path="/login"
            render={context => (
              <Login />
            )}
          />
        </Switch>
      </BrowserRouter>
    );
  }
}

render(<App />, document.querySelector("#root"));
