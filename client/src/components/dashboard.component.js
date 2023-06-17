import React, { Component } from "react";
import { Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import Chart from './charts'

export default class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      redirect: null,
      userReady: false,
      currentUser: { username: "" }
    };
  }

  componentDidMount() {
    const currentUser = AuthService.getCurrentUser();

    if (!currentUser) this.setState({ redirect: "/login" });
    this.setState({ currentUser: currentUser, userReady: true })
  }

  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { currentUser } = this.state;

    return (
      <div className="container">
        {(this.state.userReady) ?
        <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong> Dashboard</strong>
            </h3>
          </header>
            <center>
              <Chart />
            </center>
        </div>: null}
      </div>
    );
  }
}
