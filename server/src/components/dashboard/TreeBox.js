import React, { Component } from 'react'

export default class TreeBox extends Component {
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