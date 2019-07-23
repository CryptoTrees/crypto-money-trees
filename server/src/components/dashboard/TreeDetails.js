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
            <div>
                <button
                    className="check-rewards-button"
                    onClick={() => this.props.goBack()}
                >
                    Back
                </button>
                <div className="col-6 col-sm-4 tree-container">
                    <img src={this.state.image} className="tree-image" />
                    <a
                        href={`https://ropsten.etherscan.io/token/${window.treeContract.address}?a=${
                            this.props.id
                            }`}
                        target="_blank"
                    >
                        <h4>Tree Id: {this.props.id}</h4>
                    </a>
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
                        <span className="color-yellow">{web3.utils.fromWei(String(this.props.salePrice))} AIR </span>
                    </p>
                    <p>
                        Picked Last Reward {" "}
                        <span className="color-green">{this.props.lastRewardPickedDate === 0 ? "Never" : (new Date(this.props.lastRewardPickedDate * 1000)).toUTCString()}</span>
                    </p>
                    <p>
                        You have helped the environment by cleaning{" "}
                        <span className="color-blue">{this.props.rewards} tons of CO2</span>
                    </p>
                    <button
                        className="full-button"
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
                            ? `Pick ${this.props.rewards} AIR Reward Tokens`
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
                <h2 className="text-center">Owner History</h2>
                <table className="table table-striped table-light text-center" style={{ overflowX: 'auto', fontSize: '11px' }}>
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Previous</th>
                            <th scope="col">New</th>
                            <th scope="col">Transaction</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.transferHistory.map((e, k) => {
                            return (
                                <tr key={k}>
                                    <td>{k + 1}</td>
                                    <td>{e.returnValues.from === "0x0000000000000000000000000000000000000000"
                                        ? "Creator" : e.returnValues.from}</td>
                                    <td>{e.returnValues.to == web3.utils.toChecksumAddress(this.props.currentAccount)
                                        ? "You" : e.returnValues.to}
                                    </td>
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
        )
    }
}

