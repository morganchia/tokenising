import React, { Component } from "react";
import PBMDataService from "../services/pbm.service";
import CampaignDataService from "../services/campaign.service";
import MintDataService from "../services/mint.service";
import TransferDataService from "../services/transfer.service";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { Link, Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';

export default class CampaignList extends Component {
  constructor(props) {
    super(props);
//    this.onChangeSearchName = this.onChangeSearchName.bind(this);
//    this.searchName = this.searchName.bind(this);
    this.retrievePBM = this.retrievePBM.bind(this);
    this.retrieveCampaigns = this.retrieveCampaigns.bind(this);
    this.retrieveMints = this.retrieveMints.bind(this);
    this.retrieveTransfers = this.retrieveTransfers.bind(this);
    this.retrieveRecipients = this.retrieveRecipients.bind(this);
    this.refreshList = this.refreshList.bind(this);
//    this.removeAllCampaigns = this.removeAllCampaigns.bind(this);

    this.state = {
      pbm: [],
      campaigns: [],
      mints: [],
      transfers: [],
      recipients: [],
      opsRoles: [],
      currentCampaign: null,
      isMaker: false,
      isChecker: false,
      isApprover: false,

      currentIndex: -1,
      searchName: "",
      modal: {
        showm: false,
        modalmsg: "",
        button1text: undefined,
        button2text: undefined,
        button0text: undefined,
      }
    };
  }
/*
  onChangeSearchName(e) {
    const searchName = e.target.value;

    this.setState({
      searchName: searchName
    });
  }
*/
  retrievePBM(userid) {
    if (userid !== undefined) {
      PBMDataService.getAllDraftsByUserId(userid)
      .then(response => {
        this.setState({
          pbm: response.data
        });
        console.log("Response data from retrievPBM() PBMDataService.getAllDraftsByUserId:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
    }
  }

  retrieveCampaigns(userid) {
    if (userid !== undefined) {
      CampaignDataService.getAllDraftsByUserId(userid)
      .then(response => {
        this.setState({
          campaigns: response.data
        });
        console.log("Response data from retrievCampaigns() CampaignDataService.getAllDraftsByUserId:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
    }
  }

  retrieveMints(userid) {
    if (userid !== undefined) {
      MintDataService.getAllDraftsByUserId(userid)
      .then(response => {
        this.setState({
          mints: response.data
        });
        console.log("Response data from retrievMints() MintDataService.getAllDraftsByUserId:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
    }
  }

  retrieveTransfers(userid) {
    if (userid !== undefined) {
      TransferDataService.getAllDraftsByUserId(userid)
      .then(response => {
        this.setState({
          transfers: response.data
        });
        console.log("Response data from retrievTransfers() TransferDataService.getAllDraftsByUserId:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
    }
  }

  retrieveRecipients(userid) {
    if (userid !== undefined) {
      RecipientDataService.getAllDraftsByUserId(userid)
      .then(response => {
        this.setState({
          recipients: response.data
        });
        console.log("Response data from retrievRecipients() RecipientDataService.getAllDraftsByUserId:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
    }
  }

  refreshList() {
    this.retrievePBM();
    this.retrieveCampaigns();
    this.setState({
      currentCampaign: null,
      currentIndex: -1
    });
    this.retrieveMints();
    this.retrieveTransfers();
    this.retrieveRecipients();
  }
/*
  removeAllCampaigns() {
    CampaignDataService.deleteAll()
      .then(response => {
        console.log(response.data);
        this.refreshList();
      })
      .catch(e => {
        console.log(e);
      });
  }
*/
/*
  searchName() {
    this.setState({
      currentCampaign: null,
      currentIndex: -1
    });

    CampaignDataService.findByName(this.state.searchName)
      .then(response => {
        this.setState({
          campaigns: response.data
        });
        console.log("CampaignDataService.findByName",response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }
*/
  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user) this.setState({ redirect: "/login" });
    this.setState({ currentUser: user, userReady: true })

    let ismaker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "MAKER");
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "CHECKER");
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "APPROVER");
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

    this.retrievePBM(user.id);
    this.retrieveCampaigns(user.id);
    this.retrieveMints(user.id);
    this.retrieveTransfers(user.id);
    this.retrieveRecipients(user.id);

}

  showModal = () => {
    this.setState({ showm: true,
                    modalmsg: "This action is irreversible. Do you want to remove all the campaigns?", 
                    button1text : "Remove all",
                    button0text: "Cancel",
    });
  };

  hideModal = () => {
    this.setState({ showm: false });
  };

  shorten(s) {
    return(s.substring(0,6) + "..." + s.slice(-4));
  }


  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { searchName, pbm, campaigns, mints, transfers, recipients, CurrentUser } = this.state;

    return (
      <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>Inbox</strong>
            </h3>
          </header>

        </div>: null}

          <div className="list row">
            <div className="col-md-8">
            {
              /*
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
              */
              // : null
            }
            </div>
            <div className="col-md-12">

            <h5>
              <strong>PBMs</strong>
            </h5>
              <table style={{ border:"1px solid"}}>
                {(pbm.length > 0)?
                <tr>
                  <th>Action</th>
                  <th>Name</th>
                  <th>Token</th>
                  <th>Blockchain</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Sponsor</th>
                  <th>Amount</th>
                  {
                  /*
                  <th>Smart Contract</th>
                  */
                  }
                  <th>Status</th>
                  <th>Action</th>
                </tr>
                : null}
                {pbm && pbm.length > 0 &&
                  pbm.map((pbm1, index) => (
                    <tr>
                      <td>{pbm1.txntype===0?"Create":pbm1.txntype===1?"Update":"Delete"}</td>
                      <td>{pbm1.name}</td>
                      <td>{pbm1.tokenname}</td>
                      <td>{(() => {
                          switch (pbm1.campaign.blockchain) {
                            case 80001:
                              return 'Polygon Testnet Mumbai'
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
                      <td>{pbm1.startdate}</td>
                      <td>{pbm1.enddate}</td>
                      <td>
                        {
                            (
                              pbm1.recipient &&
                               pbm1.recipient.name !== undefined)
                              ? pbm1.recipient.name  :null
                          }
                      </td>
                      <td>{pbm1.amount}</td>
                      {
                        /*
                      <td>
                            (pbm1.smartcontractaddress !== undefined && typeof pbm1.smartcontractaddress === "string")? this.shorten(pbm1.smartcontractaddress): null
                          
                      </td>
                      */
                      }
                      <td>
                      {
                          pbm1.status === -1? "Rejected pending correction" : 
                            (pbm1.status === 0? "Created pending submission":
                              (pbm1.status === 1? "Submitted pending checker endorsement":
                                (pbm1.status === 2? "Checked pending approval":
                                  (pbm1.status === 3? "Approved": null)
                                )
                              )
                            )
                      }
                      </td>
                      <td>
                        <Link
                          to={"/pbmcheckapprove/" + pbm1.id}
                          className="badge badge-warning"
                        >
                          {
                            pbm1.status === -1? "View/Correct Task" : (
                              pbm1.status === 0? "View/Submit Task": (
                                pbm1.status === 1? "View/Endorse Task": (
                                  pbm1.status === 2? "View/Approve Task": null
                                )
                              )
                            )
                          }
                        </Link>
                      </td>
                    </tr>
                  ))}
              </table>
              {!(pbm.length > 0)? "You have no pending actions."
              : null}

              <br/>
              <br/>
              
              <h5>
              <strong>Campaigns</strong>
            </h5>
              <table style={{ border:"1px solid"}}>
                {(campaigns.length > 0)?
                <tr>
                  <th>Action</th>
                  <th>Name</th>
                  <th>Token</th>
                  <th>Blockchain</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Sponsor</th>
                  <th>Amount</th>
                  {
                  /*
                  <th>Smart Contract</th>
                  */
                  }
                  <th>Status</th>
                  <th>Action</th>
                </tr>
                : null}
                {campaigns && campaigns.length > 0 &&
                  campaigns.map((campaign1, index) => (
                    <tr>
                      <td>{campaign1.txntype===0?"Create":campaign1.txntype===1?"Update":"Delete"}</td>
                      <td>{campaign1.name}</td>
                      <td>{campaign1.tokenname}</td>
                      <td>{(() => {
                          switch (campaign1.blockchain) {
                            case 80001:
                              return 'Polygon Testnet Mumbai'
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
                      <td>{campaign1.startdate}</td>
                      <td>{campaign1.enddate}</td>
                      <td>
                        {
                            (
                              campaign1.recipient &&
                               campaign1.recipient.name !== undefined)
                              ? campaign1.recipient.name  :null
                          }
                      </td>
                      <td>{campaign1.amount}</td>
                      {
                        /*
                      <td>
                            (campaign1.smartcontractaddress !== undefined && typeof campaign1.smartcontractaddress === "string")? this.shorten(campaign1.smartcontractaddress): null
                          
                      </td>
                      */
                      }
                      <td>
                      {
                          campaign1.status === -1? "Rejected pending correction" : 
                            (campaign1.status === 0? "Created pending submission":
                              (campaign1.status === 1? "Submitted pending check":
                                (campaign1.status === 2? "Checked pending approval":
                                  (campaign1.status === 3? "Approved": null)
                                )
                              )
                            )
                      }
                      </td>
                      <td>
                        <Link
                          to={"/campaigncheckapprove/" + campaign1.id}
                          className="badge badge-warning"
                        >
                          {
                            campaign1.status === -1? "View/Correct Task" : (
                              campaign1.status === 0? "View/Submit Task": (
                                campaign1.status === 1? "View/Endorse Task": (
                                  campaign1.status === 2? "View/Approve Task": null
                                )
                              )
                            )
                          }
                        </Link>
                      </td>
                    </tr>
                  ))}
              </table>
              {!(campaigns.length > 0)? "You have no pending actions."
              : null}

              <br/>
              <br/>
              
              <h5>
              <strong>Mints</strong>
              </h5>
              <table style={{ border:"1px solid"}}>
                {(mints.length > 0)?
                <tr>
                  <th>Action</th>
                  <th>Campaign</th>
                  <th>Token</th>
                  <th>Blockchain</th>
                  <th>Mint Amount</th>
                  {
                  /*
                  <th>Smart Contract</th>
                  */
                  }
                  <th>Status</th>
                  <th>Action</th>
                </tr>
                : null}
                {mints && mints.length > 0 &&
                  mints.map((mint1, index) => (
                    <tr>
                      <td>{mint1.txntype===0?"Create":mint1.txntype===1?"Update":"Delete"}</td>
                      <td>{mint1.campaign.name}</td>
                      <td>{mint1.campaign.tokenname}</td>
                      <td>{(() => {
                          switch (mint1.blockchain) {
                            case 80001:
                              return 'Polygon Testnet Mumbai'
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
                      <td>{mint1.mintAmount}</td>
                      {
                        /*
                      <td>
                            (mint1.smartcontractaddress !== undefined && typeof mint1.smartcontractaddress === "string")? this.shorten(mint1.smartcontractaddress): null
                          
                      </td>
                      */
                      }
                      <td>
                      {
                          mint1.status === -1? "Rejected pending correction" : 
                            (mint1.status === 0? "Created pending submission":
                              (mint1.status === 1? "Submitted pending check":
                                (mint1.status === 2? "Checked pending approval":
                                  (mint1.status === 3? "Approved": null)
                                )
                              )
                            )
                      }
                      </td>
                      <td>
                        <Link
                          to={"/mintcheckapprove/" + mint1.id}
                          className="badge badge-warning"
                        >
                          {
                            mint1.status === -1? "View/Correct Task" : (
                              mint1.status === 0? "View/Submit Task": (
                                mint1.status === 1? "View/Endorse Task": (
                                  mint1.status === 2? "View/Approve Task": null
                                )
                              )
                            )
                          }
                        </Link>
                      </td>
                    </tr>
                  ))}
              </table>

              {!(mints.length > 0)? "You have no pending actions."
              : null}

              <br/>
              <br/>
              
              <h5>
              <strong>Transfers</strong>
              </h5>
              <table style={{ border:"1px solid"}}>
                {(transfers.length > 0)?
                <tr>
                  <th>Action</th>
                  <th>Campaign</th>
                  <th>Token</th>
                  <th>Blockchain</th>
                  <th>Transfer Amount</th>
                  {
                  /*
                  <th>Smart Contract</th>
                  */
                  }
                  <th>Status</th>
                  <th>Action</th>
                </tr>
                : null}
                {transfers && transfers.length > 0 &&
                  transfers.map((transfer1, index) => (
                    <tr>
                      <td>{transfer1.txntype===0?"Create":transfer1.txntype===1?"Update":"Delete"}</td>
                      <td>{transfer1.campaign.name}</td>
                      <td>{transfer1.campaign.tokenname}</td>
                      <td>{(() => {
                          switch (transfer1.blockchain) {
                            case 80001:
                              return 'Polygon Testnet Mumbai'
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
                      <td>{transfer1.transferAmount}</td>
                      {
                        /*
                      <td>
                            (transfer1.smartcontractaddress !== undefined && typeof transfer1.smartcontractaddress === "string")? this.shorten(transfer1.smartcontractaddress): null
                          
                      </td>
                      */
                      }
                      <td>
                      {
                          transfer1.status === -1? "Rejected pending correction" : 
                            (transfer1.status === 0? "Created pending submission":
                              (transfer1.status === 1? "Submitted pending check":
                                (transfer1.status === 2? "Checked pending approval":
                                  (transfer1.status === 3? "Approved": null)
                                )
                              )
                            )
                      }
                      </td>
                      <td>
                        <Link
                          to={"/transfercheckapprove/" + transfer1.id}
                          className="badge badge-warning"
                        >
                          {
                            transfer1.status === -1? "View/Correct Task" : (
                              transfer1.status === 0? "View/Submit Task": (
                                transfer1.status === 1? "View/Endorse Task": (
                                  transfer1.status === 2? "View/Approve Task": null
                                )
                              )
                            )
                          }
                        </Link>
                      </td>
                    </tr>
                  ))}
              </table>

              {!(transfers.length > 0)? "You have no pending actions."
              : null}



              <br/>
              <br/>
              
              <h5>
              <strong>Recipients maintenance</strong>
              </h5>
              <table style={{ border:"1px solid"}}>
                {(recipients.length > 0)?
                <tr>
                  <th>Action</th>
                  <th>Name</th>
                  <th>Wallet Address</th>
                  <th>Bank</th>
                  <th>Account Number</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
                : null}
                {recipients && recipients.length > 0 &&
                  recipients.map((recipient1, index) => (
                    <tr>
                      <td>{recipient1.txntype===0?"Create":recipient1.txntype===1?"Update":"Delete"}</td>
                      <td>{recipient1.name}</td>
                      <td>{recipient1.walletaddress}</td>
                      <td>{recipient1.bank}</td>
                      <td>{recipient1.bankaccount}</td>
                      <td>
                      {
                          recipient1.status === -1? "Rejected pending correction" : 
                            (recipient1.status === 0? "Created pending submission":
                              (recipient1.status === 1? "Submitted pending check":
                                (recipient1.status === 2? "Checked pending approval":
                                  (recipient1.status === 3? "Approved": null)
                                )
                              )
                            )
                      }
                      </td>
                      <td>
                        <Link
                          to={"/recipientcheckapprove/" + recipient1.id}
                          className="badge badge-warning"
                        >
                          {
                            recipient1.status === -1? "View/Correct Task" : (
                              recipient1.status === 0? "View/Submit Task": (
                                recipient1.status === 1? "View/Endorse Task": (
                                  recipient1.status === 2? "View/Approve Task": null
                                )
                              )
                            )
                          }
                        </Link>
                      </td>
                    </tr>
                  ))}
              </table>

              {!(recipients.length > 0)? "You have no pending actions."
              : null}

              <br/>
              <br/>

              <Modal showm={this.state.showm} handleProceed1={this.removeAllCampaigns} handleCancel={this.hideModal} handleProceed2={null} button1text={this.state.button1text} button2text={this.state.button2text} button0text={this.state.button0text}>
                {this.state.modalmsg}
              </Modal>
            </div>
          </div>
      </div>

    );
  }
}
