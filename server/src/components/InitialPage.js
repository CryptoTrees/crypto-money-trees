import React from 'react'
import NavBar from './NavBar'
import { Link } from "react-router-dom"

export default function InitialPage(props) {
    return (
        <div>
            <NavBar />
            <div className="background-trees">
                <div className="container initial-top-container">
                    <div className="row">
                        <div className="spacer-30" />
                        <div className="col-12">
                            <h1 className="initial-title">Crypto Trees</h1>
                        </div>
                        <div className="top-spacer" />
                        <div className="col-12">
                            <p>
                                <i className="initial-subtitle">Simplifying tree planting with crypto rewards</i>
                            </p>
                        </div>
                        <div className="top-spacer" />
                        <div className="col-12">
                            <Link className="button-like no-margin" to={props.isWeb3Defined ? "/market" : "/login"}>
                                Start Planting
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container initial-half-container">
                <div className="spacer-20" />
                <div className="row">
                    <h2>Understanding Air Production</h2>
                    <p>
                        Everytime we plant a tree, it will start pr
                        the treasury where a percentage is distributed daily accross all
                        the tree owners. The more tree power your tree has, the bigger
                        portion of rewards you get.
                    </p>
                </div>
            </div>
        </div>
    );
}


