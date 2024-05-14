import React, { Component } from "react";
import TransferDataService from "../services/transfer.service";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { withRouter } from '../common/with-router';
import AuthService from "../services/auth.service";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";

class Transfer extends Component {
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
    this.getTransfer = this.getTransfer.bind(this);
    this.submitTransfer = this.submitTransfer.bind(this);
    this.acceptTransfer = this.acceptTransfer.bind(this);
    this.approveTransfer = this.approveTransfer.bind(this);
    this.rejectTransfer = this.rejectTransfer.bind(this);
    this.deleteTransfer = this.deleteTransfer.bind(this);
    this.showModal_Leave = this.showModal_Leave.bind(this);
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

      currentTransfer: {
        id: null,
        campaign: null,
        recipientwallet: "",
        transferAmount: "",
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedtransferid: null,
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
      isNewTransfer: null,
      
      actionby: undefined,
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

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user) this.setState({ redirect: "/home" });
    this.setState({ currentUser: user, userReady: true })

    this.getTransfer(user, this.props.router.params.id);
    
    //this.getAllSponsors();

    this.retrieveAllMakersCheckersApprovers();
  }
  
  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("transfer")
      .then(response => {
        console.log("Data received by getAllCheckerApprovers:", response.data);
        let chkList = response.data.find((element) => {
          //var el_id = element.id;                       console.log("typeof(el_id)", typeof(el_id));
          //console.log("element.name:", element.name);   console.log("typeof(element.name)", typeof(element.name));
          try {
            if (element.name.toUpperCase() === "CHECKER") 
              return element;
          } catch(e) {
            // do nothing, sometime when transferList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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
            // do nothing, sometime when transferList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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

  
/*
  onChangeName(e) {
    const name = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentTransfer: {
          ...prevState.currentTransfer,
          name: name
        }
      };
    });
  }

  onChangeTokenName(e) {
    const tokenname = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentTransfer: {
          ...prevState.currentTransfer,
          tokenname: tokenname
        }
      };
    });
  }

  onChangeDescription(e) {
    const description = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentTransfer: {
          ...prevState.currentTransfer,
          description: description
        }
      };
    });
  }

  onChangeStartDate(e) {
    const startdate = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentTransfer: {
        ...prevState.currentTransfer,
        startdate: startdate
      }
    }));
  }

  onChangeEndDate(e) {
    const enddate = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentTransfer: {
        ...prevState.currentTransfer,
        enddate: enddate
      }
    }));
  }

  onChangeSponsor(e) {
    const sponsor = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentTransfer: {
        ...prevState.currentTransfer,
        sponsor: sponsor
      }
    }));
  }
*/
  onChangeAmount(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");  // remove . and other chars
    const amount = e.target.value;
    
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentTransfer: {
        ...prevState.currentTransfer,
        transferAmount: amount
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
      currentTransfer: {
        ...prevState.currentTransfer,
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
        currentTransfer: {
          ...prevState.currentTransfer,
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
      currentTransfer: {
        ...prevState.currentTransfer,
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
        currentTransfer: {
          ...prevState.currentTransfer,
          approverComments: approverComments
        }
      };
    });
  }

  getTransfer(user, id) {
    console.log("+++ id:", id);

    if (id !== undefined) {
      TransferDataService.getAllDraftsByTransferId(id)
        .then(response => {
          response.data[0].actionby= user.username;
          this.setState({
            currentTransfer: response.data[0],
          });
          console.log("Response from getAllDraftsByTransferId(id):",response.data[0]);

          let ismaker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "MAKER" && user.id === response.data[0].maker);
          console.log("isMaker:", (ismaker === undefined? false: true));
          this.setState({ isMaker: (ismaker === undefined? false: true),});
      
          let ischecker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "CHECKER" && user.id === response.data[0].checker);
          console.log("isChecker:", (ischecker === undefined? false: true));
          this.setState({ isChecker: (ischecker === undefined? false: true),});
          /*
          if (ischecker !== undefined) {
            this.setState({ isChecker: true, currentTransfer: {checkerComments: ""}, });
          }
          */

          let isapprover= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "APPROVER" && user.id === response.data[0].approver);
          console.log("isApprover:", (isapprover === undefined? false: true));
          this.setState({ isApprover: (isapprover === undefined? false: true),});
          /*
          if (isapprover !== undefined) {
            this.setState({ isApprover: true, currentTransfer: {approverComments: ""}, });
          }
          */

          this.setState({ 
            isNewTransfer : (response.data[0].smartcontractaddress === "" || response.data[0].smartcontractaddress === null) 
          });
        })
        .catch(e => {
          console.log("Error from getAllDraftsByTransferId(id):",e);
        });
    }
  }

  /*
  getAllSponsors() {
//    RecipientDataService.getAll()
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
*/

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

  /*
  if (!(typeof this.state.currentTransfer.campaign.name ==='string' || this.state.currentTransfer.campaign.name instanceof String)) {
    err += "- Name cannot be empty\n";
  } else if ((this.state.currentTransfer.campaign.name.trim() === "")) {
    err += "- Name cannot be empty\n"; 
  } 
  
    else if (this.state.isNewTransfer) { // only check if new transfer, dont need to check if it is existing transfer because surely will have name alrdy
    await TransferDataService.findByNameExact(this.state.currentTransfer.campaign.name.trim())
    .then(response => {
      console.log("Find duplicate name:",response.data);

      if (response.data.length > 0) {
        err += "- Name of transfer is already present (duplicate name)\n";
        console.log("Found transfer name (duplicate!):"+this.state.currentTransfer.campaign.name);
      } else {
        console.log("Didnt find transfer name1 (ok no duplicate):"+this.state.currentTransfer.name);
      }
    })
    .catch(e => {
      console.log("Didnt find transfer name2 (ok no duplicate):"+this.state.currentTransfer.name);
      // ok to proceed
    });
  }
      */
    // dont need t check description, it can be empty
//    if (! validator.isDate(this.state.currentTransfer.startdate)) err += "- Start Date is invalid\n";
//    if (! validator.isDate(this.state.currentTransfer.enddate)) err += "- End Date is invalid\n";
//  if (this.state.currentTransfer.sponsor === "") err += "- Sponsor cannot be empty\n";
  if (this.state.currentTransfer.transferAmount === "") {
    err += "- Amount cannot be empty\n";
  } else if (parseInt(this.state.currentTransfer.transferAmount) <=  0) 
    err += "- Amount must be more than zero\n";


//    if (this.state.currentTransfer.startdate.trim() !== "" && this.state.currentTransfer.enddate.trim() !== "" && this.state.currentTransfer.startdate > this.state.currentTransfer.enddate) err += "- Start date cannot be later than End date\n";    

//    console.log("start date:'"+this.state.currentTransfer.startdate+"'");
//    console.log("end date:'"+this.state.currentTransfer.enddate+"'");
//    console.log("Start > End? "+ (this.state.currentTransfer.startdate > this.state.currentTransfer.enddate));

  if (this.state.currentTransfer.checker === "" || this.state.currentTransfer.checker === null) err += "- Checker cannot be empty\n";
  if (this.state.currentTransfer.approver === "" || this.state.currentTransfer.approver === null) err += "- Approver cannot be empty\n";
  if (this.state.currentTransfer.checker === this.state.currentUser.id.toString() 
      && this.state.currentTransfer.approver === this.state.currentUser.id.toString()) {
    err += "- Maker, Checker and Approver cannot be the same person\n";
  } else {
    if (this.state.currentTransfer.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
    if (this.state.currentTransfer.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
    if (this.state.currentTransfer.checker!==null && this.state.currentTransfer.checker!=="" 
          && this.state.currentTransfer.checker === this.state.currentTransfer.approver) err += "- Checker and Approver cannot be the same person\n";
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

async submitTransfer() {
  
  if (await this.validateForm()) { 
        console.log("Form Validation passed");
  
        console.log("IsLoad=true");
        this.show_loading();
  
        await TransferDataService.submitDraftById(
          this.state.currentTransfer.id,
          this.state.currentTransfer,
        )
        .then(response => {
          this.hide_loading();
  
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();
    
          this.setState({  
            datachanged: false,
          });
          this.displayModal("Transfer submitted. Routing to checker.", "OK", null, null, null);
        })
        .catch(e => {
          this.hide_loading();
  
          console.log(e);
          console.log(e.message);
          this.displayModal("Transfer submit failed.", null, null, null, "OK");
  
          try {
            console.log(e.response.data.message);
            // Need to check draft and approved transfer names
            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
              this.displayModal("The transfer submit failed. The new transfer name is already used, please use another name.", null, null, null, "OK");
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
    
async acceptTransfer() {
  
//    if (await this.validateForm()) { 
//      console.log("Form Validation passed");

      console.log("IsLoad=true");
      this.show_loading();

      await TransferDataService.acceptDraftById(
        this.state.currentTransfer.id,
        this.state.currentTransfer,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();
  
        this.setState({  
          datachanged: false,
        });
        this.displayModal("Transfer request checked, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Transfer accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The transfer accept failed. The new transfer name is already used, please use another name.", null, null, null, "OK");
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

  async approveTransfer() {
  
    //    if (await this.validateForm()) { 
    //      console.log("Form Validation passed");
    
    console.log("IsLoad=true");
    this.show_loading();

    await TransferDataService.approveDraftById(
      this.state.currentTransfer.id,
      this.state.currentTransfer,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("The transfer is approved and executed successfully.", "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log("-->response:",e);
      console.log(e.message);
      //this.displayModal("Transfer approval failed. "+e.message+".", null, null, "OK");
      this.displayModal(e.message+".\n"+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      try {
        console.log(e.response.data.message);
        if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
          this.displayModal("The transfer update failed. The new transfer name is already used, please use another name.", null, null, null, "OK");
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

async rejectTransfer() {

  console.log("isChecker? ", this.state.isChecker);
  console.log("this.state.currentTransfer.checkerComments: ", this.state.currentTransfer.checkerComments);
  console.log("isApprover? ", this.state.isApprover);
  console.log("this.state.currentTransfer.approverComments: ", this.state.currentTransfer.approverComments);

  if ( this.state.isChecker && (typeof this.state.currentTransfer.checkerComments==="undefined" || this.state.currentTransfer.checkerComments==="" || this.state.currentTransfer.checkerComments===null)) { 
    this.displayModal("Please enter the reason for rejection in the Checker Comments.", null, null, null, "OK");
  } else 
  if (this.state.isApprover && (typeof this.state.currentTransfer.approverComments==="undefined" || this.state.currentTransfer.approverComments==="" || this.state.currentTransfer.approverComments===null)) {
    this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
  } else {
    //console.log("Form Validation passed");
  
    console.log("IsLoad=true");
    this.show_loading();

    await TransferDataService.rejectDraftById(
      this.state.currentTransfer.id,
      this.state.currentTransfer,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("This transfer request is rejected. Routing back to maker.", "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log(e);
      console.log(e.message);
      this.displayModal("Transfer rejection failed.", null, null, null, "OK");
    });
  }
  this.hide_loading();
}
    

async deleteTransfer() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await TransferDataService.approveDeleteDraftById(
      this.state.currentTransfer.id,
      this.state.currentTransfer,
    )
      .then(response => {
        console.log("IsLoad=false");
        this.hide_loading();     // hide progress
  
        this.displayModal("Transfer is deleted.", "OK", null, null, null);
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

  /*
  showModalDelete = () => {
    this.displayModal("Are you sure you want to delete this transfer?", null, "Yes, delete", null, "Cancel");
  };
*/
  hideModal = () => {
    this.setState({ showm: false });
  };


  render() {
    const { recipient, currentTransfer, checkerList, approverList } = this.state;
    console.log("Render recipient:", recipient);
    console.log("Render currentTransfer:", currentTransfer);

    try {
      return (
        <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>{this.state.currentTransfer.txntype===0?"Create ":(this.state.currentTransfer.txntype===1?"Update ":(this.state.currentTransfer.txntype===2?"Delete ":null))}Transfer { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
            </h3>
          </header>

        </div>: null}

                <div className="edit-form list-row">
                  <h4></h4>
                  <div className="col-md-8">

                  <form autoComplete="off">
                    <div className="form-group">
                      <label htmlFor="name">Campaign Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        maxLength="45"
                        value={currentTransfer.campaign.name}
                        disabled={true}
                        />
                    </div>
                    {
  /*
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    id="description"
                    maxLength="255"
                    required
                    value={currentTransfer.description}
                    onChange={this.onChangeDescription}
                    name="description"
                    autoComplete="off"
                    disabled={!this.state.isMaker || this.state.currentTransfer.txntype===2}
                    />
                </div>
 */
                    }
                <div className="form-group">
                  <label htmlFor="name">Token Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="tokenname"
                    maxLength="5"
                    required
                    value={currentTransfer.campaign.tokenname}
                    name="tokenname"
                    style={{textTransform : "uppercase"}}
                    disabled={true}
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="blockchain">Blockchain</label>
                  <input
                    type="text"
                    className="form-control"
                    id="blockchain"
                    required
                    value={
                      (() => {
                        switch (currentTransfer.campaign.blockchain) {
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
                      )()
                    }
                    onChange={this.onChangeBlockchain}
                    autoComplete="off"
                    disabled={true}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="transferAmount">Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    id="transferAmount"
                    min="1"
                    step="1"
                    value={currentTransfer.transferAmount}
                    onChange={this.onChangeAmount}
                    disabled={!this.state.isMaker || this.state.currentTransfer.txntype===2}
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="checker">Checker *</label>
                  <select
                        value={currentTransfer.checker}
                        onChange={this.onChangeChecker}                         
                        className="form-control"
                        id="checker"
                        disabled={!this.state.isMaker || this.state.currentTransfer.txntype===2}
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
                    value={currentTransfer.checkerComments}
                    onChange={this.onChangeCheckerComments}
                    name="checkerComments"
                    autoComplete="off"
                    disabled={!this.state.isChecker}
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="approver">Approver *</label>
                  <select
                      value={currentTransfer.approver}
                      onChange={this.onChangeApprover}                         
                      className="form-control"
                      id="approver"
                      disabled={!this.state.isMaker || this.state.currentTransfer.txntype===2}
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
                    value={currentTransfer.approverComments}
                    onChange={this.onChangeApproverComments}
                    name="approverComments"
                    autoComplete="off"
                    disabled={!this.state.isApprover}
                    />
                </div>


              </form>
              {
              this.state.isMaker?
              <button
              type="submit"
              className="m-3 btn btn-sm btn-primary"
              onClick={this.submitTransfer}
              >
                Submit&nbsp;
                {
                  (this.state.currentTransfer.txntype===0? " Create ":
                  (this.state.currentTransfer.txntype===1? " Update ":
                  (this.state.currentTransfer.txntype===2? " Delete ":null)))
                }
                Request

              </button> 
              : (this.state.isChecker? 
              <button
              type="submit"
              className="m-3 btn btn-sm btn-primary"
              onClick={this.acceptTransfer}
              >
                Endorse&nbsp;
                {
                  (this.state.currentTransfer.txntype===0? " Create ":
                  (this.state.currentTransfer.txntype===1? " Update ":
                  (this.state.currentTransfer.txntype===2? " Delete ":null)))
                }
                Request

              </button> 
              :
              (
                this.state.isApprover?
                <button
                type="submit"
                className="m-3 btn btn-sm btn-primary"
                onClick={this.state.currentTransfer.txntype===2? this.deleteTransfer: this.approveTransfer}
                >
                  Approve&nbsp;
                  {
                    (this.state.currentTransfer.txntype===0? " Create ":
                    (this.state.currentTransfer.txntype===1? " Update ":
                    (this.state.currentTransfer.txntype===2? " Delete ":null)))
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
              onClick={this.rejectTransfer}
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

              <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/inbox'} handleProceed2={this.deleteTransfer} handleProceed3={null} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
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

export default withRouter(Transfer);