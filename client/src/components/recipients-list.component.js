import React, { Component } from "react";
import RecipientDataService from "../services/recipient.service";
import { Link, Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';

export default class RecipientList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchName = this.onChangeSearchName.bind(this);
    this.retrieveRecipients = this.retrieveRecipients.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveRecipient = this.setActiveRecipient.bind(this);
    this.removeAllRecipients = this.removeAllRecipients.bind(this);
    this.searchName = this.searchName.bind(this);

    this.state = {
      recipients: [],
      currentRecipient: null,
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

  retrieveRecipients() {
    RecipientDataService.findAllRecipients()
      .then(response => {
        this.setState({
          recipients: response.data
        });
        console.log("retrieveRecipients:",response.data);
        console.log("Recipients.campaign.name:",(typeof(recipients)!=="undefined"?response.data[0].campaign.name:null));
        console.log("Recipients.length:",response.data.length);
      })
      .catch(e => {
        console.log(e);
      });
  }

  refreshList() {
    this.retrieveRecipients();
    this.setState({
      currentRecipient: null,
      currentIndex: -1
    });
  }

  setActiveRecipient(recipient, index) {
    this.setState({
      currentRecipient: recipient,
      currentIndex: index
    });
  }

  removeAllRecipients() {
    RecipientDataService.deleteAll()
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
      currentRecipient: null,
      currentIndex: -1
    });

    RecipientDataService.findByName(this.state.searchName)
      .then(response => {
        this.setState({
          recipients: response.data
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

    this.retrieveRecipients();

    let ismaker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "MAKER" && el.transactionType.toUpperCase() === "RECIPIENT"
    );
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "CHECKER" && el.transactionType.toUpperCase() === "RECIPIENT"
    );
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "APPROVER" && el.transactionType.toUpperCase() === "RECIPIENT"
    );
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

  }

  showModal = () => {
    this.setState({ showm: true,
                    modalmsg: "This action is irreversible. Do you want to remove all the recipients?", 
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

    const { searchName, recipients, currentUser } = this.state;

    return (
      <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>Approved Recipients { (this.state.isMaker? "(Maker)" : (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null))) }</strong>
            </h3>
          </header>

        </div>: null}

          <div className="list row">
            <div className="col-md-8">
            {(recipients.length > 0)?
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
                {(typeof(this.state.recipients)!=="undefined" && this.state.recipients!==null && this.state.recipients.length > 0)?
                <tr>
                  <th>Name</th>
                  <th>Wallet</th>
                  <th>Bank</th>
                  <th>Bank Account</th>
                </tr>
                : null}
                {
                this.state.recipients && this.state.recipients.length>0 &&
                  this.state.recipients.map((mmm, index) => (
                    (mmm.name!==null)?
                    <tr>
                      <td>{mmm.name}</td>
                      <td>{mmm.walletaddress}</td>
                      <td>{mmm.bank}</td>
                      <td>{mmm.bankaccount}</td>
                    </tr>
                    :null
                  ))}
              </table>

              {
              this.state.isMaker? 
              <Link
                to={"/recipientadd/"}
              >
                <button
                  className="m-3 btn btn-sm btn-primary"
                >
                  Add Recipient
                </button>
              </Link>
              :null}
              { 
              /*
              (recipients.length > 0) ? 
                <button className="m-3 btn btn-sm btn-danger" onClick={this.showModal}>
                  Remove All
                </button>
              : null 
              */
              }

              <Modal showm={this.state.showm} handleProceed1={this.removeAllRecipients} handleCancel={this.hideModal} handleProceed2={null} button1text={this.state.button1text} button2text={this.state.button2text} button0text={this.state.button0text}>
                {this.state.modalmsg}
              </Modal>
            </div>
          </div>
      </div>

    );
  }
}


  
