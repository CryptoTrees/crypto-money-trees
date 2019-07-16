import React, { Component } from 'react'
import { Link } from "react-router-dom"

export default class NavBar extends Component {

    render() {
        return (
            <nav className="navbar navbar-expand-lg navbar-light">
                <Link className="navbar-brand" to="/">
                    <img
                        src="imgs/forest.svg"
                        width="30"
                        height="30"
                        className="d-inline-block align-top"
                        alt=""
                    />
                    &nbsp; Crypto Trees
                </Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-toggle="collapse"
                    data-target="#navbarText"
                    aria-controls="navbarText"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon" />
                </button>
                <div className="collapse navbar-collapse" id="navbarText">
                    <ul className="navbar-nav ml-auto">
                        <li
                            className="nav-item"
                        >
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`https://ropsten.etherscan.io/address/${""}`} className="nav-link"
                            >
                                {""}
                            </a>
                        </li>
                        <li
                            className={this.props.inMyTrees ? "nav-item active" : "nav-item"}
                        >
                            <Link to="/my-trees" className="nav-link">
                                My Trees
                            </Link>
                        </li>
                        <li
                            className={this.props.inMarket ? "nav-item active" : "nav-item"}
                        >
                            <Link to="/market" className="nav-link">
                                Market
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>
        );
    }
}
