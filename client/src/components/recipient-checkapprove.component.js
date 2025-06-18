import React, { Component } from "react";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { withRouter } from '../common/with-router';
import AuthService from "../services/auth.service";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";

class Recipient extends Component {
  constructor(props) {
    super(props);
    /*
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeTokenName = this.onChangeTokenName.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.onChangeSponsor = this.onChangeSponsor.bind(this);
    */
    this.onChangeAmount = this.onChangeAmount.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.onChangeCheckerComments = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
    this.getRecipient = this.getRecipient.bind(this);
    this.submitRecipient = this.submitRecipient.bind(this);
    this.acceptRecipient = this.acceptRecipient.bind(this);
    this.approveRecipient = this.approveRecipient.bind(this);
    this.rejectRecipient = this.rejectRecipient.bind(this);
    this.deleteRecipient = this.deleteRecipient.bind(this);
    this.showModal_Leave = this.showModal_Leave.bind(this);
    this.dropRequest = this.dropRequest.bind(this);

    this.showModal_dropRequest = this.showModal_dropRequest.bind(this);

  //  this.showModal_nochange = this.showModal_nochange.bind(this);
  //  this.showModalDelete = this.showModalDelete.bind(this);
    this.hideModal = this.hideModal.bind(this);

    this.state = {      
      recipient: {
        id: null,
        name: "",
        walletaddress: "",
        bank: "",
        bankaccount: "",
        type: ""
      },

      currentRecipient: {
        id: null,
        bank: "",
        bankaccount: "",
        walletaddress: "",
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedrecipientid: null,
        actionby: "",
      },

      checkerList: {
        id: null,
        username: "",
      },
      approverList: {
        id: null,
        username: "",
      },

      option1 : undefined,
      currentUser: undefined,
      isMaker: false,
      isChecker: false,
      isApprover: false,
      isNewRecipient: null,
      
      err: "",
      datachanged: false,
      message: "",
      txnstatus: "",
      isLoading: false,

      modal: {
        showm: false,
        modalmsg: "",
        button1text: null,
        button2text: null,
        button3text: null,
        button0text: null,
        handleProceed1: undefined,
        handleProceed2: undefined,
        handleProceed3: undefined,
        handleCancel: undefined,
      }
    };
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

    if (!user) this.setState({ redirect: "/home" });
    this.setState({ currentUser: user, userReady: true })

    this.getRecipient(user, this.props.router.params.id);

    this.getAllSponsors();

    this.retrieveAllMakersCheckersApprovers();
  }

  onChangeAmount(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");  // remove . and other chars
    const amount = e.target.value;
    
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRecipient: {
        ...prevState.currentRecipient,
        recipientAmount: amount
      }
    }));
  }

  onChangeChecker(e) {
    const checker = e.target.value;
    /*
    this.setState({
      datachanged: true
    });
    */
    this.setState(prevState => ({
      currentRecipient: {
        ...prevState.currentRecipient,
        checker: checker
      }
    }));
  }

  onChangeCheckerComments(e) {
    const checkerComments = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentRecipient: {
          ...prevState.currentRecipient,
          checkerComments: checkerComments
        }
      };
    });
  }

  onChangeApprover(e) {
    const approver = e.target.value;
    /*
    this.setState({
      datachanged: true
    });
  */
    this.setState(prevState => ({
      currentRecipient: {
        ...prevState.currentRecipient,
        approver: approver
      }
    }));
  }

  onChangeApproverComments(e) {
    const approverComments = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentRecipient: {
          ...prevState.currentRecipient,
          approverComments: approverComments
        }
      };
    });
  }

  getRecipient(user, id) {
    console.log("+++ id:", id);

    if (id !== undefined) {
      RecipientDataService.getAllDraftsByRecipientId(id)
        .then(response => {
          response.data[0].actionby = user.username;
          this.setState({
            currentRecipient: response.data[0],
          });
          console.log("Response from getAllDraftsByRecipientId(id):",response.data[0]);

          let ismaker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "MAKER" && user.id === response.data[0].maker);
          console.log("isMaker:", (ismaker === undefined? false: true));
          this.setState({ isMaker: (ismaker === undefined? false: true),});
      
          let ischecker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "CHECKER" && user.id === response.data[0].checker);
          console.log("isChecker:", (ischecker === undefined? false: true));
          this.setState({ isChecker: (ischecker === undefined? false: true),});

          let isapprover= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "APPROVER" && user.id === response.data[0].approver);
          console.log("isApprover:", (isapprover === undefined? false: true));
          this.setState({ isApprover: (isapprover === undefined? false: true),});

          this.setState({ isNewRecipient : (response.data[0].smartcontractaddress === "" || response.data[0].smartcontractaddress === null) });
        })
        .catch(e => {
          console.log("Error from getAllDraftsByRecipientId(id):",e);
        });
    }
  }

  getAllSponsors() {
    RecipientDataService.findAllRecipients()
      .then(response => {

        this.setState({
            recipient: response.data
        });
      })
      .catch(e => {
        console.log(e);
        //return(null);
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

  if (this.state.currentRecipient.bank === "") {
    err += "- Bank cannot be empty\n";
  } 
  if (this.state.currentRecipient.bankaccount === "") 
    err += "- Account cannot be empty\n";
  if (this.state.currentRecipient.walletaddress === "") 
    err += "- Wallet address cannot be empty\n";

  if (this.state.currentRecipient.checker === "" || this.state.currentRecipient.checker === null) err += "- Checker cannot be empty\n";
  if (this.state.currentRecipient.approver === "" || this.state.currentRecipient.approver === null) err += "- Approver cannot be empty\n";
  if (this.state.currentRecipient.checker === this.state.currentUser.id.toString() 
      && this.state.currentRecipient.approver === this.state.currentUser.id.toString()) {
    err += "- Maker, Checker and Approver cannot be the same person\n";
  } else {
    if (this.state.currentRecipient.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
    if (this.state.currentRecipient.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
    if (this.state.currentRecipient.checker!==null && this.state.currentRecipient.checker!=="" 
          && this.state.currentRecipient.checker === this.state.currentRecipient.approver) err += "- Checker and Approver cannot be the same person\n";
  }

  if (err !=="" ) {
    err = "Form validation issues found:\n"+err;
    //alert(err);
    this.displayModal(err, null, null, null, "OK");
    err = ""; // clear var
    return false;
  }
  return true;
}

async submitRecipient() {
  
  if (await this.validateForm()) { 
        console.log("Form Validation passed");
  
        console.log("IsLoad=true");
        this.show_loading();
  
        await RecipientDataService.submitDraftById(
          this.state.currentRecipient.id,
          this.state.currentRecipient,
        )
        .then(response => {
          this.hide_loading();
  
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();
    
          this.setState({  
            datachanged: false,
          });
          this.displayModal("Request submitted. Routing to checker.", "OK", null, null, null);
        })
        .catch(e => {
          this.hide_loading();
  
          console.log(e);
          console.log(e.message);
          this.displayModal("Request submit failed.", null, null, null, "OK");
  
          try {
            console.log(e.response.data.message);
            // Need to check draft and approved recipient names
            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
              this.displayModal("The recipient submit failed. The new recipient name is already used, please use another name.", null, null, null, "OK");
            }
          } catch(e) {
            this.hide_loading();
  
            console.log("Error: ",e);
            console.log("Response error:",e.response.data.message);
            if (e.response.data.message !== "") 
              this.displayModal("Error: "+e.response.data.message+". Please contact tech support.", null, null, null, "OK");
            else
              this.displayModal("Error: "+e.message+". Please contact tech support.", null, null, null, "OK");
          } 
        });
  //    }
      this.hide_loading();
    }
  }
    
async acceptRecipient() {
  
//    if (await this.validateForm()) { 
//      console.log("Form Validation passed");

      console.log("IsLoad=true");
      this.show_loading();

      await RecipientDataService.acceptDraftById(
        this.state.currentRecipient.id,
        this.state.currentRecipient,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();
  
        this.setState({  
          datachanged: false,
        });
        this.displayModal("Recipient request accepted by checker, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Recipient request accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The recipient request accept failed. The new recipient name is already used, please use another name.", null, null, null, "OK");
          }
        } catch(e) {
          this.hide_loading();

          console.log("Error: ",e);
          console.log("Response error:",e.response.data.message);
          if (e.response.data.message !== "") 
            this.displayModal("Error: "+e.response.data.message+". Please contact tech support.", null, null, null, "OK");
          else
            this.displayModal("Error: "+e.message+". Please contact tech support.", null, null, null, "OK");
        } 
      });
//    }
    this.hide_loading();
  }

  async approveRecipient() {
  
    //    if (await this.validateForm()) { 
    //      console.log("Form Validation passed");
    
    console.log("IsLoad=true");
    this.show_loading();

    await RecipientDataService.approveDraftById(
      this.state.currentRecipient.id,
      this.state.currentRecipient,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("The recipient is approved and executed successfully"+ (typeof(response.data.smartcontractaddress)!=="undefined" && response.data.smartcontractaddress!==null && response.data.smartcontractaddress!==""? " with smart contract deployed at "+response.data.smartcontractaddress+". You can start transfering now.": "."), "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log("-->response:",e);
      console.log(e.message);
      //this.displayModal("Recipient approval failed. "+e.message+".", null, null, "OK");
      this.displayModal(e.message+".\n"+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      try {
        console.log(e.response.data.message);
        if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
          this.displayModal("The recipient update failed. The new recipient name is already used, please use another name.", null, null, null, "OK");
        }
      } catch(e) {
        this.hide_loading();

        console.log("Error: ",e);
        if (typeof (e.response.data.message) !== "undefined" && e.response.data.message !== null && e.response.data.message !== "" ) {
          console.log("Response error:", e.response.data.message);
          this.displayModal("Error: "+e.response.data.message+". Please contact tech support.", null, null, null, "OK");
        } else
          this.displayModal("Error: "+e.message+". Please contact tech support.", null, null, null, "OK");
      } 
    });
//    }
    this.hide_loading();
  }

async rejectRecipient() {

  console.log("isChecker? ", this.state.isChecker);
  console.log("this.state.currentRecipient.checkerComments: ", this.state.currentRecipient.checkerComments);
  console.log("isApprover? ", this.state.isApprover);
  console.log("this.state.currentRecipient.approverComments: ", this.state.currentRecipient.approverComments);

  if ( this.state.isChecker && (typeof this.state.currentRecipient.checkerComments==="undefined" || this.state.currentRecipient.checkerComments==="" || this.state.currentRecipient.checkerComments===null)) { 
    this.displayModal("Please enter the reason for rejection in the Checker Comments.", null, null, null, "OK");
  } else 
  if (this.state.isApprover && (typeof this.state.currentRecipient.approverComments==="undefined" || this.state.currentRecipient.approverComments==="" || this.state.currentRecipient.approverComments===null)) {
    this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
  } else {
    //console.log("Form Validation passed");
  
    console.log("IsLoad=true");
    this.show_loading();

    await RecipientDataService.rejectDraftById(
      this.state.currentRecipient.id,
      this.state.currentRecipient,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("This recipient request is rejected. Routing back to maker.", "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log(e);
      console.log(e.message);
      this.displayModal("Recipient rejection failed.", null, null, null, "OK");
    });
  }
  this.hide_loading();
}
    

async deleteRecipient() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await RecipientDataService.approveDeleteDraftById(
      this.state.currentRecipient.id,
      this.state.currentRecipient,
    )
      .then(response => {
        console.log("IsLoad=false");
        this.hide_loading();     // hide progress
  
        this.displayModal("Recipient is deleted.", "OK", null, null, null);
        console.log(response.data);
        //this.props.router.navigate('/inbox');
      })
      .catch(e => {
        console.log("IsLoad=false");
        this.hide_loading();     // hide progress
        this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

        console.log(e);
      });
  }

  async dropRequest() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await RecipientDataService.dropRequestById(
      this.state.currentRecipient.id,
      this.state.currentRecipient,
    )
      .then(response => {
        console.log("IsLoad=false");
        this.hide_loading();     // hide progress
  
        this.displayModal("Request is dropped (deleted).", "OK", null, null, null);
        console.log(response.data);
        //this.props.router.navigate('/inbox');
      })
      .catch(e => {
        console.log("IsLoad=false");
        this.hide_loading();     // hide progress
        this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

        console.log(e);
      });
  }

  show_loading() {
    this.setState({isLoading: true});
  }
  hide_loading(){
    this.setState({isLoading: false});
  }

  /*
  showModal_nochange = () => {
    this.displayModal("No change is updated as you have not made any change.", null, null, null, "OK");
  };
*/
  showModal_Leave = () => {
    this.displayModal("You have made changes. Are you sure you want to leave this page without submitting?", "Yes, leave", null, null, "Cancel");
  };

  showModal_dropRequest = () => {
    this.displayModal("Are you sure you want to Drop this Request?", null, null, "Yes, drop", "Cancel");
  };

  /*
  showModalDelete = () => {
    this.displayModal("Are you sure you want to delete this recipient?", null, "Yes, delete", null, "Cancel");
  };
*/
  hideModal = () => {
    this.setState({ showm: false });
  };


  render() {
    const { currentRecipient, checkerList, approverList } = this.state;
    console.log("Render currentRecipient:", currentRecipient);

    try {
      return (
        <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>{this.state.currentRecipient.txntype===0?"Create ":(this.state.currentRecipient.txntype===1?"Update ":(this.state.currentRecipient.txntype===2?"Delete ":null))}Recipient / Sponsor { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
            </h3>
          </header>

        </div>: null}

                <div className="edit-form list-row">
                  <h4></h4>
                  <div className="col-md-8">

                  <form autoComplete="off">
                    <div className="form-group">
                      <label htmlFor="name">Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        maxLength="45"
                        value={currentRecipient.name}
                        disabled={true}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="bank">Bank *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="bank"
                        maxLength="255"
                        required
                        value={currentRecipient.bank}
                        name="bank"
                        disabled={!this.state.isMaker || this.state.currentRecipient.txntype===2}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="bankaccount">Account Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="bankaccount"
                        maxLength="255"
                        required
                        value={currentRecipient.bankaccount}
                        name="bankaccount"
                        disabled={!this.state.isMaker || this.state.currentRecipient.txntype===2}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="walletaddress">Wallet Address *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="walletaddress"
                        maxLength="255"
                        required
                        value={currentRecipient.walletaddress}
                        name="walletaddress"
                        disabled={!this.state.isMaker || this.state.currentRecipient.txntype===2}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="checker">Checker *</label>
                      <select
                            value={currentRecipient.checker}
                            onChange={this.onChangeChecker}                         
                            className="form-control"
                            id="checker"
                            disabled={!this.state.isMaker || this.state.currentRecipient.txntype===2}
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
                      <label htmlFor="checkerComments">Checker Comments</label>
                      <input
                        type="text"
                        maxLength="255"
                        className="form-control"
                        id="checkerComments"
                        required
                        value={currentRecipient.checkerComments}
                        onChange={this.onChangeCheckerComments}
                        name="checkerComments"
                        autoComplete="off"
                        disabled={!this.state.isChecker}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="approver">Approver *</label>
                      <select
                          value={currentRecipient.approver}
                          onChange={this.onChangeApprover}                         
                          className="form-control"
                          id="approver"
                          disabled={!this.state.isMaker || this.state.currentRecipient.txntype===2}
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
                    <div className="form-group">
                      <label htmlFor="approverComments">Approver Comments</label>
                      <input
                        type="text"
                        maxLength="255"
                        className="form-control"
                        id="approverComments"
                        required
                        value={currentRecipient.approverComments}
                        onChange={this.onChangeApproverComments}
                        name="approverComments"
                        autoComplete="off"
                        disabled={!this.state.isApprover}
                        />
                    </div>


                  </form>
                  {
                  this.state.isMaker? 
                  <>
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={this.submitRecipient}
                    >
                      Submit&nbsp;
                      {
                        (this.state.currentRecipient.txntype===0? " Create ":
                        (this.state.currentRecipient.txntype===1? " Update ":
                        (this.state.currentRecipient.txntype===2? " Delete ":null)))
                      }
                      Request

                    </button> 

                    <button
                    className="m-3 btn btn-sm btn-danger"
                    onClick={this.showModal_dropRequest}
                    >
                    Drop Request
                    </button>
                  </>
                  : (this.state.isChecker? 
                  <button
                  type="submit"
                  className="m-3 btn btn-sm btn-primary"
                  onClick={this.acceptRecipient}
                  >
                    Endorse&nbsp;
                    {
                      (this.state.currentRecipient.txntype===0? " Create ":
                      (this.state.currentRecipient.txntype===1? " Update ":
                      (this.state.currentRecipient.txntype===2? " Delete ":null)))
                    }
                    Request

                  </button> 
                  :
                  (
                    this.state.isApprover?
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={this.state.currentRecipient.txntype===2? this.deleteRecipient: this.approveRecipient}
                    >
                      Approve&nbsp;
                      {
                        (this.state.currentRecipient.txntype===0? " Create ":
                        (this.state.currentRecipient.txntype===1? " Update ":
                        (this.state.currentRecipient.txntype===2? " Delete ":null)))
                      }
                      Request

                    </button> 
                    : null
                  ))
                  }
   &nbsp;
                  {
                    this.state.isChecker || this.state.isApprover ?

                  <button
                  type="submit"
                  className="m-3 btn btn-sm btn-danger"
                  onClick={this.rejectRecipient}
                  >
                    Reject
                  </button> 
                  : null
                  }
  &nbsp;
                  { 

                   ((this.state.datachanged) ? 
                    <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>
                      Back
                    </button>
                    : 
                    <Link to="/inbox">
                    <button className="m-3 btn btn-sm btn-secondary">
                      Back
                    </button>
                    </Link>
                   )
                   }


                  {this.state.isLoading ? <LoadingSpinner /> : null}

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/inbox'} handleProceed2={this.deleteRecipient} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                    {this.state.modalmsg}
                  </Modal>


                  <p>{this.state.message}</p>
                </div>
            </div>
            </div>
      );
    } // try
    catch (e) {

    }
  }
}

export default withRouter(Recipient);