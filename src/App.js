import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter, Route, Link, Switch } from 'react-router-dom'
import Web3 from 'web3'
import { promisifyAll } from 'bluebird'
import { abi as contractAbi } from './../build/contracts/Trees.json'
import './index.styl'

const contractAddress = '0x03a203119e9743233d4133108e860770bc63fb9f'

class App extends React.Component {
	constructor () {
		super()
		window.web3 = new Web3(web3.currentProvider || new Web3.providers.HttpProvider('https://ropsten.infura.io/6GO3REaLghR6wPhNJQcc'))
		window.contract = web3.eth.contract(contractAbi).at(contractAddress)
		promisifyAll(contract)
	}

	async generateTree() {
		const result = await contract.generateTreeAsync({
			from: web3.eth.accounts[0]
		})
		return result
	}

	async getTreeDetails(id) {
		const result = await contract.treeDetailsAsync(id, {
			from: web3.eth.accounts[0]
		})
		return result
	}

	async getTreeIds() {
		const result = await contract.getTreeIdsAsync(web3.eth.accounts[0], {
			from: web3.eth.accounts[0]
		})
		return result
	}

	async putTreeOnSale(id, price) {
		const result = await contract.putTreeOnSaleAsync(id, price, {
			from: web3.eth.accounts[0]
		})
		return result
	}

	async buyTree(id, originalOwner, price) {
		const result = await contract.buyTreeAsync(id, originalOwner, {
			from: web3.eth.accounts[0],
			value: price
		})
		return result
	}

	async getTreesOnSale() {
		const result = await contract.getTreesOnSaleAsync({
			from: web3.eth.accounts[0]
		})
		return result
	}

	async cancelTreeSell(id) {
		const result = await contract.cancelTreeSellAsync(id, {
			from: web3.eth.accounts[0]
		})
		return result
	}

	async checkRewardsMyTrees(ids) {
		let result = await contract.checkRewardsAsync(ids, {
			from: web3.eth.accounts[0]
		})
		result = result.map(element => parseFloat(element))
		return result
	}

	async pickReward(id) {
		const result = await contract.pickRewardAsync(id, {
			from: web3.eth.accounts[0]
		})
		return result
	}

	async checkTreesWatered(ids) {
		const result = await contract.checkTreesWateredAsync(ids, {
			from: web3.eth.accounts[0]
		})
		return result
	}

	async waterTree(id) {
		const result = await contract.waterTreeAsync(id, {
			from: web3.eth.accounts[0]
		})
		return result
	}

	redirectTo(history, location) {
		history.push(location)
	}

	render () {
		return (
			<BrowserRouter>
				<Switch>
					<Route path="/" exact render={(context) => (
						<MyTrees
							history={context.history}
							redirectTo={(history, location) => this.redirectTo(history, location)}
							getTreeIds={() => this.getTreeIds()}
							getTreeDetails={id => this.getTreeDetails(id)}
							sellTree={(id, price) => this.putTreeOnSale(id, price)}
							cancelSell={id => this.cancelTreeSell(id)}
							checkRewardsMyTrees={ids => this.checkRewardsMyTrees(ids)}
							checkTreesWatered={ids => this.checkTreesWatered(ids)}
							pickReward={id => this.pickReward(id)}
							waterTree={id => this.waterTree(id)}
						/>
					)} />
					<Route path="/market" render={(context) => (
						<Market
							history={context.history}
							redirectTo={(history, location) => this.redirectTo(history, location)}
							getTreesOnSale={() => this.getTreesOnSale()}
							getTreeIds={() => this.getTreeIds()}
							getTreeDetails={id => this.getTreeDetails(id)}
							buyTree={(id, owner, price) => this.buyTree(id, owner, price)}
						/>
					)} />
					<Route path="/not-connected-metamask" render={(context) => (
						<NotConnected
							history={context.history}
							redirectTo={(history, location) => this.redirectTo(history, location)}
						/>
					)} />
				</Switch>
			</BrowserRouter>
		)
	}
}

class MyTrees extends React.Component {
	constructor(props) {
		super(props)
		this.init()
		this.state = {
			allTrees: [],
			allTreesIds: [],
			allRewards: [],
			areTreesWatered: [],
			isCheckingRewards: false,
			treesLoaded: false,
		}

		if(web3.eth.accounts[0] === undefined) this.props.redirectTo(this.props.history, '/not-connected-metamask')
	}

	async init() {
		let allTrees = []
		let ids = await this.props.getTreeIds()
		ids = ids.map(element => parseFloat(element))
		for(let i = 0; i < ids.length; i++) {
			let details = await this.props.getTreeDetails(ids[i])
			if(details[1] === "0x0000000000000000000000000000000000000000") continue
			details = details.map(element => {
				if(typeof element === 'object') return parseFloat(element)
				else return element
			})
			allTrees.push(details)
		}
		const allTreesIds = allTrees.map(tree => tree[0])
		const allRewards = await this.props.checkRewardsMyTrees(allTreesIds)
		const areTreesWatered = await this.props.checkTreesWatered(allTreesIds)
		// Note the ( bracket instead of curly bracket {
		allTrees = allTrees.map((detail, index) => (
			<TreeBox
				id={detail[0]}
				daysPassed={Math.floor((Math.floor(Date.now() / 1000) - detail[2]) / 86400)} // How many days passed after the creation of this tree
				treePower={detail[3]}
				onSale={detail[6]}
				sellTree={(id, price) => this.props.sellTree(id, price)}
				key={detail[0]}
				waterTree={id => this.props.waterTree(id)}
				cancelSell={id => this.props.cancelSell(id)}
				pickReward={id => this.props.pickReward(id)}
				reward={allRewards[index]}
				isWatered={areTreesWatered[index]}
			/>
		))
		this.setState({allTrees, allTreesIds, allRewards, areTreesWatered, treesLoaded: true})
	}

	updateRewards() {
		allTrees = allTrees.map((detail, index) => (
			<TreeBox
				id={detail[0]}
				daysPassed={detail[2]}
				treePower={detail[3]}
				onSale={detail[6]}
				sellTree={(id, price) => this.props.sellTree(id, price)}
				key={detail[0]}
				cancelSell={id => this.props.cancelSell(id)}
				pickReward={id => this.props.pickReward(id)}
				reward={this.state.allRewards[index]}
			/>
		))
		this.setState({allTrees})
	}

	render() {
		return (
			<div>
				<NavBar />
				<div className="container">
					<div className={this.state.treesLoaded ? "row" : "hidden"}>
						<button className="check-rewards-button" onClick={async () => {
							this.setState({isCheckingRewards: true})
							const rewards = await this.props.checkRewardsMyTrees(this.state.allTreesIds)
							this.setState({isCheckingRewards: false, allRewards: rewards})
						}}>{this.state.isCheckingRewards ? 'Loading...' : 'Check Rewards'}</button>
					</div>
					<div className="row">
						{this.state.treesLoaded ? this.state.allTrees : <Loading />}
					</div>
				</div>
				<div className="spacer"></div>
			</div>
		)
	}
}

class Market extends React.Component {
	constructor(props) {
		super(props)
		this.init()
		this.state = {
			allTrees: [],
			treesLoaded: false,
		}

		if(web3.eth.accounts[0] === undefined) this.props.redirectTo(this.props.history, '/not-connected-metamask')
	}

	async init() {
		// Get all the trees on sale except yours
		let treesOnSale = await this.props.getTreesOnSale()
		let myTrees = await this.props.getTreeIds()
		treesOnSale = treesOnSale.map(element => parseFloat(element))
		myTrees = myTrees.map(element => parseFloat(element))
		let treesToShow = treesOnSale.slice(0) // Create a copy

		// Remove your trees
		for(let i = 0; i < myTrees.length; i++) {
			for(let a = 0; a < treesOnSale.length; a++) {
				if(myTrees[i] === treesOnSale[a]) {
					treesToShow.splice(a, 1)
				}
			}
		}

		// If there's at least one tree on sale not yours, get them details and show em
		if(treesToShow.length > 0) {
			let allTrees = []
			for(let i = 0; i < treesToShow.length; i++) {
				let details = await this.props.getTreeDetails(treesToShow[i])

				// Remove the 0x trees
				if(details[1] === '0x0000000000000000000000000000000000000000') continue
				details = details.map(element => {
					if(typeof element === 'object') return parseFloat(element)
					else return element
				})
				allTrees.push(details)
			}
			// Note the ( bracket instead of curly bracket {
			allTrees = allTrees.map(detail => (
				<TreeMarketBox
					id={detail[0]}
					owner={detail[1]}
					daysPassed={Math.floor((Math.floor(Date.now() / 1000) - detail[2]) / 86400)} // How many days passed after the creation of this tree
					treePower={detail[3]}
					buyTree={(id, owner, price) => this.props.buyTree(id, owner, detail[4])}
					price={web3.fromWei(detail[4], 'ether')}
					key={detail[0]}
				/>
			))
			this.setState({allTrees, treesLoaded: true})
		}
	}

	render() {
		return (
			<div>
				<NavBar inMarket="true" />
				<div className="container">
					<div className={this.state.treesLoaded ? "row" : "hidden"}>
						<div className="top-spacer"></div>
						{this.state.allTrees}
					</div>
					<div className={this.state.treesLoaded ? "hidden" : "row"}><Loading /></div>
				</div>
				<div className="spacer"></div>
			</div>
		)
	}
}

class NavBar extends React.Component {
	render() {
		return (
			<nav className="navbar navbar-expand-lg navbar-light">
				<a className="navbar-brand" href="#">
					<img src="forest.svg" width="30" height="30" className="d-inline-block align-top" alt="" />&nbsp;
					Crypto Trees
				</a>
				<button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">
					<span className="navbar-toggler-icon"></span>
				</button>
				<div className="collapse navbar-collapse" id="navbarText">
					<ul className="navbar-nav ml-auto">
						<li className={this.props.inMarket ? "nav-item" : "nav-item active"}>
							<Link to="/" className="nav-link">My Trees</Link>
						</li>
						<li className={this.props.inMarket ? "nav-item active" : "nav-item"}>
							<Link to="/market" className="nav-link">Market</Link>
						</li>
					</ul>
				</div>
			</nav>
		)
	}
}

class TreeBox extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			showSellConfirmation1: false,
			showSellConfirmation2: false,
			showCancelSell: false,
			rewardClicked: false,
			waterClicked: false,
		}
	}

	render() {
		return (
			<div className="col-6 col-sm-4 tree-container">
				<img src="imgs/tree.png" className="tree-image"/>
				<h4>Id {this.props.id}</h4>
				<p>Tree power <span className="color-green">{this.props.treePower}</span></p>
				<p><span className="color-blue">{this.props.daysPassed}</span> days passed after creation</p>
				<p>On sale <span className="color-red">{this.props.onSale.toString()}</span></p>
				<button className="wide-button" disabled={(this.props.reward === 0 || this.state.rewardClicked)} onClick={async () => {
					try {
						await this.props.pickReward(this.props.id)
						this.setState({rewardClicked: true})
					} catch (e) {}
				}}>{this.props.reward > 0 ? `Pick ${this.props.reward} Reward` : 'Reward Not Available'}</button>
				<button className="wide-button" disabled={(this.props.isWatered || this.state.waterClicked)} onClick={async () => {
					try {
						await this.props.waterTree(this.props.id)
						this.setState({waterClicked: true})
					} catch (e) {}
				}}>{this.props.isWatered ? 'Tree Was Watered Today' : 'Water Tree Now'}</button>
				<button className={this.props.onSale ? 'hidden' : "full-button"} onClick={() => {
					this.setState({showSellConfirmation1: !this.state.showSellConfirmation1})
					this.setState({showSellConfirmation2: false})
				}}>{this.state.showSellConfirmation1 ? 'Cancel' : 'Put Tree On Sale'}</button>

				<button className={this.props.onSale ? "full-button" : 'hidden'} onClick={() => {
					this.setState({showCancelSell: !this.state.showCancelSell})
				}}>{this.state.showCancelSell ? 'Are you sure?' : 'Cancel active sell'}</button>

				<div className={this.state.showSellConfirmation1 ? "full-button" : "hidden"}>
					<p>At what price do you want to sell your tree in ETH?</p>
					<input key={this.props.id} ref="amount-to-sell" className="wide-button" type="number" defaultValue="0.5"/>
					<button className="wide-button" onClick={() => {
						this.setState({showSellConfirmation2: true})
					}}>Put Tree On Sale</button>
				</div>

				<div className={this.state.showSellConfirmation2 ? "full-button" : "hidden"}>
					<p>Are you sure you want to put on sale this tree for {this.refs['amount-to-sell'] ? this.refs['amount-to-sell'].value : ''} ETH now? {this.refs['amount-to-sell'] ? (this.refs['amount-to-sell'].value * 0.1).toFixed(2) : ''} ETH will go to the treasury after the sale, you'll get {this.refs['amount-to-sell'] ? (this.refs['amount-to-sell'].value * 0.9).toFixed(2) : ''} ETH.</p>
						<button className="wide-button" onClick={() => {
							this.setState({showSellConfirmation2: false})
							this.setState({showSellConfirmation1: false})
							this.props.sellTree(this.props.id, web3.toWei(this.refs['amount-to-sell'].value, 'ether'))
						}}>Yes</button>
						<button className="wide-button" onClick={() => {
							this.setState({showSellConfirmation2: false})
							this.setState({showSellConfirmation1: false})
						}}>No</button>
					</div>

						<div className={this.state.showCancelSell ? 'full-button' : 'hidden'}>
							<button className="wide-button" onClick={async () => {
								try {
									await this.props.cancelSell(this.props.id)
									this.setState({showCancelSell: false})
								} catch(e) {}
							}}>
								Yes, cancel sell
							</button>
							<button className="wide-button" onClick={() => {
								this.setState({showCancelSell: false})
							}}>
								No, keep tree on the market for sale
							</button>
						</div>
					</div>
		)
	}
}

class TreeMarketBox extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			buyClicked: false
		}
	}
	render() {
		return (
			<div className="col-6 col-sm-4 tree-container">
				<img src="imgs/tree.png" className="tree-image"/>
				<h4>Id {this.props.id}</h4>
				<p className="word-wrap">Owner <span className="color-yellow">{this.props.owner}</span></p>
				<p>Tree power <span className="color-green">{this.props.treePower}</span></p>
				<p><span className="color-blue">{this.props.daysPassed}</span> days passed after creation</p>
				<button className="full-button" disabled={this.state.buyClicked} onClick={async () => {
					try {
						await this.props.buyTree(this.props.id, this.props.owner, this.props.price)
						this.setState({buyClicked: true})
					} catch(e) {}
				}}>Buy Tree</button>
			</div>
		)
	}
}

class Loading extends React.Component {
	render () {
		return (
			<div className="container">
				<div className="row">
					<h5 className="margin-auto">Loading data from the blockchain...</h5>
				</div>
			</div>
		)
	}
}

class NotConnected extends React.Component {
	constructor(props) {
		super(props)
		if(web3.eth.accounts[0] !== undefined) this.props.redirectTo(this.props.history, '/')
	}

	render() {
		return (
			<div>
				<NavBar />
				<div className="container">
					<div className="row">
						<h4>You have to be connected to metamask to use this application</h4>
						<p>Please connect to the mainnet on metamask with your account and reload the page</p>
					</div>
				</div>
				<div className="spacer"></div>
			</div>
		)
	}
}

render(
	<App/>,
	document.querySelector('#root')
)
