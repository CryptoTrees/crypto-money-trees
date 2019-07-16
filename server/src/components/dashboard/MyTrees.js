import React, { Component } from 'react'

import TreeBox from './TreeBox'
import Information from '../Information'
import NavBar from '../NavBar'
import { Link } from "react-router-dom"

export default class MyTrees extends Component {
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
        // if (!this.props.isEthereumDefined) this.props.redirectTo(this.props.history, "/login")
    }

    async init() {
        await this.props.setup();
        if (!window.currentAccount) this.props.redirectTo(this.props.history, "/login")
        else {
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
