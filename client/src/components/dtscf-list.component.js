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
              if (element.name.toUpperCase() === "CHECKER") 
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

    let ismaker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "MAKER" && el.transactionType.toUpperCase() === "DTSCF"
    );
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "CHECKER" && el.transactionType.toUpperCase() === "DTSCF"
    );
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "APPROVER" && el.transactionType.toUpperCase() === "DTSCF"
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
              <strong>Deployed Dtscf { (this.state.isMaker? "(Maker)" : (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null))) }</strong>
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
                  <th>Dtscf Name</th>
                  <th>Token Symbol</th>
                  <th>Cash Token</th>
                  <th>Blockchain</th>
                  <th>Issue Date</th>
                  <th>Maturity Date</th>
                  <th>Issuer</th>
                  <th>Total Issue Size</th>
                  <th>Dtscf Smart Contract</th>
                  <th>Cash Token Smart Contract</th>
                  <th>View Details</th>
                  <th>View on Blockchain explorer</th>
                  <th>Issuer Fund Coupon</th>
                  <th>Action</th>
{/*
                  <th>Action</th>
                  <th>Transfer</th>
*/}
                </tr>
                : null}
                {dtscf && dtscf.length > 0 &&
                  dtscf.map((dtscf1, index) => (
                    <tr>
                      <td>{dtscf1.name}</td>
                      <td>{dtscf1.tokensymbol}</td>
                      <td>{
                            (
                              dtscf1.campaign &&
                                dtscf1.campaign.tokenname !== undefined)
                              ? dtscf1.campaign.tokenname  :null
                        
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
                      <td>{dtscf1.issuedate}</td>
                      <td>{dtscf1.maturitydate}</td>
                      <td>
                          {
                            (
                              dtscf1.recipient &&
                               dtscf1.recipient.name !== undefined)
                              ? dtscf1.recipient.name  :null
                          }
                      </td>
                      <td>{dtscf1.totalsupply.toLocaleString()}</td>
                      <td>{
                            (dtscf1.smartcontractaddress !== undefined && typeof dtscf1.smartcontractaddress === "string")? this.shorten(dtscf1.smartcontractaddress): null
                          }
                      </td>
                      <td>{
                            (
                              dtscf1.campaign &&
                                dtscf1.campaign.smartcontractaddress !== undefined && typeof dtscf1.campaign.smartcontractaddress === "string")
                              ? this.shorten(dtscf1.campaign.smartcontractaddress)  :null
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
                        <a href={window.location.origin + "/dtscfcouponallowance/" + dtscf1.id} target="_blank" rel="noreferrer">Issuer Set Fund Pull <i className='bx bx-link-external'></i></a>
                      </td>
                      <td>
                        <Link
                          to={"/dtscfcoupontrigger/" + dtscf1.id}
                          className="badge badge-warning"
                        >
                           {this.state.isMaker? "Trigger Coupon Payment" : null}
                        </Link>
                      </td>
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
                    Create Dtscf
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


  
