import React, { Component } from 'react'

export default class TreeDetails extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showSellConfirmation1: false,
            showSellConfirmation2: false,
            showCancelSell: false,
            rewardClicked: false,
            rewardAvailableToday:
                Math.floor(Date.now() / 1000) - this.props.lastRewardPickedDate > 60 * 60 * 24, // If a day has passed since the last reward picked or not
            amountToSell: 1,
            image: this.getImageAirProduction(this.props.airProduction),
            transferHistory: []
        };
    }

    getImageAirProduction() {
        const random = Math.floor(Math.random() * 6 + 1)
        return `imgs/tree ${random}.svg`
    }

    componentDidMount() {
        this.getPastEvents();
    }

    getPastEvents() {
        treeContract
            .getPastEvents("Transfer", {
                fromBlock: 6007354, //block of contract creation
                toBlock: "latest"
            })
            .then(events => {
                let transferHistory = events.filter(e => e.returnValues.tokenId.toString() === String(this.props.id))
                this.setState({ transferHistory })
            });
    }

    render() {
        return (
            <div className="text-center">
                <button                    
                    onClick={() => this.props.goBack()}
                >
                    Back to Dashboard
                </button>
                <div  >
                    <a
                        href={`https://ropsten.etherscan.io/token/${window.treeContract.address}?a=${
                            this.props.id
                            }`}
                        target="_blank"
                    >
                        <h4>Tree {this.props.id}</h4>
                    </a>
                    <img src={this.state.image} className="tree-image-details" />
                    
                    <p className="details-big" >
                        You have helped the environment by cleaning 28 tons of CO2
                    </p>
                    <p className="details-big">
                        You have generated 957 kg of clean oxygen for the planet
                    </p>
                    <p className="details-big">
                        You provided clean air for 7.4 people in a year
                    </p>
                    <p className="details-big">
                        You have have earned a total of {this.props.rewards} AIR tokens
                    </p>
                    <p className="details">
                       Planted {this.props.daysPassed} day(s) ago
                    </p>
                    <p className="details">
                        Last Reward Picked {this.props.lastRewardPickedDate === 0 ? "Never" : (new Date(this.props.lastRewardPickedDate * 1000)).toUTCString()}
                    </p>
                    <p className="details">                       
                        {this.props.onSale ? "On Sale":"Not On Sale"}
                    </p>                  
                   
                    <button
                        className="wide-button"
                        disabled={
                            this.props.rewards === 0 ||
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
                        {this.props.rewards > 0 && this.state.rewardAvailableToday
                            ? `Redeem ${this.props.rewards} AIR Reward Tokens`
                            : "Reward Available Tomorrow"}
                    </button>

                    <button
                        className={this.props.onSale ? "hidden" : "wide-button"}
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
                        className={this.props.onSale ? "wide-button" : "hidden"}
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
                    <div className="table-details">
                        <table className="table table-striped table-light" >
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Transactions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.transferHistory.map((e, k) => {
                                    return (
                                        <tr key={k}>
                                            <td>{k + 1}</td>
                                            
                                            <td>
                                                <a
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    href={`https://ropsten.etherscan.io/tx/${
                                                        e.transactionHash
                                                        }`}
                                                >
                                                    {e.transactionHash}
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>                  
                </div>
                
            </div>
        )
    }
}

