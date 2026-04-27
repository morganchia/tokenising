import React, { Component } from "react";
import DtscfDataService from "../services/dtscf.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { Link, Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';

export default class DtscfList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchName = this.onChangeSearchName.bind(this);
    this.retrieveDtscf = this.retrieveDtscf.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveDtscf = this.setActiveDtscf.bind(this);
    this.removeAllDtscf = this.removeAllDtscf.bind(this);
    this.searchName = this.searchName.bind(this);

    this.state = {
      dtscf: [],
      opsRoles: [],
      currentDtscf: null,
      isAnchor: false,
      isContractor: false,
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

  retrieveDtscf() {
    DtscfDataService.getAll()
      .then(response => {
        this.setState({
          dtscf: response.data
        });
        console.log("Response data from retrieveDtscf() DtscfDataService.getAll:", response.data);
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
              if (element.name?.toUpperCase() === "CHECKER") 
                return element;
            } catch(e) {
              // do nothing, sometime when dtscfList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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
    this.retrieveDtscf();
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

  removeAllDtscf() {
    DtscfDataService.deleteAll()
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
      currentDtscf: null,
      currentIndex: -1
    });

    DtscfDataService.findByName(this.state.searchName)
      .then(response => {
        this.setState({
          dtscf: response.data
        });
        console.log("DtscfDataService.findByName",response.data);
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
    this.retrieveDtscf();
//    this.retrieveOpsRole(currentUser.id);

    console.log("user.roles[0]:", user.roles[0]?.toUpperCase());

    //let is_anchor= (user.roles[0].toUpperCase() === "ROLE_ANCHOR");
    console.log("isAnchor:", (user.roles[0]?.toUpperCase() === "ROLE_ANCHOR"));
    this.setState({ isAnchor: (user.roles[0]?.toUpperCase() === "ROLE_ANCHOR") });

    //let is_contractor= (user.roles[0].toUpperCase() === "ROLE_CONTRACTOR");
    console.log("isContractor:", (user.roles[0]?.toUpperCase() === "ROLE_CONTRACTOR"));
    this.setState({ isContractor: (user.roles[0]?.toUpperCase() === "ROLE_CONTRACTOR") });

    let ismaker= user.opsrole.find((el) => 
      el.opsrole.name?.toUpperCase() === "MAKER" && el.transactionType?.toUpperCase() === "DTSCF"
    );
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => 
      el.opsrole.name?.toUpperCase() === "CHECKER" && el.transactionType?.toUpperCase() === "DTSCF"
    );
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => 
      el.opsrole.name?.toUpperCase() === "APPROVER" && el.transactionType?.toUpperCase() === "DTSCF"
    );
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

}

  showModal = () => {
    this.setState({ showm: true,
                    modalmsg: "This action is irreversible. Do you want to remove all the Dtscfs?", 
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

    const { searchName, dtscf, currentUser } = this.state;

    return (
      <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>Deployed Tokenised Payable Projects { (this.state.isMaker? "(Maker)" : (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null))) }</strong>
            </h3>
          </header>

        </div>: null}

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
            <div className="col-md-12">

              <table style={{ border:"1px solid"}}>
                {(dtscf.length > 0)?
                <tr>
                  <th>ID</th>
                  <th>Project Name</th>
                  <th>Anchor</th>
                  <th>Total Budget</th>
                  <th>Cash Token</th>
                  <th>Blockchain</th>
                  <th>Start Date</th>
                  <th>Maturity Date</th>
                  <th>Tokenised Payable Smart Contract</th>
                  <th>Cash Token Smart Contract</th>
                  <th>View Details</th>
                  <th>View on Blockchain explorer</th>
                  <th>Add Sub-Contractors and Purchases</th>
                  <th>Action</th>
{/*
                  <th>Transfer</th>
*/}
                </tr>
                : null}
                {dtscf && dtscf.length > 0 &&
                  dtscf.map((dtscf1, index) => (
                    <tr>
                      <td>{dtscf1.id}</td>
                      <td>{dtscf1.name}</td>
                      <td>{dtscf1.anchorName}</td>
                      <td>{dtscf1.totalBudget.toLocaleString()}</td>
                      <td>{
                            (
                              dtscf1 &&
                                dtscf1.tokenName !== undefined)
                              ? dtscf1.tokenName  :null
                        
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
                      <td>{dtscf1.startdate}</td>
                      <td>{dtscf1.enddate}</td>
                      <td>{
                            (dtscf1.smartcontractaddress !== undefined && typeof dtscf1.smartcontractaddress === "string")? this.shorten(dtscf1.smartcontractaddress): null
                          }
                      </td>
                      <td>{
                            (
                              dtscf1 &&
                                dtscf1.underlyingDSGDsmartcontractaddress !== undefined && typeof dtscf1.underlyingDSGDsmartcontractaddress === "string")
                              ? this.shorten(dtscf1.underlyingDSGDsmartcontractaddress)  :null
                          }
                      </td>
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
                          to={"/dtscfcheckapprove/" + dtscf1.id}
                          className="badge badge-warning"
                        >
                           {this.state.isMaker? "Add Contractors" : null}
                        </Link>
                      </td>
                      {this.state.isMaker && this.state.isAnchor &&
                        <td>
                            <Link
                              to={"/dtscfrealisemilestone/" + dtscf1.id}
                              className="badge badge-warning"
                            >
                              {this.state.isMaker? "Set Milestone Completion" : null}
                            </Link>
                        </td>
                      }
                      {this.state.isMaker && this.state.isContractor &&
                        <td>
                            <Link
                              to={"/dtscfunwrap/" + dtscf1.id}
                              className="badge badge-warning"
                            >
                              {this.state.isMaker? "Unwrap" : null}
                            </Link>
                        </td>
                      }
{/*
                      <td>
                        <Link
                          to={"/transfercheckapprove/0"}
                          className="badge badge-warning"
                        >
                           {this.state.isMaker? "Dtscf transfer" : ""}
                        </Link>
                      </td>
*/}
                    </tr>
                  ))}
              </table>

              {
              this.state.isMaker? 
                <Link
                  to={"/dtscfcheckapprove/0/"}
                >
                  <button
                    className="m-3 btn btn-sm btn-primary"
                  >
                    Create Project
                  </button>
                </Link>

              : null
              }

              <br/>

              <Modal showm={this.state.showm} handleProceed1={this.removeAllDtscf} handleCancel={this.hideModal} handleProceed2={null} button1text={this.state.button1text} button2text={this.state.button2text} button0text={this.state.button0text}>
                {this.state.modalmsg}
              </Modal>
            </div>
          </div>
      </div>

    );
  }
}


  
