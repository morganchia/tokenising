import React, { Component } from "react";
import RepoDataService from "../services/repo.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { Link, Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';

export default class RepoList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchName = this.onChangeSearchName.bind(this);
    this.retrieveRepo = this.retrieveRepo.bind(this);
//    this.retrieveOpsRole = this.retrieveOpsRole.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveRepo = this.setActiveRepo.bind(this);
    this.removeAllRepo = this.removeAllRepo.bind(this);
    this.searchName = this.searchName.bind(this);

    this.state = {
      repo: [],
      opsRoles: [],
      currentRepo: null,
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

  retrieveRepo() {
    RepoDataService.getAll()
      .then(response => {
        this.setState({
          repo: response.data
        });
        console.log("Response data from retrieveRepo() RepoDataService.getAll:", response.data);
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
              // do nothing, sometime when repoList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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
    this.retrieveRepo();
    this.setState({
      currentRepo: null,
      currentIndex: -1
    });
  }

  setActiveRepo(repo, index) {
    this.setState({
      currentRepo: repo,
      currentIndex: index
    });
  }

  removeAllRepo() {
    RepoDataService.deleteAll()
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
      currentRepo: null,
      currentIndex: -1
    });

    RepoDataService.findByName(this.state.searchName)
      .then(response => {
        this.setState({
          repo: response.data
        });
        console.log("RepoDataService.findByName",response.data);
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
    this.retrieveRepo();
//    this.retrieveOpsRole(currentUser.id);

    let ismaker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "MAKER" && el.transactionType.toUpperCase() === "REPO"
    );
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "CHECKER" && el.transactionType.toUpperCase() === "REPO"
    );
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "APPROVER" && el.transactionType.toUpperCase() === "REPO"
    );
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

}

  showModal = () => {
    this.setState({ showm: true,
                    modalmsg: "This action is irreversible. Do you want to remove all the Repos?", 
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

  SGTConverter = (datetime1, formatType = 'datetime') => {
    const formatter = new Intl.DateTimeFormat('en-SG', {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date(datetime1));
    const getPart = (type) => parts.find(p => p.type === type)?.value;

    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = getPart('hour');
    const minute = getPart('minute');

    if (formatType === 'date') return `${year}-${month}-${day}`;
    if (formatType === 'time') return `${hour}:${minute}`;
    return `${year}-${month}-${day} ${hour}:${minute}`; // default: datetime
  };



  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { searchName, repo, currentUser } = this.state;
    if (repo && repo.length > 0) {
      repo.forEach((repo1, index) => {
        console.log("Repo UTC startdatetime:", repo1.startdatetime);
        console.log("Repo UTC enddatetime:", repo1.enddatetime);
        console.log("Repo SGT startdatetime:", this.SGTConverter(repo1.startdatetime));
        console.log("Repo SGT enddatetime:", this.SGTConverter(repo1.enddatetime));
      });
    }

    return (
      <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>Deployed Repo { (this.state.isMaker? "(Maker)" : (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null))) }</strong>
            </h3>
          </header>

        </div>: null}

          <div className="list row">
            <div className="col-md-8">
            {
              // (repo.length > 0) ?
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
                {(repo.length > 0)?
                <tr>
                  <th style={{whiteSpace: "nowrap"}}>Repo Name</th>
                  <th>Counter Party 1</th>
                  <th>Counter Party 2</th>
{/*
                  <th>Token 1</th>
                  <th>Token 2</th>
*/}
                  <th>Amount 1</th>
                  <th>Amount 2</th>
                  <th>Smart Contract Address</th>
                  <th>Blockchain</th>
                  <th style={{whiteSpace: "nowrap"}}>Start Date</th>
                  <th style={{whiteSpace: "nowrap"}}>Maturity Date</th>
                  <th>View Details</th>
                  <th>View on Block Explorer</th>
                  <th>Counterparties Set Allowance</th>
                  <th>Action</th>
                </tr>
                : null}
                {repo && repo.length > 0 &&
                  repo.map((repo1, index) => (
                    <tr>
                      <td>{repo1.name}</td>
                      <td>{this.shorten(repo1.counterparty1)}</td>
                      <td>{this.shorten(repo1.counterparty2)}</td>
{/*
                      <td>{repo1.counterparty1name}</td>
                      <td>{repo1.counterparty2name}</td>
                      <td>{repo1.Token1name}</td>
                      <td>{repo1.Token2name}</td>
*/}
                      <td>{repo1.amount1.toLocaleString("en-US")}</td>
                      <td>{repo1.amount2.toLocaleString("en-US")}</td>
                      <td>{this.shorten(repo1.smartcontractaddress)}</td>
                      <td>{(() => {
                          switch (repo1.blockchain) {
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
                      <td style={{whiteSpace: "nowrap"}}>{(repo1.startdatetime.split("T")[0] !== repo1.enddatetime.split("T")[0] ? this.SGTConverter(repo1.startdatetime, "date") : this.SGTConverter(repo1.startdatetime))}</td>
                      <td style={{whiteSpace: "nowrap"}}>{(repo1.startdatetime.split("T")[0] !== repo1.enddatetime.split("T")[0] ? this.SGTConverter(repo1.enddatetime, "date") : this.SGTConverter(repo1.enddatetime))}</td>
                      <td>
                            <Link
                              to={"/repocheckapprove/" + repo1.draftrepoid}
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
                          switch (repo1.blockchain) {
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
                        +repo1.smartcontractaddress} target="_blank" rel="noreferrer">View <i className='bx bx-link-external'></i></a>
                      </td>
                      <td>
                        <a href={window.location.origin + "/reposetallowance/" + repo1.id} target="_blank" rel="noreferrer">Set Allowance <i className='bx bx-link-external'></i></a>
                      </td>
                      <td>
                        <Link
                          to={"/repotransact/" + repo1.draftrepoid}
                          className="badge badge-warning"
                        >
                           {
                           //this.state.isMaker? "Edit / Delete" : "View"}
                           this.state.isMaker? "Trigger Repo" : ""
                           }
                        </Link>
                      </td>
                    </tr>
                  ))}
              </table>

              {
              this.state.isMaker? 
                <Link
                  to={"/repocheckapprove/0/"}
                >
                  <button
                    className="m-3 btn btn-sm btn-primary"
                  >
                    Create Repo
                  </button>
                </Link>
              : null
              }
              {
              this.state.isMaker? 
                <Link
                  to={"/repotrademanager/0"}
                >
                  <button
                    className="m-3 btn btn-sm btn-primary"
                  >
                    Interact with Repo
                  </button>
                </Link>
              : null
              }

              { 
              /*
              this.state.isMaker && (repo.length > 0) ? 
                <button className="m-3 btn btn-sm btn-danger" onClick={this.showModal}>
                  Remove All
                </button>
              : null 
              */
              }
              <br/><br/>

              <Modal showm={this.state.showm} handleProceed1={this.removeAllRepo} handleCancel={this.hideModal} handleProceed2={null} button1text={this.state.button1text} button2text={this.state.button2text} button0text={this.state.button0text}>
                {this.state.modalmsg}
              </Modal>
            </div>
          </div>
      </div>

    );
  }
}
