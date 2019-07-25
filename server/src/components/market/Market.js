import React, { Component } from 'react'
import Information from '../Information'
import NavBar from '../NavBar'
import TreeMarketBox from './TreeMarketBox'
import TreeTypeBox from './TreeTypeBox'

export default class Market extends Component {
	constructor(props) {
		super(props);
		this.state = {
			allTrees: [],
			treesLoaded: false,
			treePrices:[]
		};

		//if (!this.props.isEthereumDefined) this.props.redirectTo(this.props.history, "/login")
	}

	componentDidMount() {
		if (this.props.isWeb3Defined && !this.state.treesLoaded) this.init();
	}

	componentDidUpdate() {
		if (this.props.isWeb3Defined && !this.state.treesLoaded) this.init();
	}

	async init() {
		// await this.props.setup();
		// if (!this.props.currentAccount) this.props.redirectTo(this.props.history, "/login")
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

			for (let i = 0; i < treesToShow.length; i++) {
				let details = await this.props.getTreeDetails(treesToShow[i]);
				details[2] = airProductions[i];

				// Remove the 0x trees
				if (details[1] === "0x0000000000000000000000000000000000000000")
					continue;
				for (let j = 0; j < 9; j++) {
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
			
			//Get tree prices for all 4 types
			let treePrices =[];
			for (let i = 0; i < 4; i++) {
				treePrices.push(await this.props.getTreePrice(i));
			}
			this.setState({ allTrees, treesLoaded: true, treePrices });
		}
	}

	renderBulkSells() {
		let treeTypes = this.state.treePrices;

		treeTypes = treeTypes.map((price, key) => (
			<TreeTypeBox
				buyMultipleTrees={this.props.buyMultipleTrees}
				price={price}
				key={key}
				type={key}
			/>
		))
		// console.log('prices',treeTypes);
		return treeTypes;
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
				<div className="spacer-7" />
					<h1 hidden={!this.state.treesLoaded}>BUY IN BULK</h1>
					<div className={this.state.treesLoaded ? "row" : "hidden"}>	
						{this.renderBulkSells()}
					</div>
					<div className="spacer-7" />
					<h1 hidden={!this.state.treesLoaded}>MARKET</h1>
					<div className={this.state.treesLoaded ? "row" : "hidden"}>						
						{this.state.allTrees}
					</div>
					<div className={this.state.treesLoaded ? "hidden" : "row"}>
						{loading}
					</div>
				</div>
			</div>
		);

		return (
			<div>
				<NavBar inMarket="true" currentAccount={this.props.currentAccount} />
				{this.state.treesLoaded && this.state.allTrees.length === 0
					? noTrees
					: main}
			</div>
		);
	}
}