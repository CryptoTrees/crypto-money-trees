import React, { Component } from 'react'

export default class TreeMarketBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            buyClicked: false,
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
        } else if (airProduction < 75) {
            return 'imgs/4.jpg'
        } else if (airProduction < 100) {
            return 'imgs/5.jpg'
        } else {
            return "imgs/tree-big.jpg"
        }
        // return "imgs/tree-big.jpg"; // TODO Change this to the evolving images
    }

    render() {
        return (
            <div className="col-6 col-sm-4 tree-container">
                <img src={this.state.image} className="tree-image" />
                <a
                    href={`https://ropsten.etherscan.io/token/${treeContract.address}?a=${
                        this.props.id
                        }`}
                    target="_blank"
                >
                    <h4>Id {this.props.id}</h4>
                </a>
                <p className="word-wrap">
                    Owner{" "}
                    <span className="color-yellow">
                        {this.props.owner === contract.address
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
