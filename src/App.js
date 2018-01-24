import React from 'react'
import { render } from 'react-dom'
import { BrowserRouter, Route, Link, Switch } from 'react-router-dom'
import Web3 from 'web3'
import { promisifyAll } from 'bluebird'
import { abi as contractAbi } from './../build/contracts/Trees.json'
import './index.styl'

console.log('Loaded app')

const contractAddress = '0x670e2dd4f6136dfd1ffc16c272d7207b28ee1b77'
const originalOwner = '0x7461CCF1FD55c069ce13E07D163C65c78c8b48D1'

class App extends React.Component {
	constructor () {
		super()
		window.web3 = new Web3(web3.currentProvider || new Web3.providers.HttpProvider('https://ropsten.infura.io/6GO3REaLghR6wPhNJQcc'))
		window.contract = web3.eth.contract(contractAbi).at(contractAddress)
		promisifyAll(contract)
		console.log('Loaded app 2')

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

	async putTreeOnSale() {
		const result = await contract.putTreeOnSaleAsync(1, {
			from: web3.eth.accounts[0]
		})
		return result
	}

	async buyTree() {
		const result = await contract.buyTreeAsync(1, originalOwner, {
			from: web3.eth.accounts[0]
		})
		return result
	}

	async getTreesOnSale() {
		const result = await contract.getTreesOnSaleAsync({
			from: web3.eth.accounts[0]
		})
		return result
	}

	render () {
		return (
			<BrowserRouter>
				<NavBar {...this.state}>
					<Switch>
						<Route path="/" render={() => (
							<MyTrees
								getTreeIds={() => this.getTreeIds()}
								getTreeDetails={() => this.getTreeDetails()}
							/>
						)} />
						<Route path="/market" render={() => (
							<Market
								getTreesOnSale={() => this.getTreesOnSale()}
								getTreeIds={() => this.getTreeIds()}
							/>
						)} />
					</Switch>
				</NavBar>
			</BrowserRouter>
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
							<a className="nav-link" href="#">My Trees</a>
						</li>
						<li className={this.props.inMarket ? "nav-item active" : "nav-item"}>
							<a className="nav-link" href="#">Market</a>
						</li>
					</ul>
				</div>
			</nav>
		)
	}
}

class TreeBox extends React.Component {
	render() {
		return (
			<div className="col-6 col-sm-4 tree-container">
				<img src="imgs/tree.png" className="tree-image"/>
				<h4>Id {this.props.id}</h4>
				<p>Tree power {this.props.treePower}</p>
				<p>{this.props.daysPassed} after planting</p>
				<p>Fruits not available</p>
				<p>On sale {this.props.onSale}</p>
				<button className="wide-button">Pick Fruits</button>
				<button className="wide-button">Water Tree</button>
			</div>
		)
	}
}

class TreeMarketBox extends React.Component {
	render() {
		return (
			<div className="col-6 col-sm-4 tree-container">
				<img src="imgs/tree.png" className="tree-image"/>
				<h4>Id {this.props.id}</h4>
				<p>Tree power {this.props.treePower}</p>
				<p>{this.props.daysPassed} after planting</p>
				<button className="full-button">Buy Tree</button>
			</div>
		)
	}
}

class MyTrees extends React.Component {
	constructor(props) {
		super()
		init()
		this.state = {
			allTrees: []
		}
		console.log('Trees called')
	}

	async init() {
		let allTrees = []
		let ids = await this.props.getTreeIds()
		ids = ids.map(element => parseFloat(element))
		for(let i = 0; i < ids.length; i++) {
			let details = await this.props.getTreeDetails(ids[0])
			details = details.map(element => {
				if(typeof element === 'object') return parseFloat(element)
				else return element
			})
			allTrees.push(details)
		}
		// Note the ( bracket instead of curly bracket {
		allTrees = allTrees.map(detail => (
			<TreeBox id={detail[0]} daysPassed={detail[2]} treePower={detail[3]} onSale={detail[4]}/>
		))
		this.setState({allTrees})
	}

	render() {
		return (
			<div>
				{this.state.allTrees}
			</div>
		)
	}
}

class Market extends React.Component {
	constructor(props) {
		super()
		init()
		this.state = {
			allTrees: []
		}
		console.log('Market called')
	}

	async init() {
		// Get all the trees on sale except yours
		// get those details
		let treesOnSale = await this.props.getTreesOnSale()
		let myTrees = await this.props.getTreeIds()
		treesOnSale = treesOnSale.map(element => parseFloat(element))
		console.log('treesOnSale', treesOnSale)
		console.log('myTrees', myTrees)
	}

	render() {
		return (
			<div className="col-6 col-sm-4 tree-container">
				{this.state.allTrees}
			</div>
		)
	}
}

render(
	<App/>,
	document.querySelector('#root')
)
