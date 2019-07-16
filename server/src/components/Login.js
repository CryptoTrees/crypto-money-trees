import React, { Component } from 'react'
import Information from './Information'
import NavBar from './NavBar'
import firebase from 'firebase'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'

const firebaseConfig = {
    apiKey: "AIzaSyAsg_zSvo2eL_ZqkDUAj3FJCWljRdGzOpM",
    authDomain: "node-trees.firebaseapp.com",
    databaseURL: "https://node-trees.firebaseio.com",
    projectId: "node-trees",
    storageBucket: "",
    messagingSenderId: "701310308414",
    appId: "1:701310308414:web:b82064618f7e2748"
}
const uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: 'popup',
    // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
    signInSuccessUrl: '/market',
    // We will display Google and Facebook as auth providers.
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID
    ]
}
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default class Login extends Component {
    constructor() {
        super()
    }

    render() {
        return (
            <div>
                <NavBar />
                <div className="container">
                    <div className="row">
                        <Information
                            message="Metamask not detected"
                            subTitle="Create an account or connect to metamask to begin"
                        />
                    </div>
                    <div className="row justify-content-center">
                        <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
                    </div>
                </div>
            </div>
        )
    }
}
