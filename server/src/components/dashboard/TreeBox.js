import React, { Component } from 'react'

export default class TreeBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      image: this.getImageAirProduction(this.props.airProduction),
      showDetails: false
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
          href={`https://ropsten.etherscan.io/token/${window.treeContract.address}?a=${
            this.props.id
            }`}
          target="_blank"
        >
          <h4>Tree Id: {this.props.id}</h4>
        </a>

        <p>
          Air Production{" "}
          <span className="color-green">{this.props.airProduction}</span>
        </p>
        <p>
          Pending Rewards{" "}
          <span className="color-yellow">{this.props.rewards}</span>
        </p>
        <button onClick={() => this.props.showDetails(this.props.id)}>
          More Info
        </button>

      </div>
    );
  }
}