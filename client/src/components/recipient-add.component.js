import React, { Component } from "react";
import { Link } from "react-router-dom";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";


export default class RecipientAdd extends Component {
  constructor(props) {
    super(props);
    /*
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    */
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeWalletAddress = this.onChangeWalletAddress.bind(this);
    this.onChangeBank = this.onChangeBank.bind(this);
    this.onChangeBankaccount = this.onChangeBankaccount.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);

    this.saveRecipient = this.saveRecipient.bind(this);
    this.newRecipient = this.newRecipient.bind(this);

    this.state = {

      checkerList: {
        id: null,
        username: "",
      },
      approverList: {
        id: null,
        username: "",
      },

      name: "",
      walletaddress: "",
      bank: "",
      bankaccount: "",
      type: "",

      currentUser: undefined,
      isMaker: false,
      isChecker: false,
      isApprover: false,

      actionby: undefined,
      maker: "",
      checker: "",
      approver: "",
      err: "",
      datachanged: false,
      submitted: false,
      isLoading: false,

      modal: {
        showm: false,
        modalmsg: "",
        button1text: undefined,
        button2text: undefined,
        button3text: undefined,
        button0text: undefined,
      }
    };
  }

  onChangeName(e) {
    this.setState({
      name: e.target.value,
      datachanged: true
    });
  }

  onChangeWalletAddress(e) {
    this.setState({
      walletaddress: e.target.value,
      datachanged: true
    });
  }

  onChangeBank(e) {
    this.setState({
      bank: e.target.value,
      datachanged: true
    });
  }

  onChangeBankaccount(e) {
    this.setState({
      bankaccount: e.target.value,
      datachanged: true
    });
  }

  onChangeChecker(e) {
    //console.log("currentUser:", this.state.currentUser)
    this.setState({
      checker: e.target.value,
      datachanged: true
    });
  }

  onChangeApprover(e) {
    this.setState({
      approver: e.target.value,
      datachanged: true
    });
  }

  displayModal(msg, b1text, b2text, b3text, b0text) {
    this.setState({
      showm: true, 
      modalmsg: msg, 
      button1text: b1text,
      button2text: b2text,
      button3text: b3text,
      button0text: b0text,
    });
  }
  
  async validateForm() {    
    var err = "";

    if (this.state.name === "") {
      err += "- Name cannot be empty\n" 
    }
    if (this.state.walletaddress === "") {
      err += "- Wallet Address cannot be empty\n" 
    }
    if (this.state.bank === "") {
      err += "- Bank cannot be empty\n" 
    }
    if (this.state.bankaccount === "") {
      err += "- Bank Account Number cannot be empty\n" 
    }

    if (this.state.checker===null || this.state.checker === "") err += "- Checker cannot be empty\n";
    if (this.state.approver===null || this.state.approver === "") err += "- Approver cannot be empty\n";

    if(this.state.checker === this.state.currentUser.id.toString() && this.state.approver === this.state.currentUser.id.toString()) {
      err += "- Maker, Checker and Approver cannot be the same person\n";
    } else {
      if (this.state.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
      if (this.state.checker!==null && this.state.checker!=="" 
          && this.state.checker === this.state.approver) err += "- Checker and Approver cannot be the same person\n";
    }



    if (err !== '') {
      err = "Form validation issues found:\n"+err;
      this.displayModal(err, null, null, null, "OK");

      err = ""; // clear var

      return false;
    }
    return true;
  }

  async saveRecipient() {
    if (this.state.isMaker) {  // only for Makers
      var data = {
        name                  : this.state.name,
        walletaddress         : this.state.walletaddress,
        bank                  : this.state.bank,
        bankaccount           : this.state.bankaccount,
        type                  : 0,
        txntype               : 0,    // create
        actionby              : this.state.currentUser.username,
        maker                 :  this.state.currentUser.id,
        checker               : this.state.checker,
        approver              : this.state.approver,
      };

      if (await this.validateForm() === true) { 
        console.log("Form Validation passed! creating recipient...");
        //alert("Form validation passed! creating recipient...");

        console.log("IsLoad=true");
        this.show_loading();  // show progress

        await RecipientDataService.draftCreate(data)
        .then(response => {
          console.log("Response: ", response);
          this.hide_loading();  // hide progress

          console.log("IsLoad=false");

          this.setState({
            id                    : response.data.id,
            name                  : this.state.name,
            walletaddress         : this.state.walletaddress,
            bank                  : this.state.bank,
            bankaccount           : this.state.bankaccount,
    
            submitted: true,
          });
          //console.log("Responseeeee"+response.data);
          this.displayModal("Recipienting request submitted for review", "OK", null, null, null);

        })
        .catch(e => {
          this.hide_loading();  // hide progress

          console.log("Error: ",e);
          console.log("Response error:",e.response.data.message);
          if (e.response.data.message !==null && e.response.data.message !== "") 
            this.displayModal("Error: "+e.response.data.message+".\n\nPlease contact tech support.", null, null, null, "OK");
          else
            this.displayModal("Error: "+e.message+".\n\nPlease contact tech support.", null, null, null, "OK");

        });
      } else {
        this.hide_loading();  // hide progress

        console.log("Form Validation failed >>>");
        //alert("Form Validation failed >>>");
      }
    }
  }

  newRecipient() {
    this.setState({
      name: "",
      walletaddress: "",
      bank: "",
      bankaccount: "",
      type: "",
      currentUser: undefined,
      actionby: undefined,
      datachanged: false,
      submitted: false
    });
  }


  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("recipient")
      .then(response => {
        console.log("Data received by getAllCheckerApprovers:", response.data);
        let chkList = response.data.find((element) => {
          //var el_id = element.id;                       console.log("typeof(el_id)", typeof(el_id));
          //console.log("element.name:", element.name);   console.log("typeof(element.name)", typeof(element.name));
          try {
            if (element.name.toUpperCase() === "CHECKER") 
              return element;
          } catch(e) {
            // do nothing, sometime when recipientList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
          }
          return null;
        });
        let apprList = response.data.find((element) => {
          //var el_id = element.id;                       console.log("typeof(el_id)", typeof(el_id));
          //console.log("element.name:", element.name);   console.log("typeof(element.name)", typeof(element.name));
          try {
            if (element.name.toUpperCase() === "APPROVER") 
              return element;
          } catch(e) {
            // do nothing, sometime when recipientList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
          }
          return null;
        });

        var first_array_record = [  // add 1 empty record to front of array which is the option list
          { }
        ];
        this.setState({
          checkerList: [first_array_record].concat(chkList.user),
          approverList: [first_array_record].concat(apprList.user)
        });
        console.log("checkerList: ",chkList.user);
        console.log("approverList: ",apprList.user);
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user) this.setState({ redirect: "/login" });
    this.setState({ currentUser: user, actionby:user.username, userReady: true })

    let ismaker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "MAKER"
    );
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "CHECKER"
    );
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => 
    el.opsrole.name.toUpperCase() === "APPROVER"
    );
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

    this.retrieveAllMakersCheckersApprovers();

  }

  show_loading() {  // show progress
    this.setState({isLoading: true});
  }
  hide_loading(){  // hide progress
    this.setState({isLoading: false});
  }

  showModal_Leave = () => {
    this.displayModal("You have made changes. Are you sure you want to leave this page without submitting?",
                      "Yes, leave", null, null, "Cancel");
  };

  hideModal = () => {
    this.setState({ showm: false });
  };

  render() {
    const { checkerList, approverList } = this.state;

    return (
      <div className="container">
      {(this.state.userReady) ?
        <div>
        <header className="jumbotron col-md-8">
          <h3>
            <strong>Add Recipient / Sponsor ({ (this.state.isMaker? "Maker" : (this.state.isChecker? "Checker": (this.state.isApprover? "Approver":null)) )})</strong>
          </h3>
        </header>

        </div>: null}

          <div className="submit-form list-row">

            <div className="col-md-8">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                   required
                    onChange={this.onChangeName}
                    autoComplete="off"
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">Wallet Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="walletaddress"
                   required
                    onChange={this.onChangeWalletAddress}
                    autoComplete="off"
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">Bank *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="bank"
                   required
                    onChange={this.onChangeBank}
                    autoComplete="off"
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">Bank Account Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="bankaccount"
                    required
                    onChange={this.onChangeBankaccount}
                    autoComplete="off"
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="checker">Checker *</label>
                  <select
                        onChange={this.onChangeChecker}                         
                        className="form-control"
                        id="checker"
                        disabled={!this.state.isMaker}
                      >
                        {
                          Array.isArray(checkerList) ?
                            checkerList.map( (d) => {
                              return <option value={d.id}>{d.username}</option>
                            })
                          : null
                        }
                      </select>
                </div>

                <div className="form-group">
                <label htmlFor="approver">Approver *</label>
                <select
                      onChange={this.onChangeApprover}                         
                      className="form-control"
                      id="approver"
                      disabled={!this.state.isMaker}
                    >
                      {
                        Array.isArray(approverList) ?
                        approverList.map( (d) => {
                            return <option value={d.id}>{d.username}</option>
                          })
                        : null
                      }
                    </select>
                </div>
                {
                  (this.state.isMaker)?
                    <button onClick={this.saveRecipient} className="btn btn-primary">
                      Submit Request
                    </button>
                    :null
                }

                { 
                  (this.state.isMaker)? (
                    (this.state.datachanged) ? 
                    <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>
                      Cancel
                    </button>
                    : 
                    <Link to="/recipient">
                    <button className="m-3 btn btn-sm btn-secondary">
                      Cancel
                    </button>
                    </Link>
                    )
                  : 
                  <Link to="/recipient">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Back
                  </button>
                  </Link>
                }
                  {this.state.isLoading ? <LoadingSpinner /> : null}

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/recipient'} handleProceed2={null} handleProceed3={null} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                    {this.state.modalmsg}
                  </Modal>

                  <p>{this.state.message}</p>

              </div>
          </div>
      </div>
    );
  }
}
