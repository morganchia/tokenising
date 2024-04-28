import React, { Component } from "react";
import CampaignDataService from "../services/campaign.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { Link, Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';

export default class CampaignList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchName = this.onChangeSearchName.bind(this);
    this.retrieveCampaigns = this.retrieveCampaigns.bind(this);
//    this.retrieveOpsRole = this.retrieveOpsRole.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveCampaign = this.setActiveCampaign.bind(this);
    this.removeAllCampaigns = this.removeAllCampaigns.bind(this);
    this.searchName = this.searchName.bind(this);

    this.state = {
      campaigns: [],
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

  onChangeSearchName(e) {
    const searchName = e.target.value;

    this.setState({
      searchName: searchName
    });
  }

  retrieveCampaigns() {
    CampaignDataService.getAll()
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
/*
  retrieveOpsRole(id) {
    if (id) {
      //console.log("currentUser: ", this.state.currentUser);

      UserOpsRoleDataService.findOpsRoleByID(id)
        .then(response => {
          let chkList = response.data.find((element) => {
            //var el_id = element.id;                       console.log("typeof(el_id)", typeof(el_id));
            console.log("element.name:", element.name);   console.log("typeof(element.name)", typeof(element.name));
            try {
              if (element.name.toUpperCase() === "CHECKER") 
                return element;
            } catch(e) {
              // do nothing, sometime when campaignList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
            }
            return null;
          });
          this.setState({
            opsRoles: response.data
          });
          console.log("Response data from retrieveOpsRole() UserOpsRoleDataService.findByID:",response.data);
        })
        .catch(e => {
          console.log(e);
        }
      );
    } else {
      console.log("Error, currentUser not found!");
    }
  }
*/
  refreshList() {
    this.retrieveCampaigns();
    this.setState({
      currentCampaign: null,
      currentIndex: -1
    });
  }

  setActiveCampaign(campaign, index) {
    this.setState({
      currentCampaign: campaign,
      currentIndex: index
    });
  }

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

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user) this.setState({ redirect: "/login" });
    this.setState({ currentUser: user, userReady: true })

    //console.log("currentUser: ", currentUser);
    this.retrieveCampaigns();
//    this.retrieveOpsRole(currentUser.id);

    let ismaker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "MAKER" && el.transactionType.toUpperCase() === "CAMPAIGN"
    );
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "CHECKER" && el.transactionType.toUpperCase() === "CAMPAIGN"
    );
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "APPROVER" && el.transactionType.toUpperCase() === "CAMPAIGN"
    );
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

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

    const { searchName, campaigns, currentUser } = this.state;

    return (
      <>
      <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>Deployed Campaigns { (this.state.isMaker? "(Maker)" : (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null))) }</strong>
            </h3>
          </header>

        </div>: null}

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

              <table style={{ border:"1px solid"}}>
                {(campaigns.length > 0)?
                <tr>
                  <th>Name</th>
                  <th>Token</th>
                  <th>Blockchain</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Sponsor</th>
                  <th>Amount</th>
                  <th>Smart Contract</th>
                  <th>View Blockchain</th>
                  <th>Action</th>
                </tr>
                : null}
                {campaigns && campaigns.length > 0 &&
                  campaigns.map((campaign1, index) => (
                    <tr>
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
                      <td>{
                            (campaign1.smartcontractaddress !== undefined && typeof campaign1.smartcontractaddress === "string")? this.shorten(campaign1.smartcontractaddress): null
                          }
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

              {
              this.state.isMaker? 
                <Link
                  to={"/campaignadd/"}
                >
                  <button
                    className="m-3 btn btn-sm btn-primary"
                  >
                    Create Campaign
                  </button>
                </Link>
              : null
              }
              { 
              /*
              this.state.isMaker && (campaigns.length > 0) ? 
                <button className="m-3 btn btn-sm btn-danger" onClick={this.showModal}>
                  Remove All
                </button>
              : null 
              */
              }
              <br/>
              <Modal showm={this.state.showm} handleProceed1={this.removeAllCampaigns} handleCancel={this.hideModal} handleProceed2={null} button1text={this.state.button1text} button2text={this.state.button2text} button0text={this.state.button0text}>
                {this.state.modalmsg}
              </Modal>
            </div>
          </div>
      </div>
      </>
    );
  }
}


  
