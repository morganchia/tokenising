import React, { Component } from "react";
import { Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";


export default class Settings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      redirect: null,
      userReady: false,
      currentUser: { username: "" },
      _useropsroles : {
        campaign_makers: "",
        campaign_checkers: "",
        campaign_approvers: "",
        mint_makers : "",
        mint_checkers : "",
        mint_approvers : "",
        transfer_makers : "",
        transfer_checkers : "",
        transfer_approvers : "",
        withdraw_makers : "",
        withdraw_checkers : "",
        withdraw_approvers : "",
        recipient_makers : "",
        recipient_checkers : "",
        recipient_approvers : "",
      }
    };
  }

  retrieveAllUserOpsRole() {
    UserOpsRoleDataService.findAll()
      .then(response => {
        console.log("Data received by UserOpsRoleDataService.getAllMakersCheckersApprovers:", response.data);
        
        const campaign_makers = response.data.filter(role => {return role.transactionType.toUpperCase() === "CAMPAIGN" && role.opsroleId === 1});
        const campaign_checkers = response.data.filter(role => {return role.transactionType.toUpperCase() === "CAMPAIGN" && role.opsroleId === 2});
        const campaign_approvers = response.data.filter(role => {return role.transactionType.toUpperCase() === "CAMPAIGN" && role.opsroleId === 3});
        const mint_makers = response.data.filter(role => {return role.transactionType.toUpperCase() === "MINT" && role.opsroleId === 1});
        const mint_checkers = response.data.filter(role => {return role.transactionType.toUpperCase() === "MINT" && role.opsroleId === 2});
        const mint_approvers = response.data.filter(role => {return role.transactionType.toUpperCase() === "MINT" && role.opsroleId === 3});
        const transfer_makers = response.data.filter(role => {return role.transactionType.toUpperCase() === "TRANSFER" && role.opsroleId === 1});
        const transfer_checkers = response.data.filter(role => {return role.transactionType.toUpperCase() === "TRANSFER" && role.opsroleId === 2});
        const transfer_approvers = response.data.filter(role => {return role.transactionType.toUpperCase() === "TRANSFER" && role.opsroleId === 3});
        const withdraw_makers = response.data.filter(role => {return role.transactionType.toUpperCase() === "WITHDRAW" && role.opsroleId === 1});
        const withdraw_checkers = response.data.filter(role => {return role.transactionType.toUpperCase() === "WITHDRAW" && role.opsroleId === 2});
        const withdraw_approvers = response.data.filter(role => {return role.transactionType.toUpperCase() === "WITHDRAW" && role.opsroleId === 3});
        const recipient_makers = response.data.filter(role => {return role.transactionType.toUpperCase() === "RECIPIENT" && role.opsroleId === 1});
        const recipient_checkers = response.data.filter(role => {return role.transactionType.toUpperCase() === "RECIPIENT" && role.opsroleId === 2});
        const recipient_approvers = response.data.filter(role => {return role.transactionType.toUpperCase() === "RECIPIENT" && role.opsroleId === 3});
        console.log("campaign_makers:", campaign_makers);
        
        this.setState({
          user_opsroles       : response.data,
          _useropsroles : {
            campaign_makers     : campaign_makers,
            campaign_checkers   : campaign_checkers,
            campaign_approvers  : campaign_approvers,
            mint_makers         : mint_makers,
            mint_checkers       : mint_checkers,
            mint_approvers      : mint_approvers,
            transfer_makers     : transfer_makers,
            transfer_checkers   : transfer_checkers,
            transfer_approvers  : transfer_approvers,
            withdraw_makers     : withdraw_makers,
            withdraw_checkers   : withdraw_checkers,
            withdraw_approvers  : withdraw_approvers,
            recipient_makers     : recipient_makers,
            recipient_checkers   : recipient_checkers,
            recipient_approvers  : recipient_approvers,
          }
        });
      }
    )
    .catch(e => {
      console.log(e);
      //return(null);
    });  
  }

  componentDidMount() {
    const currentUser = AuthService.getCurrentUser();

    if (!currentUser) this.setState({ redirect: "/login" });
    this.setState({ currentUser: currentUser, userReady: true })

    this.retrieveAllUserOpsRole();
  }

  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { currentUser, user_opsroles, _useropsroles } = this.state;

    return (
      <div className="container">
        {(this.state.userReady) ?
        <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>User Roles</strong>
            </h3>
          </header>
        </div>: null}

        <div className="list row">
            <div className="col-md-8">
            </div>
            <div className="col-md-8">

              <table style={{ border:"1px solid", tableLayout: "fixed", width:"100%"}}>
                {(_useropsroles)?
                  <tr>
                    <th>Transactions</th>
                    <th>Makers</th>
                    <th>Checkers</th>
                    <th>Approvers</th>
                  </tr>
                : null
                }

                {(typeof(_useropsroles.campaign_makers)!=="undefined" && _useropsroles.campaign_makers)?
                  <tr>
                    <td>Campaign</td>
                    <td valign="top">{_useropsroles.campaign_makers.map(persons=><p>{persons.user.username}</p>)}</td>
                    <td valign="top">{_useropsroles.campaign_checkers.map(persons=><p>{persons.user.username}</p>)}</td>
                    <td valign="top">{_useropsroles.campaign_approvers.map(persons=><p>{persons.user.username}</p>)}</td>
                  </tr>
                : null}
                {(typeof(_useropsroles.mint_makers)!=="undefined" && _useropsroles.mint_makers)?
                  <tr>
                    <td>Mint</td>
                    <td valign="top">{_useropsroles.mint_makers.map(persons=><p>{persons.user.username}</p>)}</td>
                    <td valign="top">{_useropsroles.mint_checkers.map(persons=><p>{persons.user.username}</p>)}</td>
                    <td valign="top">{_useropsroles.mint_approvers.map(persons=><p>{persons.user.username}</p>)}</td>
                  </tr>
                : null}
                {(typeof(_useropsroles.transfer_makers)!=="undefined" && _useropsroles.transfer_makers)?
                  <tr>
                    <td>Transfer</td>
                    <td valign="top">{_useropsroles.transfer_makers.map(persons=><p>{persons.user.username}</p>)}</td>
                    <td valign="top">{_useropsroles.transfer_checkers.map(persons=><p>{persons.user.username}</p>)}</td>
                    <td valign="top">{_useropsroles.transfer_approvers.map(persons=><p>{persons.user.username}</p>)}</td>
                  </tr>
                : null}
                {(typeof(_useropsroles.withdraw_makers)!=="undefined" && _useropsroles.withdraw_makers)?
                  <tr>
                    <td>Withdraw</td>
                    <td valign="top">{_useropsroles.withdraw_makers.map(persons=><p>{persons.user.username}</p>)}</td>
                    <td valign="top">{_useropsroles.withdraw_checkers.map(persons=><p>{persons.user.username}</p>)}</td>
                    <td valign="top">{_useropsroles.withdraw_approvers.map(persons=><p>{persons.user.username}</p>)}</td>
                  </tr>
                : null}
                {(typeof(_useropsroles.recipient_makers)!=="undefined" && _useropsroles.recipient_makers)?
                  <tr>
                    <td>Recipients Maintenance</td>
                    <td valign="top">{_useropsroles.recipient_makers.map(persons=><p>{persons.user.username}</p>)}</td>
                    <td valign="top">{_useropsroles.recipient_checkers.map(persons=><p>{persons.user.username}</p>)}</td>
                    <td valign="top">{_useropsroles.recipient_approvers.map(persons=><p>{persons.user.username}</p>)}</td>
                  </tr>
                : null}


              </table>

              {
                /*
              this.state.isMaker? 
                <Link
                  to={"/campaignadd/"}
                >
                  <button
                    className="m-3 btn btn-sm btn-primary"
                  >
                    Add
                  </button>
                </Link>
              : null
              */
              }
              { 
              /*
              this.state.isMaker && (campaigns.length > 0) ? 
                <button className="m-3 btn btn-sm btn-danger" onClick={this.showModal}>
                  Remove All
                </button>
              : null 
             
              <Modal showm={this.state.showm} handleProceed1={this.removeAllCampaigns} handleCancel={this.hideModal} handleProceed2={null} button1text={this.state.button1text} button2text={this.state.button2text} button0text={this.state.button0text}>
                {this.state.modalmsg}
              </Modal>

              */}
            </div>
          </div>
      </div>
    );
  }
}
