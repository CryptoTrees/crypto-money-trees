import React from "react"
import { render } from "react-dom"
import { BrowserRouter, Route, Link, Switch } from "react-router-dom"
import Web3 from "web3"
import firebase from 'firebase'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'
import { promisifyAll } from "bluebird"
import { abi as contractAbi } from "./../build/contracts/Trees.json"
import { abi as treeTokenAbi } from "./../build/contracts/CryptoTrees.json"
import { abi as airTokenAbi } from "./../build/contracts/AirTokens.json"
import "./index.styl"

// 1 day -> 0x59b42857df02690ea5796483444976dbc5512d9e ropsten
// 1 second -> 0xa783ce9bcf718f8c6c22f7585c54c30c406588f7 ropsten
// 1 day mainnet -> 0xFfFce2Dc587BadBD10B4Fe17F0F5F293458f6793
// const contractAddress = '0xFfFce2Dc587BadBD10B4Fe17F0F5F293458f6793' // Mainnet

// --- CONTRACTS ---
const contractAddress = "0xe5957fbB650403FaE8400c7a4A74f592D909566e";
const treesTokenAddress = "0x2E23413cabfAE218823ee17FcF110757aE7386b7";
const airTokenAddress = "0xB327A0fa7974BC1A16912D40AC96eB26cd664E41";


const firebaseConfig = {
  apiKey: "AIzaSyAsg_zSvo2eL_ZqkDUAj3FJCWljRdGzOpM",
  authDomain: "node-trees.firebaseapp.com",
  databaseURL: "https://node-trees.firebaseio.com",
  projectId: "node-trees",
  storageBucket: "",
  messagingSenderId: "701310308414",
  appId: "1:701310308414:web:b82064618f7e2748"
}
const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: 'popup',
  // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
  signInSuccessUrl: '/market',
  // We will display Google and Facebook as auth providers.
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.FacebookAuthProvider.PROVIDER_ID
  ]
}
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

class App extends React.Component {
  constructor() {
    super()
    const isEthereumDefined = typeof ethereum != 'undefined'
    this.state = {
      isEthereumDefined,
      currentAccount: ""
    }
    if (isEthereumDefined) this.setup()
  }

  async setup() {
    let accounts
    if (window.ethereum) {
      window.web3 = new Web3(ethereum);
      try {
        await ethereum.enable()
        accounts = await web3.eth.getAccounts()
      } catch (error) {
        console.error("You must approve this dApp to interact with it")
      }
      console.log("Connected Account: ", accounts[0])

      ethereum.on('accountsChanged', function (accounts) {
        console.log('Account Changed!'); !
          this.setState({ currentAccount: accounts[0] })
      })
    }
    else if (window.web3) {
      console.log('web3')
      window.web3 = new Web3(web3.currentProvider);
    }
    else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
      window.web3 = new Web3('https://ropsten.infura.io/v3/6a622f155ca346e1b3521e8160c71b65');
    }

    window.contract = new web3.eth.Contract(contractAbi, contractAddress)
    window.treeContract = new web3.eth.Contract(treeTokenAbi, treesTokenAddress)
    window.airContract = new web3.eth.Contract(airTokenAbi, airTokenAddress)

    this.setState({ currentAccount: accounts[0] })
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
    await airContract.methods.approve(contractAddress, web3.utils.toWei(price)).send({
      from: this.state.currentAccount
    })
    //Send buy call
    result = await contract.methods.buyTree(id).send({
      from: this.state.currentAccount
    });
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
    let result = await contract.methods.checkRewards(ids).call({
      from: this.state.currentAccount
    });
    return result;
  }

  async checkAirProductions(ids) {
    //TODO: check function on smart contract
    //const result = await contract.methods.getTreesAirProduction(ids).call()
    //console.log('air productions', result);
    return Array(ids.length).fill(1);
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

class InitialPage extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div>
        <NavBar />
        <div className="background-trees">
          <div className="container initial-top-container">
            <div className="row">
              <div className="spacer-30" />
              <div className="col-12">
                <h1 className="initial-title">Crypto Trees</h1>
              </div>
              <div className="top-spacer" />
              <div className="col-12">
                <p>
                  <i className="initial-subtitle">Simplifying tree planting with crypto rewards</i>
                </p>
              </div>
              <div className="top-spacer" />
              <div className="col-12">
                <Link className="button-like no-margin" to={this.props.isEthereumDefined ? "/market" : "/login"}>
                  Start Planting
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="container initial-half-container">
          <div className="spacer-20" />
          <div className="row">
            <h2>Understanding Air Production</h2>
            <p>
              Everytime we plant a tree, it will start pr
              the treasury where a percentage is distributed daily accross all
              the tree owners. The more tree power your tree has, the bigger
              portion of rewards you get.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

class MyTrees extends React.Component {
  constructor(props) {
    super(props);
    this.init();
    this.state = {
      allTrees: [],
      allTreesIds: [],
      allRewards: [],
      isCheckingRewards: false,
      treesLoaded: false
    }

    if (!this.props.isEthereumDefined) this.props.redirectTo(this.props.history, "/login")
  }

  async init() {

    await this.props.setup();
    let allTrees = [];
    let allRewards = [];
    let ids = await this.props.getTreeIds();
    ids = ids.map(element => parseFloat(element));
    for (let i = 0; i < ids.length; i++) {
      let details = await this.props.getTreeDetails(ids[i]);
      if (details[1] === "0x0000000000000000000000000000000000000000") continue;
      // details = details.map(element => {
      //   if (typeof element === "object") return parseFloat(element);
      //   else return element;
      // });

      for (let j = 0; j < 8; j++) {
        if (typeof details[j] === "object") details[j] = parseFloat(details[j]);
      }
      allTrees.push(details);
    }
    const allTreesIds = allTrees.map(tree => tree[0]);
    allRewards = await this.props.checkRewards(allTreesIds);
    allRewards = allRewards.map(element => parseFloat(element));
    // Note the ( bracket instead of curly bracket {
    allTrees = allTrees.map((detail, index) => (
      <TreeBox
        id={detail[0]}
        daysPassed={Math.floor(
          (Math.floor(Date.now() / 1000) - detail[5]) / 86400
        )} // How many days passed after the creation of this tree
        airProduction={detail[2]}
        onSale={detail[4]}
        sellTree={(id, price) => this.props.sellTree(id, price)}
        key={detail[0]}
        cancelSell={id => this.props.cancelSell(id)}
        pickReward={id => this.props.pickReward(id)}
        lastRewardPickedDate={detail[5]}
        reward={allRewards[index]}
      />
    ));
    this.setState({
      allTrees,
      allTreesIds,
      allRewards,
      treesLoaded: true
    });
  }

  updateRewards() {
    allTrees = allTrees.map((detail, index) => (
      <TreeBox
        id={detail[0]}
        daysPassed={detail[2]}
        airProduction={detail[3]}
        onSale={detail[6]}
        sellTree={(id, price) => this.props.sellTree(id, price)}
        key={detail[0]}
        cancelSell={id => this.props.cancelSell(id)}
        pickReward={id => this.props.pickReward(id)}
        reward={this.state.allRewards[index]}
      />
    ));
    this.setState({ allTrees });
  }

  render() {
    const information = (
      <div>
        <NavBar inMyTrees="true" />
        <div className="container">
          <div className="row">
            <Information message="You don't have any trees. Start by buying some on the Market and wait for the transaction to be processed by the miners" />
          </div>
          <div className="row">
            <button
              className="margin-auto-and-top"
              onClick={() => {
                window.location = "/my-trees";
              }}
            >
              Reload
            </button>
            <Link to="/market" className="button-like margin-auto-and-top">
              Go To Market
            </Link>
          </div>
        </div>
      </div>
    );
    const loading = (
      <Information message="Loading data from the blockchain..." />
    );
    const main = (
      <div>
        <NavBar inMyTrees="true" />
        <div className="container">
          <div className={this.state.treesLoaded ? "row" : "hidden"}>
            <button
              className="check-rewards-button"
              onClick={async () => {
                this.setState({ isCheckingRewards: true });

                let allRewards = await this.props.checkRewards(
                  this.state.allTreesIds
                );
                allRewards = allRewards.map(element => parseFloat(element));

                console.log("Rewards Updated!");

                this.setState({
                  isCheckingRewards: false,
                  allRewards
                });
              }}
            >
              {this.state.isCheckingRewards ? "Loading..." : "Check Rewards"}
            </button>
            <button
              className="check-rewards-button"
              onClick={() => {
                window.location = "/my-trees";
              }}
            >
              Reload
            </button>
          </div>
          <div className="row">
            {this.state.treesLoaded ? this.state.allTrees : loading}
          </div>
        </div>
        <div className="spacer" />
      </div>
    );

    return (
      <div>
        {this.state.allTrees.length === 0 && this.state.treesLoaded
          ? information
          : main}
      </div>
    );
  }
}

class Market extends React.Component {
  constructor(props) {
    super(props);
    this.init();
    this.state = {
      allTrees: [],
      treesLoaded: false
    };

    if (!this.props.isEthereumDefined) this.props.redirectTo(this.props.history, "/login")
  }

  async init() {
    await this.props.setup();
    // Get all the trees on sale except yours
    let treesOnSale = await this.props.getTreesOnSale();
    let myTrees = await this.props.getTreeIds();
    treesOnSale = treesOnSale.map(element => parseFloat(element));
    myTrees = myTrees.map(element => parseFloat(element));
    let treesToShow = treesOnSale.slice(0); // Create a copy

    // Remove your trees that are not on sale
    for (let i = 0; i < myTrees.length; i++) {
      for (let a = 0; a < treesOnSale.length; a++) {
        if (myTrees[i] === treesOnSale[a]) {
          treesToShow.splice(a, 1);
        }
      }
    }

    // If there's at least one tree on sale not yours, get them details and show em
    if (treesToShow.length > 0) {
      let allTrees = [];
      let airProductions = await this.props.checkAirProductions(treesToShow)
      //console.log(airProductions)

      for (let i = 0; i < treesToShow.length; i++) {
        let details = await this.props.getTreeDetails(treesToShow[i]);
        details[2] = airProductions[i];

        // Remove the 0x trees
        if (details[1] === "0x0000000000000000000000000000000000000000")
          continue;
        // details = details.map(element => {
        //   if (typeof element === "object") return parseFloat(element);
        //   else return element;
        // });
        for (let j = 0; j < 8; j++) {
          if (typeof details[j] === "object") details[j] = parseFloat(details[j]);
        }
        allTrees.push(details);
      }

      // Note the ( bracket instead of curly bracket {
      allTrees = allTrees
        //Remove your trees on sale
        .filter(detail => detail[1] !== this.props.currentAccount)
        .map(detail => (
          <TreeMarketBox
            id={detail[0]}
            owner={detail[1]}
            daysPassed={Math.floor(
              (Math.floor(Date.now() / 1000) - detail[5]) / 86400
            )} // How many days passed after the creation of this tree
            airProduction={detail[2]}
            buyTree={(id, price) => this.props.buyTree(id, price)}
            price={web3.utils.fromWei(String(detail[3]), "ether")}
            key={detail[0]}
          />
        ));
      this.setState({ allTrees, treesLoaded: true });
    }
  }

  render() {
    const loading = (
      <Information message="Loading data from the blockchain..." />
    );
    const noTrees = (
      <Information message="There aren't trees on the market. Wait until new ones are generated or someone puts his trees on sale" />
    );
    const main = (
      <div>
        <div className="container">
          <div className={this.state.treesLoaded ? "row" : "hidden"}>
            <div className="top-spacer" />
            {this.state.allTrees}
          </div>
          <div className={this.state.treesLoaded ? "hidden" : "row"}>
            {loading}
          </div>
        </div>
        <div className="spacer" />
      </div>
    );

    return (
      <div>
        <NavBar inMarket="true" />
        {this.state.treesLoaded && this.state.allTrees.length === 0
          ? noTrees
          : main}
      </div>
    );
  }
}

class NavBar extends React.Component {
  render() {
    return (
      <nav className="navbar navbar-expand-lg navbar-light">
        <Link className="navbar-brand" to="/">
          <img
            src="imgs/forest.svg"
            width="30"
            height="30"
            className="d-inline-block align-top"
            alt=""
          />
          &nbsp; Crypto Trees
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarText"
          aria-controls="navbarText"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarText">
          <ul className="navbar-nav ml-auto">
            <li
              className={this.props.inMyTrees ? "nav-item active" : "nav-item"}
            >
              <Link to="/my-trees" className="nav-link">
                My Trees
              </Link>
            </li>
            <li
              className={this.props.inMarket ? "nav-item active" : "nav-item"}
            >
              <Link to="/market" className="nav-link">
                Market
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    );
  }
}

class TreeBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showSellConfirmation1: false,
      showSellConfirmation2: false,
      showCancelSell: false,
      rewardClicked: false,
      waterClicked: false,
      rewardAvailableToday:
        Math.floor(Date.now() / 1000) - 1517245959 > 60 * 60 * 24, // If a day has passed since the last reward picked or not
      amountToSell: 1,
      image: this.getImageAirProduction(this.props.airProduction)
    };
  }

  getImageAirProduction(treePower) {
    // if(treePower < 10) {
    // 	return 'imgs/1.jpg'
    // } else if(treePower < 25) {
    // 	return 'imgs/2.jpg'
    // } else if(treePower < 50) {
    // 	return 'imgs/3.jpg'
    // } else if(treePower < 100) {
    // 	return 'imgs/4.jpg'
    // } else {
    // 	return 'imgs/5.jpg'
    // }
    return "imgs/tree-big.jpg"; // TODO Change this to the evolving images
  }

  render() {
    return (
      <div className="col-6 col-sm-4 tree-container">
        <img src={this.state.image} className="tree-image" />
        <a
          href={`https://ropsten.etherscan.io/token/${treesTokenAddress}?a=${
            this.props.id
            }`}
          target="_blank"
        >
          <h4>Id {this.props.id}</h4>
        </a>

        <p>
          Air Production{" "}
          <span className="color-green">{this.props.airProduction}</span>
        </p>
        <p>
          <span className="color-blue">{this.props.daysPassed}</span> days
          passed after creation
        </p>
        <p>
          On sale{" "}
          <span className="color-red">{this.props.onSale.toString()}</span>
        </p>
        <button
          className="full-button"
          disabled={
            this.props.reward === 0 ||
            this.state.rewardClicked ||
            !this.state.rewardAvailableToday
          }
          onClick={async () => {
            try {
              await this.props.pickReward(this.props.id);
              this.setState({ rewardClicked: true });
            } catch (e) { }
          }}
        >
          {this.props.reward > 0 && this.state.rewardAvailableToday
            ? `Pick ${this.props.reward} AIR Reward Tokens`
            : "Reward Available Tomorrow"}
        </button>

        <button
          className={this.props.onSale ? "hidden" : "full-button"}
          onClick={() => {
            this.setState({
              showSellConfirmation1: !this.state.showSellConfirmation1
            });
            this.setState({ showSellConfirmation2: false });
          }}
        >
          {this.state.showSellConfirmation1 ? "Cancel" : "Put Tree On Sale"}
        </button>

        <button
          className={this.props.onSale ? "full-button" : "hidden"}
          onClick={() => {
            this.setState({ showCancelSell: !this.state.showCancelSell });
          }}
        >
          {this.state.showCancelSell ? "Are you sure?" : "Cancel active sell"}
        </button>

        <div
          className={
            this.state.showSellConfirmation1 ? "full-button" : "hidden"
          }
        >
          <p>At what price do you want to sell your tree in AIR?</p>
          <input
            key={this.props.id}
            className="wide-button"
            type="number"
            defaultValue={this.state.amountToSell}
            onChange={event => {
              this.setState({ amountToSell: event.target.value });
            }}
          />
          <button
            className="wide-button"
            onClick={() => {
              this.setState({ showSellConfirmation2: true });
            }}
          >
            Put Tree On Sale
          </button>
        </div>

        <div
          className={
            this.state.showSellConfirmation2 ? "full-button" : "hidden"
          }
        >
          <p>
            Are you sure you want to put on sale this tree for{" "}
            {this.state.amountToSell} AIR?{" "}
          </p>
          <button
            className="wide-button"
            onClick={() => {
              this.setState({ showSellConfirmation2: false });
              this.setState({ showSellConfirmation1: false });
              this.props.sellTree(
                this.props.id,
                this.state.amountToSell
              );
            }}
          >
            Yes
          </button>
          <button
            className="wide-button"
            onClick={() => {
              this.setState({ showSellConfirmation2: false });
              this.setState({ showSellConfirmation1: false });
            }}
          >
            No
          </button>
        </div>

        <div className={this.state.showCancelSell ? "full-button" : "hidden"}>
          <button
            className="wide-button"
            onClick={async () => {
              try {
                await this.props.cancelSell(this.props.id);
                this.setState({ showCancelSell: false });
              } catch (e) { }
            }}
          >
            Yes, cancel sell
          </button>
          <button
            className="wide-button"
            onClick={() => {
              this.setState({ showCancelSell: false });
            }}
          >
            No, keep tree on the market for sale
          </button>
        </div>
      </div>
    );
  }
}

class TreeMarketBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buyClicked: false,
      image: this.getImageAirProduction(this.props.airProduction)
    };
  }

  getImageAirProduction(airProduction) {
    // if(treePower < 10) {
    // 	return 'imgs/1.jpg'
    // } else if(treePower < 25) {
    // 	return 'imgs/2.jpg'
    // } else if(treePower < 50) {
    // 	return 'imgs/3.jpg'
    // } else if(treePower < 100) {
    // 	return 'imgs/4.jpg'
    // } else {
    // 	return 'imgs/5.jpg'
    // }
    return "imgs/tree-big.jpg"; // TODO Change this to the evolving images
  }

  render() {
    return (
      <div className="col-6 col-sm-4 tree-container">
        <img src={this.state.image} className="tree-image" />
        <a
          href={`https://ropsten.etherscan.io/token/${treesTokenAddress}?a=${
            this.props.id
            }`}
          target="_blank"
        >
          <h4>Id {this.props.id}</h4>
        </a>
        <p className="word-wrap">
          Owner{" "}
          <span className="color-yellow">
            {this.props.owner === contractAddress
              ? "The creator"
              : this.props.owner}
          </span>
        </p>
        <p>
          AIR Production{" "}
          <span className="color-green">{this.props.airProduction}</span>
        </p>
        <p>
          <span className="color-blue">{this.props.daysPassed}</span> days
          passed after creation
        </p>
        <button
          className="full-button"
          disabled={this.state.buyClicked}
          onClick={async () => {
            try {
              const result = await this.props.buyTree(
                this.props.id,
                this.props.price
              );
              this.setState({ buyClicked: true });
            } catch (e) { }
          }}
        >
          Buy Tree ({this.props.price} AIR)
        </button>
      </div>
    );
  }
}

class Information extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <h5 className="margin-auto-and-top">{this.props.message}</h5>
        </div>
        <div className="row">
          <p
            className={
              this.props.subTitle === undefined ? "hidden" : "margin-auto"
            }
          >
            {this.props.subTitle}
          </p>
        </div>
      </div>
    );
  }
}

class Login extends React.Component {
  constructor() {
    super()
  }

  render() {
    return (
      <div>
        <NavBar />
        <div className="container">
          <div className="row">
            <Information
              message="Metamask not detected"
              subTitle="Create an account or connect to metamask to begin"
            />
          </div>
          <div className="row justify-content-center">
            <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
          </div>
        </div>
      </div>
    )
  }
}

render(<App />, document.querySelector("#root"));
