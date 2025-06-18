import React, { Component } from "react";
import BondDataService from "../services/bond.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { Link, Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';

export default class BondList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchName = this.onChangeSearchName.bind(this);
    this.retrieveBond = this.retrieveBond.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveBond = this.setActiveBond.bind(this);
    this.removeAllBond = this.removeAllBond.bind(this);
    this.searchName = this.searchName.bind(this);

    this.state = {
      bond: [],
      opsRoles: [],
      currentBond: null,
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

  retrieveBond() {
    BondDataService.getAll()
      .then(response => {
        this.setState({
          bond: response.data
        });
        console.log("Response data from retrieveBond() BondDataService.getAll:", response.data);
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
              // do nothing, sometime when bondList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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
    this.retrieveBond();
    this.setState({
      currentBond: null,
      currentIndex: -1
    });
  }

  setActiveBond(bond, index) {
    this.setState({
      currentBond: bond,
      currentIndex: index
    });
  }

  removeAllBond() {
    BondDataService.deleteAll()
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
      currentBond: null,
      currentIndex: -1
    });

    BondDataService.findByName(this.state.searchName)
      .then(response => {
        this.setState({
          bond: response.data
        });
        console.log("BondDataService.findByName",response.data);
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
    this.retrieveBond();
//    this.retrieveOpsRole(currentUser.id);

    let ismaker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "MAKER" && el.transactionType.toUpperCase() === "BOND"
    );
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "CHECKER" && el.transactionType.toUpperCase() === "BOND"
    );
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "APPROVER" && el.transactionType.toUpperCase() === "BOND"
    );
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

}

  showModal = () => {
    this.setState({ showm: true,
                    modalmsg: "This action is irreversible. Do you want to remove all the Bonds?", 
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

    const { searchName, bond, currentUser } = this.state;

    return (
      <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>Deployed Bond { (this.state.isMaker? "(Maker)" : (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null))) }</strong>
            </h3>
          </header>

        </div>: null}

          <div className="list row">
            <div className="col-md-8">
            {
              // (bond.length > 0) ?
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
                {(bond.length > 0)?
                <tr>
                  <th>Bond Name</th>
                  <th>Token Name</th>
                  <th>Cash Token</th>
                  <th>Blockchain</th>
                  <th>Issue Date</th>
                  <th>Maturity Date</th>
                  <th>Issuer</th>
                  <th>Total Issue Size</th>
                  <th>Bond Smart Contract</th>
                  <th>Cash Token Smart Contract</th>
                  <th>View Bond</th>
                  <th>View on Blockchain explorer</th>
                  <th>Issuer Fund Coupon</th>
                  <th>Action</th>
{/*
                  <th>Action</th>
                  <th>Transfer</th>
*/}
                </tr>
                : null}
                {bond && bond.length > 0 &&
                  bond.map((bond1, index) => (
                    <tr>
                      <td>{bond1.name}</td>
                      <td>{bond1.tokenname}</td>
                      <td>{
                            (
                              bond1.campaign &&
                                bond1.campaign.tokenname !== undefined)
                              ? bond1.campaign.tokenname  :null
                        
                          }
                      </td>
                      <td>{(() => {
                          switch (bond1.campaign.blockchain) {
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
                      <td>{bond1.issuedate}</td>
                      <td>{bond1.maturitydate}</td>
                      <td>
                          {
                            (
                              bond1.recipient &&
                               bond1.recipient.name !== undefined)
                              ? bond1.recipient.name  :null
                          }
                      </td>
                      <td>{bond1.totalsupply}</td>
                      <td>{
                            (bond1.smartcontractaddress !== undefined && typeof bond1.smartcontractaddress === "string")? this.shorten(bond1.smartcontractaddress): null
                          }
                      </td>
                      <td>{
                            (
                              bond1.campaign &&
                                bond1.campaign.smartcontractaddress !== undefined && typeof bond1.campaign.smartcontractaddress === "string")
                              ? this.shorten(bond1.campaign.smartcontractaddress)  :null
                          }
                      </td>
                      <td>
                            <Link
                              to={"/bondcheckapprove/" + bond1.draftbondid}
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
                          switch (bond1.campaign.blockchain) {
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
                        +bond1.smartcontractaddress} target="_blank" rel="noreferrer">View <i className='bx bx-link-external'></i></a>
                      </td>
                      <td>
                        <a href={window.location.origin + "/bondcouponallowance/" + bond1.id} target="_blank" rel="noreferrer">Issuer Set Fund Pull <i className='bx bx-link-external'></i></a>
                      </td>
                      <td>
                        <Link
                          to={"/bondcoupontrigger/" + bond1.id}
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
                           {this.state.isMaker? "Bond transfer" : ""}
                        </Link>
                      </td>
*/}
                    </tr>
                  ))}
              </table>

              {
              this.state.isMaker? 
                <Link
                  to={"/bondcheckapprove/0/"}
                >
                  <button
                    className="m-3 btn btn-sm btn-primary"
                  >
                    Create Bond
                  </button>
                </Link>

              : null
              }
              { 
              this.state.isMaker && (bond.length > 0) ? 
                <Link
                  to={"/transfercheckapprove/0/"}
                >
                  <button
                    className="m-3 btn btn-sm btn-primary"
                  >
                    Transfer Bond
                  </button>
                </Link>

              : null 
            /*
              this.state.isMaker && (bond.length > 0) ? 
                <button className="m-3 btn btn-sm btn-danger" onClick={this.showModal}>
                  Remove All
                </button>
              : null 
              */
              }
              <br/>

              <Modal showm={this.state.showm} handleProceed1={this.removeAllBond} handleCancel={this.hideModal} handleProceed2={null} button1text={this.state.button1text} button2text={this.state.button2text} button0text={this.state.button0text}>
                {this.state.modalmsg}
              </Modal>
            </div>
          </div>
      </div>

    );
  }
}


  
