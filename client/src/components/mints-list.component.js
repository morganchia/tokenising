import React, { Component } from "react";
import MintDataService from "../services/mint.service";
import { Link, Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';

export default class MintList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchName = this.onChangeSearchName.bind(this);
    this.retrieveMints = this.retrieveMints.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveMint = this.setActiveMint.bind(this);
    this.removeAllMints = this.removeAllMints.bind(this);
    this.searchName = this.searchName.bind(this);

    this.state = {
      mints: [],
      currentMint: null,
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

  retrieveMints() {
    MintDataService.findAllMints()
      .then(response => {
        this.setState({
          mints: response.data
        });
        console.log("retrieveMints:",response.data);
        console.log("Mints.campaign.name:",(typeof(mints)!=="undefined"?response.data[0].campaign.name:null));
        console.log("Mints.length:",response.data.length);
      })
      .catch(e => {
        console.log(e);
      });
  }

  refreshList() {
    this.retrieveMints();
    this.setState({
      currentMint: null,
      currentIndex: -1
    });
  }

  setActiveMint(mint, index) {
    this.setState({
      currentMint: mint,
      currentIndex: index
    });
  }

  removeAllMints() {
    MintDataService.deleteAll()
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
      currentMint: null,
      currentIndex: -1
    });

    MintDataService.findByName(this.state.searchName)
      .then(response => {
        this.setState({
          mints: response.data
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

    this.retrieveMints();

    let ismaker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "MAKER" && el.transactionType.toUpperCase() === "MINT"
    );
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "CHECKER" && el.transactionType.toUpperCase() === "MINT"
    );
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "APPROVER" && el.transactionType.toUpperCase() === "MINT"
    );
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

  }

  showModal = () => {
    this.setState({ showm: true,
                    modalmsg: "This action is irreversible. Do you want to remove all the mints?", 
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

    const { searchName, mints, currentUser } = this.state;

    return (
      <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>Minted Tokens { (this.state.isMaker? "(Maker)" : (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null))) }</strong>
            </h3>
          </header>

        </div>: null}

          <div className="list row">
            <div className="col-md-8">
            {(mints.length > 0)?
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
                {(typeof(this.state.mints)!=="undefined" && this.state.mints!==null && this.state.mints.length > 0)?
                <tr>
                  <th>Campaign</th>
                  <th>Token</th>
                  <th>Blockchain</th>
                  <th>Minted</th>
                  <th>Total Supply</th>
                  <th>Smart Contract</th>
                  <th>View Txn on Blockchain</th>
                  <th>Token Holders</th>
                </tr>
                : null}
                {
                this.state.mints && this.state.mints.length>0 &&
                  this.state.mints.map((mmm, index) => (
                    (mmm.campaign!==null && mmm.campaign.name!==null)?
                    <tr>
                      <td>{mmm.campaign.name}</td>
                      <td>{mmm.campaign.tokenname}</td>
                      <td>Polygon Testnet</td>
                      <td>{mmm.totalMinted}</td>
                      <td>{mmm.campaign.amount}</td>
                      <td>{this.shorten(mmm.campaign.smartcontractaddress)}</td>
                      <td><a href={"https://mumbai.polygonscan.com/address/"+mmm.campaign.smartcontractaddress} target="_blank" rel="noreferrer">View <i className='bx bx-link-external'></i></a></td>
                      <td><a href={"https://mumbai.polygonscan.com/token/"+mmm.campaign.smartcontractaddress+"#balances"} target="_blank" rel="noreferrer">View <i className='bx bx-link-external'></i></a></td>                    
                    </tr>
                    :null
                  ))}
              </table>

              {
              this.state.isMaker? 
              <Link
                to={"/mintadd/"}
              >
                <button
                  className="m-3 btn btn-sm btn-primary"
                >
                  Mint Tokens
                </button>
              </Link>
              :null}
              { 
              /*
              (mints.length > 0) ? 
                <button className="m-3 btn btn-sm btn-danger" onClick={this.showModal}>
                  Remove All
                </button>
              : null 
              */
              }

              <Modal showm={this.state.showm} handleProceed1={this.removeAllMints} handleCancel={this.hideModal} handleProceed2={null} button1text={this.state.button1text} button2text={this.state.button2text} button0text={this.state.button0text}>
                {this.state.modalmsg}
              </Modal>
            </div>
          </div>
      </div>

    );
  }
}


  
