import React, { Component } from 'react'

let treeNames = ['Maple', 'Oak', 'Pine', 'Spruce']

export default class TreeTypeBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      image: this.getImageAirProduction(),
      amountToBuy: 1,
      buyClicked: false,
    };
  }

  getImageAirProduction() {
    return `imgs/tree ${this.props.type + 1}.svg`
  }

  render() {
    return (
      <div className="col-6 col-sm-4 tree-container">
        <p className="details-big">
            {treeNames[this.props.type]} Tree
        </p>
        <img src={this.state.image} className="tree-image" />
        
        <div className="text-center">
          <button
            className="bulk"
            disabled={this.state.buyClicked}
            onClick={async () => {
                try {
                    const result = await this.props.buyMultipleTrees(
                      this.props.type,
                      this.state.amountToBuy
                    );
                    this.setState({ buyClicked: true });
                } catch (e) {console.log(e)}
            }}
          >
              Buy {this.state.amountToBuy} {this.state.amountToBuy>1?"Trees":"Tree"}  for ({this.props.price * this.state.amountToBuy} AIR)
          </button>
          <input className="bulk"
            value={this.state.amountToBuy}
            onChange={(e) => this.setState({amountToBuy:e.target.value})}
          >
          </input>  
        </div>  
        

      </div>
    );
  }
}