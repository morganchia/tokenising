import React, { Component } from "react";
import PBMDataService from "../services/pbm.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { Link, Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';

export default class PBMList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchName = this.onChangeSearchName.bind(this);
    this.retrievePBM = this.retrievePBM.bind(this);
//    this.retrieveOpsRole = this.retrieveOpsRole.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActivePBM = this.setActivePBM.bind(this);
    this.removeAllPBM = this.removeAllPBM.bind(this);
    this.searchName = this.searchName.bind(this);

    this.state = {
      pbm: [],
      opsRoles: [],
      currentPBM: null,
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

  retrievePBM() {
    PBMDataService.getAll()
      .then(response => {
        this.setState({
          pbm: response.data
        });
        console.log("Response data from retrievePBM() PBMDataService.getAll:", response.data);
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
              // do nothing, sometime when pbmList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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
    this.retrievePBM();
    this.setState({
      currentPBM: null,
      currentIndex: -1
    });
  }

  setActivePBM(pbm, index) {
    this.setState({
      currentPBM: pbm,
      currentIndex: index
    });
  }

  removeAllPBM() {
    PBMDataService.deleteAll()
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
      currentPBM: null,
      currentIndex: -1
    });

    PBMDataService.findByName(this.state.searchName)
      .then(response => {
        this.setState({
          pbm: response.data
        });
        console.log("PBMDataService.findByName",response.data);
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
    this.retrievePBM();
//    this.retrieveOpsRole(currentUser.id);

    let ismaker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "MAKER" && el.transactionType.toUpperCase() === "PBM"
    );
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "CHECKER" && el.transactionType.toUpperCase() === "PBM"
    );
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "APPROVER" && el.transactionType.toUpperCase() === "PBM"
    );
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

}

  showModal = () => {
    this.setState({ showm: true,
                    modalmsg: "This action is irreversible. Do you want to remove all the PBMs?", 
                    button1text : "Remove all",
                    button0text: "Cancel",
    });
  };

  hideModal = () => {
    this.setState({ showm: false });
  };

  shorten(s) {
    return(s.substring(0,6) + "..." + s.slice(-3));
  }


  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { searchName, pbm, currentUser } = this.state;

    return (
      <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>Deployed PBM { (this.state.isMaker? "(Maker)" : (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null))) }</strong>
            </h3>
          </header>

        </div>: null}

          <div className="list row">
            <div className="col-md-8">
            {
              // (pbm.length > 0) ?
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
                {(pbm.length > 0)?
                <tr>
                  <th>PBM Name</th>
                  <th>PBM Token Name</th>
                  <th>Underlying Token</th>
                  <th>Blockchain</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Sponsor</th>
                  <th>Amount</th>
                  <th>PBM Smart Contract</th>
                  <th>Underlying Smart Contract</th>
                  <th>View Blockchain</th>
{/*}
                  <th>Action</th>
{*/}
                  <th>Mint PBM</th>
                </tr>
                : null}
                {pbm && pbm.length > 0 &&
                  pbm.map((pbm1, index) => (
                    <tr>
                      <td>{pbm1.name}</td>
                      <td>{pbm1.tokenname}</td>
                      <td>{
                            (
                              pbm1.campaign &&
                                pbm1.campaign.tokenname !== undefined)
                              ? pbm1.campaign.tokenname  :null
                        
                          }
                      </td>
                      <td>{(() => {
                          switch (pbm1.campaign.blockchain) {
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
                      <td>{
                            (pbm1.smartcontractaddress !== undefined && typeof pbm1.smartcontractaddress === "string")? this.shorten(pbm1.smartcontractaddress): null
                          }
                      </td>
                      <td>{
                            (
                              pbm1.campaign &&
                                pbm1.campaign.smartcontractaddress !== undefined && typeof pbm1.campaign.smartcontractaddress === "string")
                              ? this.shorten(pbm1.campaign.smartcontractaddress)  :null
                          }
                      </td>
                      <td>
                        <a href={"https://"+
                        (() => {
                          switch (pbm1.campaign.blockchain) {
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
                        +pbm1.smartcontractaddress} target="_blank" rel="noreferrer">View <i className='bx bx-link-external'></i></a>
                      </td>
{/*}
                      <td>
                        <Link
                          to={"/pbmedit/" + pbm1.id}
                          className="badge badge-warning"
                        >
                           {this.state.isMaker? "Edit / Delete" : "View"}
                        </Link>
                      </td>
{*/}
                      <td>
                        <Link
                          to={"/pbmwrapadd/"}
                          className="badge badge-warning"
                        >
                           {this.state.isMaker? "Wrap UnderlyingToken to PBM" : ""}
                        </Link>
                      </td>

                    </tr>
                  ))}
              </table>

              {
              this.state.isMaker? 
                <Link
                  to={"/pbmcheckapprove/0/"}
                >
                  <button
                    className="m-3 btn btn-sm btn-primary"
                  >
                    Create PBM
                  </button>
                </Link>
              : null
              }
              { 
              /*
              this.state.isMaker && (pbm.length > 0) ? 
                <button className="m-3 btn btn-sm btn-danger" onClick={this.showModal}>
                  Remove All
                </button>
              : null 
              */
              }
              <br/>

              <Modal showm={this.state.showm} handleProceed1={this.removeAllPBM} handleCancel={this.hideModal} handleProceed2={null} button1text={this.state.button1text} button2text={this.state.button2text} button0text={this.state.button0text}>
                {this.state.modalmsg}
              </Modal>
            </div>
          </div>
      </div>

    );
  }
}


  
