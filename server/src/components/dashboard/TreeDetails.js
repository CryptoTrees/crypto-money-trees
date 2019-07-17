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
                Math.floor(Date.now() / 1000) - 1517245959 > 60 * 60 * 24, // If a day has passed since the last reward picked or not
            amountToSell: 1,
            image: this.getImageAirProduction(this.props.airProduction),
            transferHistory: []
        };


    }

    getImageAirProduction(airProduction) {
        if (airProduction < 10) {
            return 'imgs/1.jpg'
        } else if (airProduction < 25) {
            return 'imgs/2.jpg'
        } else if (airProduction < 50) {
            return 'imgs/3.jpg'
        } else if (airProduction < 100) {
            return 'imgs/4.jpg'
        } else {
            return 'imgs/5.jpg'
        }
        // return "imgs/tree-big.jpg"; // TODO Change this to the evolving images
    }

    componentDidMount() {
        this.getPastEvents();
    }

    getPastEvents() {
        treeContract
            .getPastEvents("Transfer", {
                fromBlock: 5995750,
                toBlock: "latest"
            })
            .then(events => {
                let transferHistory = events.filter(e => e.returnValues.tokenId.toString() === String(this.props.id))
                this.setState({ transferHistory })
            });
    }

    render() {
        return (
            <div>
                <div className="col-6 col-lg-4 tree-container">
                    <img src={this.state.image} className="tree-image" />
                    <p>
                        <span className="color-blue">{this.props.daysPassed}</span> days
                        passed after creation
                </p>
                    <p>
                        On sale{" "}
                        <span className="color-red">{this.props.onSale.toString()}</span>
                    </p>
                    <p>
                        Sale Price{" "}
                        <span className="color-yellow">{web3.utils.fromWei(String(this.props.salePrice))} AIR tokens</span>
                    </p>
                    <p>
                        Picked Last Reward {" "}
                        <span className="color-green">{String(new Date(this.props.lastRewardPickedDate))}</span>
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
                <br></br>
                <h2 className="text-center">Transfer History</h2>
                <table className="table table-striped table-light text-center" style={{ overflowX: 'auto', fontSize: '11px' }}>
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">From</th>
                            <th scope="col">To</th>
                            <th scope="col">TxId</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.transferHistory.map((e, k) => {
                            return (
                                <tr key={k}>
                                    <td>{k}</td>
                                    <td>{e.returnValues.from}</td>
                                    <td>{e.returnValues.to}
                                    </td>
                                    <td>{e.transactionHash}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )
    }
}

