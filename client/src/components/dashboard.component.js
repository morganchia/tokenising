import React, { Component } from "react";
import AuthService from "../services/auth.service";
import Chart from './charts'
import DtscfDataService from "../services/dtscf.service.js";
import CampaignDataService from "../services/campaign.service";
import { Link, Navigate } from "react-router-dom";


export default class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.retrieveDtscf = this.retrieveDtscf.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveDtscf = this.setActiveDtscf.bind(this);

    this.state = {
      redirect: null,
      userReady: false,
      currentUser: { username: "" },
      dtscf: [],
      currentDtscf: null,
      campaigns: [],
      currentCampaign: null,
    };
  }

  async retrieveDtscf(Org_id) {
    //const id = this.state.currentUser.organisation_id;
    return await DtscfDataService.getTPbyOrgId(Org_id)
    .then(response => {
      this.setState({
        dtscf: response.data
      });
      console.log("Response data from retrieveDtscf() DtscfDataService.getTPbyOrgId:", response.data);
    })
    .catch(e => {
      console.log(e);
    });
  }

  async retrieveCampaigns(id) {
    return await CampaignDataService.getAllbyOrgId(id)
      .then(response => {
        this.setState({
          campaigns: response.data
        });
        console.log("Response data from retrieveCampaigns() CampaignDataService.getAll:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }
  
  refreshList() {
    if (this.state.currentUser.organisation_id !== undefined && this.state.currentUser.organisation_id !== null) {
      this.retrieveDtscf(this.state.currentUser.organisation_id);
      this.retrieveCampaigns(this.state.currentUser.organisation_id);
    }
    this.setState({
      currentDtscf: null,
      currentIndex: -1
    });
  }

  setActiveDtscf(dtscf, index) {
    this.setState({
      currentDtscf: dtscf,
      currentIndex: index
    });
  }

  async componentDidMount() {
    const currentUser = await AuthService.getCurrentUser();

    if (!currentUser) this.setState({ redirect: "/login" });
    this.setState({ currentUser: currentUser, userReady: true })

    if (currentUser.organisation_id !== undefined && currentUser.organisation_id !== null) {
      this.retrieveDtscf(currentUser.organisation_id);
      this.retrieveCampaigns(currentUser.organisation_id);
    }
  }

  shorten(s) {
    return(s.substring(0,6) + "..." + s.slice(-3));
  }

  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { searchName, dtscf, currentUser, campaigns } = this.state;

    return (
      <div className="container">
        {(this.state.userReady) ?
        <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong> Dashboard</strong>
            </h3>
          </header>
          { 
            (currentUser.roles === null || currentUser.roles[0] === "ROLE_USER" || currentUser.organisation_id === undefined || currentUser.organisation_id === null) && (
            <center>
              <Chart />
            </center>
            ) 
          }
          { (currentUser.roles !== null && currentUser.organisation_id !== undefined && currentUser.organisation_id !== null) && (
            <>
                    <div className="list row">
                      <div className="col-md-8">
                      {
                        // (dtscf.length > 0) ?
                        <div className="input-group mb-3">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name"
                            value={searchName}
                            onChange={this.onChangeSearchName}
                          />
                          <div className="input-group-append">
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={this.searchName}
                            >
                              Search
                            </button>
                          </div>
                        </div>
                        // : null
                      }
                      </div>
{/*  
//
//      TOKENISED PAYABLES TABLE
//
*/}

                      <div className="col-md-12">
                        <br />
                        <h4>Tokenised Payables</h4>
                      </div>
                      <div className="col-md-12">
          
                        <table style={{ border:"1px solid"}}>
                          {(dtscf.length > 0)?
                          <tr>
                            <th>ID</th>
                            <th>Project Name</th>
{/*
                            <th>Anchor</th>
                            <th>Total Budget</th>
*/}
                            <th>Cash Token</th>
                            <th>Balance</th>
                            <th>Blockchain</th>
{/*
                            <th>Start Date</th>
                            <th>Maturity Date</th>
*/}
                            <th>Smart Contract</th>
{/*
                            <th>Cash Token Smart Contract</th>
*/}
                            <th>View Details</th>
                            <th>View on Blockchain explorer</th>
{/*
                            <th>Add Sub-Contractors and Purchases</th>
*/}
                            <th>View Token Details</th>
                            <th>Unwrap TP to Cash token</th>
                          </tr>
                          : null}
                          {dtscf && dtscf.length > 0 &&
                            dtscf.map((dtscf1, index) => (
                              <tr>
                                <td>{dtscf1.id}</td>
                                <td>{dtscf1.name}</td>
{/*
                                <td>{dtscf1.anchorName}</td>
                                <td>{dtscf1.totalBudget?.toLocaleString()}</td>
*/}
                                <td>{
                                      (
                                        dtscf1 &&
                                          dtscf1.tokenName !== undefined)
                                        ? dtscf1.tokenName  :null
                                  
                                    }
                                </td>
                                <td>{
                                      (
                                        dtscf1 &&
                                          dtscf1.value !== undefined)
                                        ? "$" + dtscf1.value?.toLocaleString()  :null
                                    }
                                </td>
                                <td>{(() => {
                                    switch (dtscf1.blockchain) {
                                      case 80001:
                                        return 'Polygon Testnet Mumbai (Deprecated)'
                                      case 80002:
                                        return 'Polygon Testnet Amoy'
                                      case 11155111:
                                        return 'Ethereum Testnet Sepolia'
                                      case 43113:
                                        return 'Avalanche Testnet Fuji'
                                      case 137:
                                        return 'Polygon Mainnet'
                                      case 1:
                                        return 'Ethereum  Mainnet'
                                      case 43114:
                                        return 'Avalanche Mainnet'
                                      default:
                                        return null
                                    }
                                  }
                                )()}
                                </td>
{/*
                                <td>{dtscf1.startdate}</td>
                                <td>{dtscf1.enddate}</td>
*/}
                                <td>{
                                      (dtscf1.smartcontractaddress !== undefined && typeof dtscf1.smartcontractaddress === "string")? this.shorten(dtscf1.smartcontractaddress): null
                                    }
                                </td>
{/*
                                <td>{
                                      (
                                        dtscf1 &&
                                          dtscf1.underlyingDSGDsmartcontractaddress !== undefined && typeof dtscf1.underlyingDSGDsmartcontractaddress === "string")
                                        ? this.shorten(dtscf1.underlyingDSGDsmartcontractaddress)  :null
                                    }
                                </td>
*/}
                                <td>
                                  <Link
                                    to={"/dtscfcheckapprove/" + dtscf1.draftdtscfid}
                                  >
                                    <button
                                      className="m-3 btn btn-sm btn-primary"
                                    >
                                      View
                                    </button>
                                  </Link>
                                </td>
                                <td>
                                  <a href={"https://"+
                                  (() => {
                                    switch (dtscf1.blockchain) {
                                      case 80001:
                                        return 'mumbai.polygonscan.com/address/'
                                      case 80002:
                                        return 'amoy.polygonscan.com/address/'
                                      case 11155111:
                                        return 'sepolia.etherscan.io/address/'
                                      case 43113:
                                        return 'fuji.avascan.info/blockchain/all/address/'
                                      case 137:
                                        return 'polygonscan.com/address/'
                                      case 1:
                                        return 'etherscan.io/address/'
                                      case 43114:
                                        return 'avascan.info/blockchain/all/address/'
                                      default:
                                        return null
                                    }
                                  }
                                )()
                                  +dtscf1.smartcontractaddress} target="_blank" rel="noreferrer">View <i className='bx bx-link-external'></i></a>
                                </td>
                                <td>
                                  <Link
                                    to={"/dtscfview/1/" + dtscf1.smartcontractaddress}
                                  >
                                    <button
                                      className="m-3 btn btn-sm btn-primary"
                                    >
                                      View
                                    </button>
                                  </Link>
                                </td>
                                <td>
                                  <Link
                                    to={"/dtscfunwrap/" + dtscf1.id}
                                      className="badge badge-warning"
                                    >
                                      Unwrap
                                  </Link>
                                </td>
                              </tr>
                            ))}
                        </table>
                      </div>
                    </div>
<br />
<br />
<br />
{/*  
//
//      TOKENISED CASH TABLE
//
*/}
                    <div className="list row">
                      <div className="col-md-8">
                      {
                        // (campaigns.length > 0) ?
                        <div className="input-group mb-3">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name"
                            value={searchName}
                            onChange={this.onChangeSearchName}
                          />
                          <div className="input-group-append">
                            <button
                              className="btn btn-outline-secondary"
                              type="button"
                              onClick={this.searchName}
                            >
                              Search
                            </button>
                          </div>
                        </div>
                        // : null
                      }
                      </div>
                      <div className="col-md-12">
                        <br />
                        <h4>Tokenised Cash</h4>
                      </div>

                      <div className="col-md-12">
                        <table style={{ border:"1px solid"}}>
                          {(campaigns.length > 0)?
                          <tr>
                            <th>ID</th>
{/*
                            <th>Name</th>
*/}
                            <th>Token</th>
                            <th>Blockchain</th>
{/*
                            <th>Start Date</th>
                            <th>End Date</th>
*/}
                            <th>Sponsor</th>
                            <th>Wallet balance</th>
                            <th>Smart Contract</th>
                            <th>View</th>
                            <th>View Blockchain</th>
                            <th>Action</th>
                          </tr>
                          : null}
                          {campaigns && campaigns.length > 0 &&
                            campaigns.map((campaign1, index) => (
                              ((typeof campaign1.balance === "number" && campaign1.balance > 0) || (typeof campaign1.balance === "string" && parseFloat(campaign1.balance) > 0))&&
                              <tr>
                                <td>{campaign1.id}</td>
{/*                                
                                <td>{campaign1.name}</td>
*/}
                                <td>{campaign1.tokenname}</td>
                                <td>{(() => {
                                    switch (campaign1.blockchain) {
                                      case 80001:
                                        return 'Polygon Testnet Mumbai (Deprecated)'
                                      case 80002:
                                        return 'Polygon Testnet Amoy'
                                      case 11155111:
                                        return 'Ethereum Testnet Sepolia'
                                      case 43113:
                                        return 'Avalanche Testnet Fuji'
                                      case 137:
                                        return 'Polygon Mainnet'
                                      case 1:
                                        return 'Ethereum  Mainnet'
                                      case 43114:
                                        return 'Avalanche Mainnet'
                                      default:
                                        return null
                                    }
                                  }
                                )()}
                                </td>
{/*
                                <td>{campaign1.startdate}</td>
                                <td>{campaign1.enddate}</td>
*/}
                                <td>
                                  {
                                      (
                                        campaign1.recipient &&
                                        campaign1.recipient.name !== undefined)
                                        ? campaign1.recipient.name  :null
                                    }
                                </td>
                                <td>{typeof campaign1.balance === "number" ? campaign1.balance.toLocaleString() : parseFloat(campaign1.balance).toFixed(2).toLocaleString()}</td>
                                <td>{
                                      (campaign1.smartcontractaddress !== undefined && typeof campaign1.smartcontractaddress === "string")? this.shorten(campaign1.smartcontractaddress): null
                                    }
                                </td>
                                <td>
                                    <Link
                                      to={"/campaigncheckapprove/" + campaign1.draftcampaignid}
                                    >
                                      <button
                                        className="m-3 btn btn-sm btn-primary"
                                      >
                                        View
                                      </button>
                                    </Link>
                                  
                                </td>
                                <td>
                                  {
                                    
                                  }
                                  <a href={"https://"+
                                  (() => {
                                    switch (campaign1.blockchain) {
                                      case 80001:
                                        return 'mumbai.polygonscan.com/address/'
                                      case 80002:
                                        return 'amoy.polygonscan.com/address/'
                                      case 11155111:
                                        return 'sepolia.etherscan.io/address/'
                                      case 43113:
                                        return 'fuji.avascan.info/blockchain/all/address/'
                                      case 137:
                                        return 'polygonscan.com/address/'
                                      case 1:
                                        return 'etherscan.io/address/'
                                      case 43114:
                                        return 'avascan.info/blockchain/all/address/'
                                      default:
                                        return null
                                    }
                                  }
                                )()
                                  +campaign1.smartcontractaddress} target="_blank" rel="noreferrer">View <i className='bx bx-link-external'></i></a>
                                </td>
                                <td>
                                  <Link
                                    to={"/campaignedit/" + campaign1.id}
                                    className="badge badge-warning"
                                  >
                                    {this.state.isMaker? "Edit / Delete" : "View"}
                                  </Link>
                                </td>
                              </tr>
                            ))}
                        </table>
                      </div>
                    </div>
            </>
            ) 
          } 

          <br/>
          <br/>

        </div>: null}
      </div>
    );
  }
}
