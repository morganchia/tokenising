import React, { Component } from "react";
import MintDataService from "../services/mint.service";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { withRouter } from '../common/with-router';
import AuthService from "../services/auth.service";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";

class Mint extends Component {
  constructor(props) {
    super(props);
    this.onChangeAmount = this.onChangeAmount.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.onChangeCheckerComments = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
    this.getMint = this.getMint.bind(this);
    this.submitMint = this.submitMint.bind(this);
    this.acceptMint = this.acceptMint.bind(this);
    this.approveMint = this.approveMint.bind(this);
    this.rejectMint = this.rejectMint.bind(this);
    this.deleteMint = this.deleteMint.bind(this);
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

      currentMint: {
        id: null,
        campaign: null,
        mintAmount: "",
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedmintid: null,
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
      isNewMint: null,
      
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

  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("mint")
      .then(response => {
        console.log("Data received by getAllCheckerApprovers:", response.data);
        let chkList = response.data.find((element) => {
          //var el_id = element.id;                       console.log("typeof(el_id)", typeof(el_id));
          //console.log("element.name:", element.name);   console.log("typeof(element.name)", typeof(element.name));
          try {
            if (element.name.toUpperCase() === "CHECKER") 
              return element;
          } catch(e) {
            // do nothing, sometime when mintList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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
            // do nothing, sometime when mintList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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

    this.getMint(user, this.props.router.params.id);
    
    this.getAllSponsors();

    this.retrieveAllMakersCheckersApprovers();
  }
/*
  onChangeName(e) {
    const name = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentMint: {
          ...prevState.currentMint,
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
        currentMint: {
          ...prevState.currentMint,
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
        currentMint: {
          ...prevState.currentMint,
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
      currentMint: {
        ...prevState.currentMint,
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
      currentMint: {
        ...prevState.currentMint,
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
      currentMint: {
        ...prevState.currentMint,
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
      currentMint: {
        ...prevState.currentMint,
        mintAmount: amount
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
      currentMint: {
        ...prevState.currentMint,
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
        currentMint: {
          ...prevState.currentMint,
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
      currentMint: {
        ...prevState.currentMint,
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
        currentMint: {
          ...prevState.currentMint,
          approverComments: approverComments
        }
      };
    });
  }

  getMint(user, id) {
    console.log("+++ id:", id);

    if (id !== undefined) {
      MintDataService.getAllDraftsByMintId(id)
        .then(response => {
          response.data[0].actionby = user.username;
          this.setState({
            currentMint: response.data[0],
          });
          console.log("Response from getAllDraftsByMintId(id):",response.data[0]);

          let ismaker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "MAKER" && user.id === response.data[0].maker);
          console.log("isMaker:", (ismaker === undefined? false: true));
          this.setState({ isMaker: (ismaker === undefined? false: true),});
      
          let ischecker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "CHECKER" && user.id === response.data[0].checker);
          console.log("isChecker:", (ischecker === undefined? false: true));
          this.setState({ isChecker: (ischecker === undefined? false: true),});
          /*
          if (ischecker !== undefined) {
            this.setState({ isChecker: true, currentMint: {checkerComments: ""}, });
          }
          */

          let isapprover= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "APPROVER" && user.id === response.data[0].approver);
          console.log("isApprover:", (isapprover === undefined? false: true));
          this.setState({ isApprover: (isapprover === undefined? false: true),});
          /*
          if (isapprover !== undefined) {
            this.setState({ isApprover: true, currentMint: {approverComments: ""}, });
          }
          */

          this.setState({ isNewMint : (response.data[0].smartcontractaddress === "" || response.data[0].smartcontractaddress === null) });
        })
        .catch(e => {
          console.log("Error from getAllDraftsByMintId(id):",e);
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

  /*
  if (!(typeof this.state.currentMint.campaign.name ==='string' || this.state.currentMint.campaign.name instanceof String)) {
    err += "- Name cannot be empty\n";
  } else if ((this.state.currentMint.campaign.name.trim() === "")) {
    err += "- Name cannot be empty\n"; 
  } 
  
    else if (this.state.isNewMint) { // only check if new mint, dont need to check if it is existing mint because surely will have name alrdy
    await MintDataService.findByNameExact(this.state.currentMint.campaign.name.trim())
    .then(response => {
      console.log("Find duplicate name:",response.data);

      if (response.data.length > 0) {
        err += "- Name of mint is already present (duplicate name)\n";
        console.log("Found mint name (duplicate!):"+this.state.currentMint.campaign.name);
      } else {
        console.log("Didnt find mint name1 (ok no duplicate):"+this.state.currentMint.name);
      }
    })
    .catch(e => {
      console.log("Didnt find mint name2 (ok no duplicate):"+this.state.currentMint.name);
      // ok to proceed
    });
  }
      */
    // dont need t check description, it can be empty
//    if (! validator.isDate(this.state.currentMint.startdate)) err += "- Start Date is invalid\n";
//    if (! validator.isDate(this.state.currentMint.enddate)) err += "- End Date is invalid\n";
//  if (this.state.currentMint.sponsor === "") err += "- Sponsor cannot be empty\n";
  if (this.state.currentMint.mintAmount === "") {
    err += "- Amount cannot be empty\n";
  } else if (parseInt(this.state.currentMint.mintAmount) <=  0) 
    err += "- Amount must be more than zero\n";


//    if (this.state.currentMint.startdate.trim() !== "" && this.state.currentMint.enddate.trim() !== "" && this.state.currentMint.startdate > this.state.currentMint.enddate) err += "- Start date cannot be later than End date\n";    

//    console.log("start date:'"+this.state.currentMint.startdate+"'");
//    console.log("end date:'"+this.state.currentMint.enddate+"'");
//    console.log("Start > End? "+ (this.state.currentMint.startdate > this.state.currentMint.enddate));

  if (this.state.currentMint.checker === "" || this.state.currentMint.checker === null) err += "- Checker cannot be empty\n";
  if (this.state.currentMint.approver === "" || this.state.currentMint.approver === null) err += "- Approver cannot be empty\n";
  if (this.state.currentMint.checker === this.state.currentUser.id.toString() 
      && this.state.currentMint.approver === this.state.currentUser.id.toString()) {
    err += "- Maker, Checker and Approver cannot be the same person\n";
  } else {
    if (this.state.currentMint.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
    if (this.state.currentMint.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
    if (this.state.currentMint.checker!==null && this.state.currentMint.checker!=="" 
          && this.state.currentMint.checker === this.state.currentMint.approver) err += "- Checker and Approver cannot be the same person\n";
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

async submitMint() {
  
  if (await this.validateForm()) { 
        console.log("Form Validation passed");
  
        console.log("IsLoad=true");
        this.show_loading();
  
        await MintDataService.submitDraftById(
          this.state.currentMint.id,
          this.state.currentMint,
        )
        .then(response => {
          this.hide_loading();
  
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();
    
          this.setState({  
            datachanged: false,
          });
          this.displayModal("Mint submitted. Routing to checker.", "OK", null, null, null);
        })
        .catch(e => {
          this.hide_loading();
  
          console.log(e);
          console.log(e.message);
          this.displayModal("Mint submit failed.", null, null, null, "OK");
  
          try {
            console.log(e.response.data.message);
            // Need to check draft and approved mint names
            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
              this.displayModal("The mint submit failed. The new mint name is already used, please use another name.", null, null, null, "OK");
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
    
async acceptMint() {
  
//    if (await this.validateForm()) { 
//      console.log("Form Validation passed");

      console.log("IsLoad=true");
      this.show_loading();

      await MintDataService.acceptDraftById(
        this.state.currentMint.id,
        this.state.currentMint,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();
  
        this.setState({  
          datachanged: false,
        });
        this.displayModal("Mint request checked, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Mint accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The mint accept failed. The new mint name is already used, please use another name.", null, null, null, "OK");
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

  async approveMint() {
  
    //    if (await this.validateForm()) { 
    //      console.log("Form Validation passed");
    
    console.log("IsLoad=true");
    this.show_loading();

    await MintDataService.approveDraftById(
      this.state.currentMint.id,
      this.state.currentMint,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("The mint is approved and executed successfully"+ (typeof(response.data.smartcontractaddress)!=="undefined" && response.data.smartcontractaddress!==null && response.data.smartcontractaddress!==""? " with smart contract deployed at "+response.data.smartcontractaddress+". You can start transfering now.": "."), "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log("-->response:",e);
      console.log(e.message);
      //this.displayModal("Mint approval failed. "+e.message+".", null, null, "OK");
      this.displayModal(e.message+".\n"+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      try {
        console.log(e.response.data.message);
        if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
          this.displayModal("The mint update failed. The new mint name is already used, please use another name.", null, null, null, "OK");
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

async rejectMint() {

  console.log("isChecker? ", this.state.isChecker);
  console.log("this.state.currentMint.checkerComments: ", this.state.currentMint.checkerComments);
  console.log("isApprover? ", this.state.isApprover);
  console.log("this.state.currentMint.approverComments: ", this.state.currentMint.approverComments);

  if ( this.state.isChecker && (typeof this.state.currentMint.checkerComments==="undefined" || this.state.currentMint.checkerComments==="" || this.state.currentMint.checkerComments===null)) { 
    this.displayModal("Please enter the reason for rejection in the Checker Comments.", null, null, null, "OK");
  } else 
  if (this.state.isApprover && (typeof this.state.currentMint.approverComments==="undefined" || this.state.currentMint.approverComments==="" || this.state.currentMint.approverComments===null)) {
    this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
  } else {
    //console.log("Form Validation passed");
  
    console.log("IsLoad=true");
    this.show_loading();

    await MintDataService.rejectDraftById(
      this.state.currentMint.id,
      this.state.currentMint,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("This mint request is rejected. Routing back to maker.", "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log(e);
      console.log(e.message);
      this.displayModal("Mint rejection failed.", null, null, null, "OK");
    });
  }
  this.hide_loading();
}
    

async deleteMint() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await MintDataService.approveDeleteDraftById(
      this.state.currentMint.id,
      this.state.currentMint,
    )
      .then(response => {
        console.log("IsLoad=false");
        this.hide_loading();     // hide progress
  
        this.displayModal("Mint is deleted.", "OK", null, null, null);
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

    await MintDataService.dropRequestById(
      this.state.currentMint.id,
      this.state.currentMint,
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
    this.displayModal("Are you sure you want to delete this mint?", null, "Yes, delete", null, "Cancel");
  };
*/
  hideModal = () => {
    this.setState({ showm: false });
  };


  render() {
    const { recipient, currentMint, checkerList, approverList } = this.state;
    console.log("Render recipient:", recipient);
    console.log("Render currentMint:", currentMint);

    try {
      return (
        <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>{this.state.currentMint.txntype===0?"Create ":(this.state.currentMint.txntype===1?"Update ":(this.state.currentMint.txntype===2?"Delete ":null))}Mint { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
            </h3>
          </header>

        </div>: null}

                <div className="edit-form list-row">
                  <h4></h4>
                  <div className="col-md-8">

                  <form autoComplete="off">
                    <div className="form-group">
                      <label htmlFor="name">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        maxLength="45"
                        value={currentMint.campaign.name}
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
                    value={currentMint.description}
                    onChange={this.onChangeDescription}
                    name="description"
                    autoComplete="off"
                    disabled={!this.state.isMaker || this.state.currentMint.txntype===2}
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
                    value={currentMint.campaign.tokenname}
                    name="tokenname"
                    style={{textTransform : "uppercase"}}
                    disabled={true}
                    />
                </div>

                <div className="form-group">
                  <label htmlFor="blockchain">Blockchain *</label>
                  <select
                        className="form-control"
                        id="blockchain"
                        disabled={!this.state.isMaker || this.state.currentMint.txntype===2}
                        >
                        <option value="80001"       >Polygon  Testnet</option>
                        <option value="5" disabled  >Ethereum Testnet (not in use at the moment)</option>
                        <option value="137" disabled>Polygon  Mainnet (not in use at the moment)</option>
                        <option value="1" disabled  >Ethereum Mainnet (not in use at the moment)</option>
                      </select>
                </div>
                <div className="form-group">
                  <label htmlFor="mintAmount">Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    id="mintAmount"
                    min="1"
                    step="1"
                    value={currentMint.mintAmount}
                    onChange={this.onChangeAmount}
                    disabled={!this.state.isMaker || this.state.currentMint.txntype===2}
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="checker">Checker *</label>
                  <select
                        value={currentMint.checker}
                        onChange={this.onChangeChecker}                         
                        className="form-control"
                        id="checker"
                        disabled={!this.state.isMaker || this.state.currentMint.txntype===2}
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
                        value={currentMint.checkerComments}
                        onChange={this.onChangeCheckerComments}
                        name="checkerComments"
                        autoComplete="off"
                        disabled={!this.state.isChecker}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="approver">Approver *</label>
                      <select
                          value={currentMint.approver}
                          onChange={this.onChangeApprover}                         
                          className="form-control"
                          id="approver"
                          disabled={!this.state.isMaker || this.state.currentMint.txntype===2}
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
                        value={currentMint.approverComments}
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
                    onClick={this.submitMint}
                    >
                      Submit&nbsp;
                      {
                        (this.state.currentMint.txntype===0? " Create ":
                        (this.state.currentMint.txntype===1? " Update ":
                        (this.state.currentMint.txntype===2? " Delete ":null)))
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
                  onClick={this.acceptMint}
                  >
                    Endorse&nbsp;
                    {
                      (this.state.currentMint.txntype===0? " Create ":
                      (this.state.currentMint.txntype===1? " Update ":
                      (this.state.currentMint.txntype===2? " Delete ":null)))
                    }
                    Request

                  </button> 
                  :
                  (
                    this.state.isApprover?
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={this.state.currentMint.txntype===2? this.deleteMint: this.approveMint}
                    >
                      Approve&nbsp;
                      {
                        (this.state.currentMint.txntype===0? " Create ":
                        (this.state.currentMint.txntype===1? " Update ":
                        (this.state.currentMint.txntype===2? " Delete ":null)))
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
                  onClick={this.rejectMint}
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

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/inbox'} handleProceed2={this.deleteMint} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
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

export default withRouter(Mint);