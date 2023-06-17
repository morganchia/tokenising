import React, { Component } from "react";
import { Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import {ExportToExcel} from './Export2Excel'


export default class Settings extends Component {
  constructor(props) {
    super(props);

    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);

    this.state = {
      startdate: "",
      enddate: "",
      excelfilename: "tokenise_file",
    };
  }

  onChangeStartDate(e) {
    this.setState({
      startdate: e.target.value,
      datachanged: true
    });
  }

  onChangeEndDate(e) {
    this.setState({
      enddate: e.target.value,
      datachanged: true
    });
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

    const { currentUser, user_opsroles, _useropsroles, data1, excelfilename } = this.state;

    return (
      <div className="container">
        {(this.state.userReady) ?
        <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>Audit Trail</strong>
            </h3>
          </header>
        </div>: null}
        <h4>
          <br/>
          Export Report
          <br/>
          <br/>
        </h4>
        <div className="col-md-8">
          <div className="form-group">
            <label htmlFor="startdate">Start Date *</label>
            <input
              type="date"
              className="form-control"
              id="startdate"
              required
              //defaultValue={new Date().toISOString().split("T")[0]}
              onChange={this.onChangeStartDate}
              name="startdate"
            />
          </div>

          <div className="form-group">
            <label htmlFor="enddate">End Date *</label>
            <input
              type="date"
              className="form-control"
              id="enddate"
              required
              max={new Date().toISOString().split("T")[0]}
              //defaultValue={new Date().toISOString().split("T")[0]}
              onChange={this.onChangeEndDate}
              name="enddate"
            />
          </div>
        </div>

        <div className="App">
            <ExportToExcel startdate={this.state.startdate} enddate={this.state.enddate} excelfileName={excelfilename} />
        </div>

      </div>
    );
  }
}
