import React, { Component } from "react";
import TransferDataService from "../services/transfer.service";
import { Link, Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';

export default class TransferList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchName = this.onChangeSearchName.bind(this);
    this.retrieveTransfers = this.retrieveTransfers.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveTransfer = this.setActiveTransfer.bind(this);
    this.removeAllTransfers = this.removeAllTransfers.bind(this);
    this.searchName = this.searchName.bind(this);

    this.state = {
      transferList: [],
      currentTransfer: null,
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

  retrieveTransfers() {
    TransferDataService.findAllTransfers()
      .then(response => {
        this.setState({
          transferList: response.data
        });
        console.log("retrieveTransfers:",response.data);
//        console.log("Transfers.campaign.name:",(typeof(response.data)!=="undefined"?response.data[0].campaign.name:null));
        console.log("Transfers.length:",response.data.length);
      })
      .catch(e => {
        console.log(e);
      });
  }

  refreshList() {
    this.retrieveTransfers();
    this.setState({
      currentTransfer: null,
      currentIndex: -1
    });
  }

  setActiveTransfer(transfer, index) {
    this.setState({
      currentTransfer: transfer,
      currentIndex: index
    });
  }

  removeAllTransfers() {
    TransferDataService.deleteAll()
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
      currentTransfer: null,
      currentIndex: -1
    });

    TransferDataService.findByName(this.state.searchName)
      .then(response => {
        this.setState({
          transferList: response.data
        });
        console.log(response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user) this.setState({ redirect: "/login" });
    this.setState({ currentUser: user, userReady: true })

    this.retrieveTransfers();

    let ismaker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "MAKER" && el.transactionType.toUpperCase() === "TRANSFER"
    );
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "CHECKER" && el.transactionType.toUpperCase() === "TRANSFER"
    );
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "APPROVER" && el.transactionType.toUpperCase() === "TRANSFER"
    );
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

  }

  showModal = () => {
    this.setState({ showm: true,
                    modalmsg: "This action is irreversible. Do you want to remove all the transfers?", 
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

    const { searchName, transferList, currentUser } = this.state;
    var url ="";
    var blockchainname ="";
    return (
      <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>Transferred Tokens { (this.state.isMaker? "(Maker)" : (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null))) }</strong>
            </h3>
          </header>

        </div>: null}

          <div className="list row">
            <div className="col-md-8">
            {(transferList.length > 0)?
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
              : null}
            </div>
            <div className="col-md-8">

              <table style={{ border:"1px solid"}}>
                {(typeof(transferList)!=="undefined" && transferList!==null && transferList.length > 0)?
                <tr>
                  <th>Campaign</th>
                  <th>Token Name</th>
                  <th>Blockchain</th>
                  <th>Transfered</th>
                  <th>Recipient Wallet</th>
                  <th>Smart Contract</th>
                  <th>View Txn on Blockchain</th>
                  <th>Token Holders</th>
                </tr>
                : null}
                {
                transferList && transferList.length>0 &&
                  transferList.map((mmm, index) => (
                    <tr>
                      <td>
                              {mmm.campaign && mmm.campaign.name ? mmm.campaign.name :
                              mmm.bond && mmm.bond.name ? mmm.bond.name :
                              mmm.pbm && mmm.pbm.name ? mmm.pbm.name : null}
                      </td>
                      <td>
                              {mmm.campaign && mmm.campaign.tokenname ? mmm.campaign.tokenname :
                              mmm.bond && mmm.bond.tokenname ? mmm.bond.tokenname :
                              mmm.pbm && mmm.pbm.tokenname ? mmm.pbm.tokenname : null}
                      </td>
                      <td>
                        { (() => {
                          switch (
                              (mmm.campaign && mmm.campaign.blockchain) ? mmm.campaign.blockchain :
                              (mmm.bond && mmm.bond.blockchain) ? mmm.bond.blockchain :
                              (mmm.pbm && mmm.pbm.blockchain) ? mmm.pbm.blockchain : null
                            ) {
                            case 80001:
                              blockchainname = 'Polygon Testnet Mumbai (Deprecated)';
                              url =  'mumbai.polygonscan.com/address/'; 
                              break;
                            case 80002:
                              blockchainname = 'Polygon Testnet Amoy';
                              url = 'amoy.polygonscan.com/address/';
                              break;
                            case 11155111:
                              blockchainname = 'Ethereum Testnet Sepolia';
                              url = 'sepolia.etherscan.io/address/';
                              break;
                            case 43113:
                              blockchainname = 'Avalanche Testnet Fuji';
                              url = 'fuji.avascan.info/blockchain/all/address/';
                              break;
                            case 137:
                              blockchainname = 'Polygon Mainnet';
                              url = 'polygonscan.com/address/';
                              break;
                            case 1:
                              blockchainname = 'Ethereum  Mainnet';
                              url = 'etherscan.io/address/';
                              break;
                            case 43114:
                              blockchainname = 'Avalanche Mainnet';
                              url = 'avascan.info/blockchain/all/address/';
                              break;
                            default:
                              blockchainname = null;
                              url = null;
                          }
                          })()
                        }
                        {blockchainname}
                      </td>
                      <td>{mmm.totalTransfered}</td>
                      <td>{this.shorten(mmm.recipientwallet)}</td>
                      <td>
                          {this.shorten(mmm.campaign && mmm.campaign.smartcontractaddress ? mmm.campaign.smartcontractaddress : 
                          mmm.bond && mmm.bond.smartcontractaddress ? mmm.bond.smartcontractaddress : 
                          mmm.pbm && mmm.pbm.smartcontractaddress ? mmm.pbm.smartcontractaddress : 
                          null)}                      
                      </td>
                      <td>
                        <a href={"https://" + url + 
                        (
                          mmm.campaign && mmm.campaign.smartcontractaddress ? mmm.campaign.smartcontractaddress : 
                          mmm.bond && mmm.bond.smartcontractaddress ? mmm.bond.smartcontractaddress : 
                          mmm.pbm && mmm.pbm.smartcontractaddress ? mmm.pbm.smartcontractaddress : 
                          null
                        )
                        } target="_blank" rel="noreferrer">View <i className='bx bx-link-external'></i></a>
                      </td>
                      <td>
                        <a href={"https://" + url + 
                        (
                          mmm.campaign && mmm.campaign.smartcontractaddress ? mmm.campaign.smartcontractaddress : 
                          mmm.bond && mmm.bond.smartcontractaddress ? mmm.bond.smartcontractaddress : 
                          mmm.pbm && mmm.pbm.smartcontractaddress ? mmm.pbm.smartcontractaddress : 
                          null
                        )
                        +"#balances"} target="_blank" rel="noreferrer">View <i className='bx bx-link-external'></i></a>
                      </td>                    
                    </tr>
                  ))}
              </table>

              {
              this.state.isMaker? 
              <Link
                to={"/transfercheckapprove/0"}
              >
                <button
                  className="m-3 btn btn-sm btn-primary"
                >
                  Transfer Tokens
                </button>
              </Link>
              :null}
              { 
              /*
              (transferList.length > 0) ? 
                <button className="m-3 btn btn-sm btn-danger" onClick={this.showModal}>
                  Remove All
                </button>
              : null 
              */
              }
              <br/>

              <Modal showm={this.state.showm} handleProceed1={this.removeAllTransfers} handleCancel={this.hideModal} handleProceed2={null} button1text={this.state.button1text} button2text={this.state.button2text} button0text={this.state.button0text}>
                {this.state.modalmsg}
              </Modal>
            </div>
          </div>
      </div>

    );
  }
}


  
