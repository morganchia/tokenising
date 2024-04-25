import React, { Component } from "react";
import CampaignDataService from "../services/campaign.service";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { withRouter } from '../common/with-router';
import AuthService from "../services/auth.service";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";

class Campaign extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeTokenName = this.onChangeTokenName.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.onChangeSponsor = this.onChangeSponsor.bind(this);
    this.onChangeAmount = this.onChangeAmount.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.onChangeCheckerComments = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
    this.getCampaign = this.getCampaign.bind(this);
    this.submitCampaign = this.submitCampaign.bind(this);
    this.acceptCampaign = this.acceptCampaign.bind(this);
    this.approveCampaign = this.approveCampaign.bind(this);
    this.rejectCampaign = this.rejectCampaign.bind(this);
    this.deleteCampaign = this.deleteCampaign.bind(this);
    this.dropRequest = this.dropRequest.bind(this);
    this.showModal_Leave = this.showModal_Leave.bind(this);
  //  this.showModal_nochange = this.showModal_nochange.bind(this);
//  this.showModalDelete = this.showModalDelete.bind(this);
  this.showModal_dropRequest = this.showModal_dropRequest.bind(this);
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

      currentCampaign: {
        id: null,
        name: "",
        tokenname: "",
        description: "",
        smartcontractaddress: "",
        startdate: "",
        enddate: "",
        sponsor: "",
        amount: "",
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedcampaignid: null,
        actionby: "",
        name_changed: 0,
        description_changed: 0,
        startdate_changed: 0,
        enddate_changed: 0,
        sponsor_changed: 0,
        amount_changed: 0,
      },

      originalCampaign: {
        id: null,
        name: "",
        tokenname: "",
        description: "",
        smartcontractaddress: "",
        startdate: "",
        enddate: "",
        sponsor: "",
        amount: "",
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedcampaignid: null,
        actionby: "",
        name_original: "",
        description_original: "",
        startdate_original: "",
        enddate_original: "",
        sponsor_original: "",
        amount_original: "",
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
      isNewCampaign: null,
      
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
        button0text: null,
        handleProceed1: undefined,
        handleProceed2: undefined,
        handleCancel: undefined,
      }
    };
  }

  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("campaign")
      .then(response => {
        console.log("Data received by getAllCheckerApprovers:", response.data);
        let chkList = response.data.find((element) => {
          //var el_id = element.id;                       console.log("typeof(el_id)", typeof(el_id));
          //console.log("element.name:", element.name);   console.log("typeof(element.name)", typeof(element.name));
          try {
            if (element.name.toUpperCase() === "CHECKER") 
              return element;
          } catch(e) {
            // do nothing, sometime when campaignList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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
            // do nothing, sometime when campaignList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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

    this.getCampaign(user, this.props.router.params.id);
    
    this.getAllSponsors();

    this.retrieveAllMakersCheckersApprovers();
  }

  onChangeName(e) {
    const name = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentCampaign: {
          ...prevState.currentCampaign,
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
        currentCampaign: {
          ...prevState.currentCampaign,
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
        currentCampaign: {
          ...prevState.currentCampaign,
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
      currentCampaign: {
        ...prevState.currentCampaign,
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
      currentCampaign: {
        ...prevState.currentCampaign,
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
      currentCampaign: {
        ...prevState.currentCampaign,
        sponsor: sponsor
      }
    }));
  }

  onChangeAmount(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");  // remove . and other chars
    const amount = e.target.value;
    
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentCampaign: {
        ...prevState.currentCampaign,
        amount: amount
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
      currentCampaign: {
        ...prevState.currentCampaign,
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
        currentCampaign: {
          ...prevState.currentCampaign,
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
      currentCampaign: {
        ...prevState.currentCampaign,
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
        currentCampaign: {
          ...prevState.currentCampaign,
          approverComments: approverComments
        }
      };
    });
  }

  getCampaign(user, id) {
    console.log("+++ id:", id);

    if (id !== undefined) {
      CampaignDataService.getAllDraftsByCampaignId(id)
        .then(response => {
          response.data[0].actionby = user.username;
          this.setState({
            currentCampaign: response.data[0],
            originalCampaign: response.data[0],
          });
          console.log("Response from getAllDraftsByCampaignId(id):",response.data[0]);

          let ismaker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "MAKER" && user.id === response.data[0].maker);
          console.log("isMaker:", (ismaker === undefined? false: true));
          this.setState({ isMaker: (ismaker === undefined? false: true),});
      
          let ischecker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "CHECKER" && user.id === response.data[0].checker);
          console.log("isChecker:", (ischecker === undefined? false: true));
          this.setState({ isChecker: (ischecker === undefined? false: true),});
          //if (ischecker !== undefined) {  // clears the checkers comments
          //  this.setState({ isChecker: true, currentCampaign: {checkerComments: ""}, });
          //}
          

          let isapprover= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "APPROVER" && user.id === response.data[0].approver);
          console.log("isApprover:", (isapprover === undefined? false: true));
          this.setState({ isApprover: (isapprover === undefined? false: true),});
          /*
          if (isapprover !== undefined) {
            this.setState({ isApprover: true, currentCampaign: {approverComments: ""}, });
          }
          */

          this.setState({ isNewCampaign : (response.data[0].smartcontractaddress === "" || response.data[0].smartcontractaddress === null) });
        })
        .catch(e => {
          console.log("Error from getAllDraftsByCampaignId(id):",e);
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

    if (!(typeof this.state.currentCampaign.name ==='string' || this.state.currentCampaign.name instanceof String)) {
      err += "- Name cannot be empty\n";
    } else if ((this.state.currentCampaign.name.trim() === "")) {
      err += "- Name cannot be empty\n"; 
    } else if (this.state.isNewCampaign) { // only check if new campaign, dont need to check if it is existing campaign because surely will have name alrdy
      await CampaignDataService.findByNameExact(this.state.currentCampaign.name.trim())
      .then(response => {
        console.log("Find duplicate name:",response.data);

        if (response.data.length > 0) {
          err += "- Name of campaign is already present (duplicate name)\n";
          console.log("Found campaign name (duplicate!):"+this.state.currentCampaign.name);
        } else {
          console.log("Didnt find campaign name1 (ok no duplicate):"+this.state.currentCampaign.name);
        }
      })
      .catch(e => {
        console.log("Didnt find campaign name2 (ok no duplicate):"+this.state.currentCampaign.name);
        // ok to proceed
      });
    }
        
      // dont need t check description, it can be empty
    if (! validator.isDate(this.state.currentCampaign.startdate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.currentCampaign.enddate)) err += "- End Date is invalid\n";
    if (this.state.currentCampaign.sponsor === "") err += "- Sponsor cannot be empty\n";
    if (this.state.currentCampaign.amount === "") err += "- Amount cannot be empty\n";
    if (parseInt(this.state.currentCampaign.amount) <=  0) err += "- Amount must be more than zero\n";
    if (this.state.currentCampaign.startdate.trim() !== "" && this.state.currentCampaign.enddate.trim() !== "" && this.state.currentCampaign.startdate > this.state.currentCampaign.enddate) err += "- Start date cannot be later than End date\n";    

    console.log("start date:'"+this.state.currentCampaign.startdate+"'");
    console.log("end date:'"+this.state.currentCampaign.enddate+"'");
    console.log("Start > End? "+ (this.state.currentCampaign.startdate > this.state.currentCampaign.enddate));

    if (this.state.currentCampaign.checker === "" || this.state.currentCampaign.checker === null) err += "- Checker cannot be empty\n";
    if (this.state.currentCampaign.approver === "" || this.state.currentCampaign.approver === null) err += "- Approver cannot be empty\n";
    if (this.state.currentCampaign.checker === this.state.currentUser.id.toString() 
        && this.state.currentCampaign.approver === this.state.currentUser.id.toString()) {
      err += "- Maker, Checker and Approver cannot be the same person\n";
    } else {
      if (this.state.currentCampaign.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.currentCampaign.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
      if (this.state.currentCampaign.checker!==null && this.state.currentCampaign.checker!=="" 
            && this.state.currentCampaign.checker === this.state.currentCampaign.approver) err += "- Checker and Approver cannot be the same person\n";
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

async submitCampaign() {
  
  if (await this.validateForm()) { 
        console.log("Form Validation passed");
  
        console.log("IsLoad=true");
        this.show_loading();
  
        await CampaignDataService.submitDraftById(
          this.state.currentCampaign.id,
          this.state.currentCampaign,
        )
        .then(response => {
          this.hide_loading();
  
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();
    
          this.setState({  
            datachanged: false,
          });
          this.displayModal("Campaign submitted. Routing to checker.", "OK", null, null, null);
        })
        .catch(e => {
          this.hide_loading();
  
          console.log(e);
          console.log(e.message);
          this.displayModal("Campaign submit failed.", null, null, null, "OK");
  
          try {
            console.log(e.response.data.message);
            // Need to check draft and approved campaign names
            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
              this.displayModal("The campaign submit failed. The new campaign name is already used, please use another name.", null, null, null, "OK");
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
    
async acceptCampaign() {
  
//    if (await this.validateForm()) { 
//      console.log("Form Validation passed");

      console.log("IsLoad=true");
      this.show_loading();

      await CampaignDataService.acceptDraftById(
        this.state.currentCampaign.id,
        this.state.currentCampaign,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();
  
        this.setState({  
          datachanged: false,
        });
        this.displayModal("Campaign request checked, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Campaign accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The campaign accept failed. The new campaign name is already used, please use another name.", null, null, null, "OK");
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

  async approveCampaign() {
  
    //    if (await this.validateForm()) { 
    //      console.log("Form Validation passed");
    
    console.log("IsLoad=true");
    this.show_loading();

    await CampaignDataService.approveDraftById(
      this.state.currentCampaign.id,
      this.state.currentCampaign,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("The campaign is approved and executed successfully"+ (typeof(response.data.smartcontractaddress)!=="undefined" && response.data.smartcontractaddress!==null && response.data.smartcontractaddress!==""? " with smart contract deployed at "+response.data.smartcontractaddress+". \n\nYou can start minting now.": "."), "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log("-->response:",e);
      console.log(e.message);
      //this.displayModal("Campaign approval failed. "+e.message+".", null, null, "OK");
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      try {
        console.log(e.response.data.message);
        if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
          this.displayModal("The campaign update failed. The new campaign name is already used, please use another name.", null, null, null, "OK");
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

async rejectCampaign() {

  console.log("isChecker? ", this.state.isChecker);
  console.log("this.state.currentCampaign.checkerComments: ", this.state.currentCampaign.checkerComments);
  console.log("isApprover? ", this.state.isApprover);
  console.log("this.state.currentCampaign.approverComments: ", this.state.currentCampaign.approverComments);

  if ( this.state.isChecker && (typeof this.state.currentCampaign.checkerComments==="undefined" || this.state.currentCampaign.checkerComments==="" || this.state.currentCampaign.checkerComments===null)) { 
    this.displayModal("Please enter the reason for rejection in the Checker Comments.", null, null, null, "OK");
  } else 
  if (this.state.isApprover && (typeof this.state.currentCampaign.approverComments==="undefined" || this.state.currentCampaign.approverComments==="" || this.state.currentCampaign.approverComments===null)) {
    this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
  } else {
    //console.log("Form Validation passed");
  
    console.log("IsLoad=true");
    this.show_loading();

    await CampaignDataService.rejectDraftById(
      this.state.currentCampaign.id,
      this.state.currentCampaign,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("This campaign request is rejected. Routing back to maker.", "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log(e);
      console.log(e.message);
      this.displayModal("Campaign rejection failed.", null, null, null, "OK");
    });
  }
  this.hide_loading();
}
    

async deleteCampaign() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await CampaignDataService.approveDeleteDraftById(
      this.state.currentCampaign.id,
      this.state.currentCampaign,
    )
    .then(response => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress

      this.displayModal("Campaign is deleted.", "OK", null, null, null);
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

    await CampaignDataService.dropRequestById(
      this.state.currentCampaign.id,
      this.state.currentCampaign,
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
  
  showModalDelete = () => {
    this.displayModal("Are you sure you want to Delete this Campaign?", null, "Yes, delete", null, "Cancel");
  };

  hideModal = () => {
    this.setState({ showm: false });
  };


  render() {
    const { recipient, currentCampaign, checkerList, approverList } = this.state;
    console.log("Render recipient:", recipient);
    console.log("Render currentCampaign:", currentCampaign);

    try {
      return (
        <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>{this.state.currentCampaign.txntype===0?"Create ":(this.state.currentCampaign.txntype===1?"Update ":(this.state.currentCampaign.txntype===2?"Delete ":null))}Campaign { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
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
                        value={currentCampaign.name}
                        onChange={this.onChangeName}
                        disabled={!this.state.isMaker || this.state.currentCampaign.txntype===2}
                        />
                    </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    id="description"
                    maxLength="255"
                    required
                    value={currentCampaign.description}
                    onChange={this.onChangeDescription}
                    name="description"
                    autoComplete="off"
                    disabled={!this.state.isMaker || this.state.currentCampaign.txntype===2}
                    />
                </div>

                <div className="form-group">
                  <label htmlFor="name">Token Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="tokenname"
                    maxLength="5"
                    required
                    value={currentCampaign.tokenname}
                    onChange={this.onChangeTokenName}
                    name="tokenname"
                    style={{textTransform : "uppercase"}}
                    disabled={!this.state.isMaker || this.state.currentCampaign.txntype===2}
                    />
                </div>

                <div className="form-group">
                  <label htmlFor="blockchain">Blockchain *</label>
                  <select
                        onChange={this.onChangeBlockchain}                         
                        className="form-control"
                        id="blockchain"
                        disabled={!this.state.isMaker || this.state.currentCampaign.txntype===2}
                        >
                        <option value="80001"            >Polygon   Testnet Mumbai</option>
                        <option value="11155111" disabled>Ethereum  Testnet Sepolia (not in use at the moment)</option>
                        <option value="xxx"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                        <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                        <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                        <option value="yyy"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                      </select>
                </div>

                <div className="form-group">
                  <label htmlFor="name">Smart Contract</label>
                  <input
                    type="text"
                    className="form-control"
                    id="smartcontractaddress"
                    required
                    value={currentCampaign.smartcontractaddress}
                    name="smartcontractaddress"
                    disabled={true}
                  />
                </div>

                    <div className="form-group">
                      <label htmlFor="startdate">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        id="startdate"
                        value={currentCampaign.startdate}
                        onChange={this.onChangeStartDate}
                        disabled={!this.state.isMaker || this.state.currentCampaign.txntype===2}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="enddate">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        id="enddate"
                        value={currentCampaign.enddate}
                        onChange={this.onChangeEndDate}
                        disabled={!this.state.isMaker || this.state.currentCampaign.txntype===2}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="sponsor">Sponsor</label>
                      <select
                        value={currentCampaign.sponsor}
                        onChange={this.onChangeSponsor}                         
                        className="form-control"
                        id="sponsor"
                        disabled={!this.state.isMaker || this.state.currentCampaign.txntype===2}
                        >
                      {
                        Array.isArray(recipient) ?
                          recipient.map( (d) => {
                            return <option value={d.id}>{d.name}</option>
                          })
                        : null
                      }
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="amount">Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        id="amount"
                        min="1"
                        step="1"
                        value={currentCampaign.amount}
                        onChange={this.onChangeAmount}
                        disabled={!this.state.isMaker || this.state.currentCampaign.txntype===2}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="checker">Checker *</label>
                      <select
                            value={currentCampaign.checker}
                            onChange={this.onChangeChecker}                         
                            className="form-control"
                            id="checker"
                            disabled={!this.state.isMaker || this.state.currentCampaign.txntype===2}
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
                        value={currentCampaign.checkerComments}
                        onChange={this.onChangeCheckerComments}
                        name="checkerComments"
                        autoComplete="off"
                        disabled={!this.state.isChecker}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="approver">Approver *</label>
                      <select
                          value={currentCampaign.approver}
                          onChange={this.onChangeApprover}                         
                          className="form-control"
                          id="approver"
                          disabled={!this.state.isMaker || this.state.currentCampaign.txntype===2}
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
                        value={currentCampaign.approverComments}
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
                    onClick={this.submitCampaign}
                    >
                      Submit 
                      {
                        (this.state.currentCampaign.txntype===0? " Create ":
                        (this.state.currentCampaign.txntype===1? " Update ":
                        (this.state.currentCampaign.txntype===2? " Delete ":null)))
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
                  onClick={this.acceptCampaign}
                  >
                    Endorse
                    {
                      (this.state.currentCampaign.txntype===0? " Create ":
                      (this.state.currentCampaign.txntype===1? " Update ":
                      (this.state.currentCampaign.txntype===2? " Delete ":null)))
                    }
                    Request

                  </button> 
                  :
                  (
                    this.state.isApprover?
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={this.state.currentCampaign.txntype===2? this.deleteDraft: this.approveCampaign}
                    >
                      Approve
                      {
                        (this.state.currentCampaign.txntype===0? " Create ":
                        (this.state.currentCampaign.txntype===1? " Update ":
                        (this.state.currentCampaign.txntype===2? " Delete ":null)))
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
                  onClick={this.rejectCampaign}
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

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/inbox'} handleProceed2={this.deleteCampaign} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
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

export default withRouter(Campaign);