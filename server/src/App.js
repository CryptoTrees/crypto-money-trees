import React from "react"
import { render } from "react-dom"
import { BrowserRouter, Route, Link, Switch } from "react-router-dom"
import Web3 from "web3"

import { abi as contractAbi } from "./../build/contracts/Trees.json"
import { abi as treeTokenAbi } from "./../build/contracts/CryptoTrees.json"
import { abi as airTokenAbi } from "./../build/contracts/AirTokens.json"
import "./index.styl"

import Market from './components/market/Market'
import MyTrees from './components/dashboard/MyTrees'
import InitialPage from './components/InitialPage'
import Login from './components/Login'

// 1 day -> 0x59b42857df02690ea5796483444976dbc5512d9e ropsten
// 1 second -> 0xa783ce9bcf718f8c6c22f7585c54c30c406588f7 ropsten
// 1 day mainnet -> 0xFfFce2Dc587BadBD10B4Fe17F0F5F293458f6793
// const contractAddress = '0xFfFce2Dc587BadBD10B4Fe17F0F5F293458f6793' // Mainnet

// --- CONTRACTS ---
const contractAddress = "0xe5957fbB650403FaE8400c7a4A74f592D909566e";
const treesTokenAddress = "0x2E23413cabfAE218823ee17FcF110757aE7386b7";
const airTokenAddress = "0xB327A0fa7974BC1A16912D40AC96eB26cd664E41";


class App extends React.Component {
  constructor() {
    super()
    const isEthereumDefined = typeof ethereum != 'undefined'
    this.state = {
      isEthereumDefined
    }
    if (isEthereumDefined) this.setup()
  }

  async setup() {
    if (!window.currentAccount) {
      if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        try {
          await ethereum.enable()
          ethereum.on('accountsChanged', function () {
            console.log('Account Changed!');
            // Do something...          
          })
          window.currentAccount = ethereum.selectedAddress
        } catch (error) {
          console.error("You must approve this dApp to interact with it")
        }
      }
      else if (window.web3) {
        window.web3 = new Web3(web3.currentProvider);
        let accounts = await web3.eth.getAccounts()
        window.currentAccount = accounts[0]
      }
      else {
        // Get all the trees on sale except yours)
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
        window.web3 = new Web3('https://ropsten.infura.io/v3/6a622f155ca346e1b3521e8160c71b65');
        // let newAccount = await web3.eth.accounts.create();
        // window.currentAccount = newAccount.address
      }

      window.contract = new web3.eth.Contract(contractAbi, contractAddress)
      window.treeContract = new web3.eth.Contract(treeTokenAbi, treesTokenAddress)
      window.airContract = new web3.eth.Contract(airTokenAbi, airTokenAddress)

    }


  }

  async generateTree(amount) {
    let result = await contract.methods.generateTrees(amount).send({
      from: currentAccount
    });
    return result;
  }

  async getTreeDetails(id) {
    let result = await contract.methods.trees(id).call()
    return result;
  }

  async getTreeIds() {
    let result = await contract.methods.getOwnerTrees(currentAccount).call()
    return result;
  }

  async putTreeOnSale(id, price) {
    //Approve Tree token
    let result = await treeContract.methods.approve(contractAddress, id).send({
      from: currentAccount
    })
    //Send sell call
    result = await contract.methods.putTreeOnSale(id, web3.utils.toWei(price)).send({
      from: currentAccount
    });
    return result;
  }

  async buyTree(id, price) {
    //Approve AIR tokens
    await airContract.methods.approve(contractAddress, web3.utils.toWei(price)).send({
      from: currentAccount
    })
    //Send buy call
    result = await contract.methods.buyTree(id).send({
      from: currentAccount
    });
    return result;

  }

  async getTreesOnSale() {
    let result = await contract.methods.getTreesOnSale().call()
    return result;
  }

  async cancelTreeSell(id) {
    let result = await contract.methods.cancelTreeSell(id).send({
      from: currentAccount
    });
    return result;
  }

  async pickReward(id) {
    let result = await contract.methods.pickReward(id).send({
      from: currentAccount
    });
    return result;
  }

  async checkRewards(ids) {
    let result = await contract.methods.checkRewards(ids).call({
      from: currentAccount
    });
    return result;
  }

  async checkAirProductions(ids) {
    //TODO: check function on smart contract
    //const result = await contract.methods.getTreesAirProduction(ids).call()
    //console.log('air productions', result);
    let airProd = Array.from({ length: ids.length }, () => Math.floor(Math.random() * 100))
    airProd[ids.length - 1] = 100
    return airProd
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
              isEthereumDefined={this.state.isEthereumDefined}
            />
          )} />
          <Route
            path="/my-trees"
            render={context => (
              <MyTrees
                isEthereumDefined={this.state.isEthereumDefined}
                history={context.history}
                redirectTo={(history, location) =>
                  this.redirectTo(history, location)
                }
                setup={() => this.setup()}
                getTreeIds={() => this.getTreeIds()}
                getTreeDetails={id => this.getTreeDetails(id)}
                sellTree={(id, price) => this.putTreeOnSale(id, price)}
                cancelSell={id => this.cancelTreeSell(id)}
                pickReward={id => this.pickReward(id)}
                checkRewards={ids => this.checkRewards(ids)}
              />
            )}
          />
          <Route
            path="/market"
            render={context => (
              <Market
                isEthereumDefined={this.state.isEthereumDefined}
                history={context.history}
                redirectTo={(history, location) =>
                  this.redirectTo(history, location)
                }
                setup={() => this.setup()}
                getTreesOnSale={() => this.getTreesOnSale()}
                getTreeIds={() => this.getTreeIds()}
                getTreeDetails={id => this.getTreeDetails(id)}
                buyTree={(id, price) => this.buyTree(id, price)}
                checkAirProductions={(ids) => this.checkAirProductions(ids)}
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
