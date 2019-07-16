import React, { Component } from 'react'

export default class Information extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="container">
                <div className="row">
                    <h5 className="margin-auto-and-top">{this.props.message}</h5>
                </div>
                <div className="row">
                    <p
                        className={
                            this.props.subTitle === undefined ? "hidden" : "margin-auto"
                        }
                    >
                        {this.props.subTitle}
                    </p>
                </div>
            </div>
        );
    }
}