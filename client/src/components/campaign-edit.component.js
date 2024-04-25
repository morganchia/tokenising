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
//    this.onChangeTokenName = this.onChangeTokenName.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.onChangeSponsor = this.onChangeSponsor.bind(this);
    this.onChangeAmount = this.onChangeAmount.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.getCampaign = this.getCampaign.bind(this);
    this.submitUpdateCampaign = this.submitUpdateCampaign.bind(this);
//    this.updateCampaign = this.updateCampaign.bind(this);
    this.submitDeleteCampaign = this.submitDeleteCampaign.bind(this);
//    this.deleteCampaign = this.deleteCampaign.bind(this);
    this.showModal_Leave = this.showModal_Leave.bind(this);
    this.showModal_nochange = this.showModal_nochange.bind(this);
    this.showModalDelete = this.showModalDelete.bind(this);
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
        approvedcampaignid: "",
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
        approvedcampaignid: "",
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
    this.setState({ currentUser: user, actionby: user.username, userReady: true })

    let ismaker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "MAKER"
    );
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});
    if (ismaker) this.retrieveAllMakersCheckersApprovers();

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


    this.getCampaign(this.props.router.params.id);

    this.getAllSponsors();


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

/*
  // not supposed to change token name, smart contract cant amend it, have to redeploy a new smart contract
  onChangeTokenName(e) {
    const tokenname = e.target.value.toUpperCase();
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
*/
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


  getCampaign(id) {
    CampaignDataService.get(id)
      .then(response => {
        this.setState({
          currentCampaign: response.data,
          originalCampaign: response.data,
        });
        console.log("Response from getCampaign(id):",response.data);
      })
      .catch(e => {
        console.log(e);
      });
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

  async validateForm() {    
    var err = "";
  
    /*
    // cant change token name so no need to chk
    if (!(typeof this.state.currentCampaign.tokenname ==='string' || this.state.currentCampaign.tokenname instanceof String)) {
      err += "- Token Name cannot be empty\n";
    } else 
      if (this.state.currentCampaign.tokenname.trim() === "") err += "- Token Name cannot be empty\n";
    */

    if (!(typeof this.state.currentCampaign.name ==='string' || this.state.currentCampaign.name instanceof String)) {
      err += "- Name cannot be empty\n";
    } else if ((this.state.currentCampaign.name.trim() === "")) {
      err += "- Name cannot be empty\n"; 
    } else { 
    }
  
    
      // dont need t check description, it can be empty
    if (! validator.isDate(this.state.currentCampaign.startdate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.currentCampaign.enddate)) err += "- End Date is invalid\n";
    if (this.state.currentCampaign.sponsor === "") err += "- Sponsor cannot be empty\n";
    if (this.state.currentCampaign.amount === "") err += "- Amount cannot be empty\n";
    if (parseInt(this.state.currentCampaign.amount) <=  0) err += "- Amount must be more than zero\n";
    if (this.state.currentCampaign.startdate.trim() !== "" && this.state.currentCampaign.enddate.trim() !== "" && this.state.currentCampaign.startdate > this.state.currentCampaign.enddate) err += "- Start date cannot be later than End date\n";    
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

    console.log("start date:'"+this.state.currentCampaign.startdate+"'");
    console.log("end date:'"+this.state.currentCampaign.enddate+"'");
    console.log("Start > End? "+ (this.state.currentCampaign.startdate > this.state.currentCampaign.enddate));

    await CampaignDataService.findDraftByNameExact(this.state.currentCampaign.name.trim())    // check for duplicate Campaign name in draft requests
    .then(response => {
      console.log("Find duplicate name:",response.data);

      if (response.data.length > 0) {
        err = "- There is another request for '"+this.state.currentCampaign.name+"' (duplicate name) going through approval now. Please wait for that request to be completed before raising a request for this campaign.\n";
        console.log("Found campaign name (duplicate!):"+this.state.currentCampaign.name);
      } else {
        console.log("Didnt find campaign name1 (ok no duplicate):"+this.state.currentCampaign.name);
      }
    })
    .catch(e => {
      console.log("Didnt find campaign name2 (ok no duplicate):"+this.state.currentCampaign.name);
      // ok to proceed
    });

    // check for duplicate Campaign named list
    await CampaignDataService.findDraftByApprovedId(this.state.currentCampaign.approvedcampaignid)
    .then(response => {
      console.log("Found other requests for this same campaign:",response.data);

      if (response.data.length > 0) {
        err = "Error: There is another request for this campaign name '"+this.state.currentCampaign.name+"' going through approval now.\n Concurrent requests for same campaign is now allowed,";
        console.log("Found campaign name (duplicate!):"+this.state.currentCampaign.name);
      } else {
        console.log("Didnt find campaign name3 (ok no duplicate):"+this.state.currentCampaign.name);
      }
    })
    .catch(e => {
      console.log("Didnt find campaign name4 (ok no duplicate):"+this.state.currentCampaign.name);
      // ok to proceed
    });

    if (err !=="" ) {
      err = "Form validation issues found:\n"+err;
      this.displayModal(err, null, null, null, "OK");
      err = ""; // clear var
      return false;
    }
    return true;
  }

  async submitUpdateCampaign() {
  
    if (this.state.isMaker) { // only for Makers
      if (await this.validateForm()) { 
        var data = {
          name                  : this.state.currentCampaign.name.trim(),
          tokenname             : this.state.currentCampaign.tokenname.trim(),
          description           : this.state.currentCampaign.description.trim(),
          smartcontractaddress  : this.state.currentCampaign.smartcontractaddress,
          startdate             : this.state.currentCampaign.startdate,
          enddate               : this.state.currentCampaign.enddate,
          sponsor               : this.state.currentCampaign.sponsor,
          amount                : this.state.currentCampaign.amount,
          txntype               : 1,     // edit
          maker                 : this.state.currentUser.id,
          checker               : this.state.currentCampaign.checker,
          approver              : this.state.currentCampaign.approver,
          actionby              : this.state.currentUser.username,
          approvedcampaignid    : this.state.currentCampaign.id,
          name_changed          : (this.state.currentCampaign.name.trim() === this.state.originalCampaign.name.trim() ? 0 : 1),
          description_changed   : (this.state.currentCampaign.description.trim() === this.state.originalCampaign.description.trim() ? 0 : 1),
          startdate_changed     : (this.state.currentCampaign.startdate === this.state.originalCampaign.startdate ? 0 : 1),
          enddate_changed       : (this.state.currentCampaign.enddate === this.state.originalCampaign.enddate ? 0 : 1),
          sponsor_changed       : (this.state.currentCampaign.sponsor === this.state.originalCampaign.sponsor ? 0 : 1),
          amount_changed        : (this.state.currentCampaign.amount === this.state.originalCampaign.amount ? 0 : 1),
          name_original         : (this.state.currentCampaign.name.trim() !== this.state.originalCampaign.name.trim() ? this.state.originalCampaign.name.trim() : null),
          description_original  : (this.state.currentCampaign.description.trim() !== this.state.originalCampaign.description.trim() ? this.state.originalCampaign.description.trim() : null),
          startdate_original    : (this.state.currentCampaign.startdate !== this.state.originalCampaign.startdate ? this.state.originalCampaign.startdate: null),
          enddate_original      : (this.state.currentCampaign.enddate !== this.state.originalCampaign.enddate ? this.state.originalCampaign.enddate: null),
          sponsor_original      : (this.state.currentCampaign.sponsor !== this.state.originalCampaign.sponsor ? this.state.originalCampaign.sponsor: -1),
          amount_original       : (this.state.currentCampaign.amount !== this.state.originalCampaign.amount ? this.state.originalCampaign.amount: -1),
        };
    
        console.log("Form Validation passed! creating campaign...");

        console.log("IsLoad=true");
        this.show_loading();    // show progress
  
        await CampaignDataService.draftCreate(data)
          .then(response => {
            console.log("Response: ", response);
            console.log("IsLoad=false");
            this.hide_loading();
      
            this.setState({
              id                    : response.data.id,
              name                  : response.data.name,
              tokenname             : response.data.tokenname,
              description           : response.data.description,
              startdate             : response.data.startdate,
              enddate               : response.data.enddate,
              sponsor               : response.data.sponsor,
              smartcontractaddress  : response.data.smartcontractaddress,
              amount                : response.data.amount,
  
              submitted: true,
            });
  //          this.displayModal("Campaign draft submitted for review" + (response.data.smartcontractaddress !==""? " with smart contract deployed at "+response.data.smartcontractaddress + ". You can start minting now.": "." ) ,
  //                              "OK", null, null);
            this.displayModal("Campaign draft submitted for review.", "OK", null, null, null);
  
            //console.log("Responseeeee"+response.data);
        })
        .catch(e => {
            this.hide_loading();

            console.log("Error: ",e);
            console.log("Response error:",e.response.data.message);
            if (typeof(e.response.data.message)!="undefined" && e.response.data.message!==null && e.response.data.message!=="") 
              this.displayModal("Error: "+e.response.data.message+".\n\nPlease contact tech support.", null, null, null, "OK");
            else
              this.displayModal("Error: "+e.message+".\n\nPlease contact tech support.", null, null, null, "OK");
  
        });
        } else {
          console.log("Form Validation failed >>>");
        }
      } else {
        this.displayModal("Error: this role is only for maker.", null, null, null, "OK");
      }
  
      console.log("IsLoad=false");
      this.hide_loading();
  }

  async submitDeleteCampaign() {    

    if (this.state.isMaker) { // only for Makers
      if (await this.validateForm()) { 
        var data = {
          name                  : this.state.currentCampaign.name,
          tokenname             : this.state.currentCampaign.tokenname,
          description           : this.state.currentCampaign.description,
          smartcontractaddress  : this.state.currentCampaign.smartcontractaddress,
          startdate             : this.state.currentCampaign.startdate,
          enddate               : this.state.currentCampaign.enddate,
          sponsor               : this.state.currentCampaign.sponsor,
          amount                : this.state.currentCampaign.amount,
          txntype               : 2,     // delete
          maker                 : this.state.currentUser.id,
          checker               : this.state.currentCampaign.checker,
          approver              : this.state.currentCampaign.approver,
          actionby              : this.state.currentUser.username,
          approvedcampaignid    : this.state.currentCampaign.id,
        };
    
        console.log("submitDeleteCampaign Form Validation passed! ...");

        console.log("IsLoad=true");
        this.show_loading();  // show progress
  
        await CampaignDataService.draftCreate(data)
          .then(response => {
            console.log("Response: ", response);
            console.log("IsLoad=false");
            this.hide_loading();
      
            this.setState({
              id                    : response.data.id,
              name                  : response.data.name,
              tokenname             : response.data.tokenname,
              description           : response.data.description,
              startdate             : response.data.startdate,
              enddate               : response.data.enddate,
              sponsor               : response.data.sponsor,
              smartcontractaddress  : response.data.smartcontractaddress,
              amount                : response.data.amount,
  
              submitted: true,
            });
            this.displayModal("Campaign delete request submitted for review.", "OK", null, null, null);
  
            //console.log("Responseeeee"+response.data);
        })
        .catch(e => {
            this.hide_loading();
            console.log("Error: ",e);
            console.log("Response error:",e.response.data.message);
            if (typeof(e.response.data.message)!="undefined" && e.response.data.message!==null && e.response.data.message!=="") 
              this.displayModal("Error: "+e.response.data.message+".\n\nPlease contact tech support.", null, null, null, "OK");
            else
              this.displayModal("Error: "+e.message+".\n\nPlease contact tech support.", null, null, null, "OK");
  
        });
        } else {
          console.log("Form Validation failed >>>");
        }
      } else {
        this.displayModal("Error: this role is only for maker.", null, null, null, "OK");
      }
  
      console.log("IsLoad=false");
      this.hide_loading();  // hide progress
  }



  show_loading() {  // show progress
    this.setState({isLoading: true});
  }
  hide_loading(){  // hide progress
    this.setState({isLoading: false});
  }

  showModal_nochange = () => {
    this.displayModal("There is no changes made, please update before proceedng.", null, null, null, "OK");
  };

  showModal_Leave = () => {
    this.displayModal("You have made changes. Are you sure you want to leave this page without submitting?", "Yes, leave", null, null, "Cancel");
  };

  showModalDelete = () => {
    this.displayModal("Are you sure you want to delete this campaign?", null, "Yes, delete", null, "Cancel");
  };

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
              <strong>View {this.state.isMaker? "/ Edit" :null} Campaign</strong>
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
                        value={currentCampaign.name}
                        onChange={this.onChangeName}
                        disabled={!this.state.isMaker}
                        />
                    </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    id="description"
                    required
                    value={currentCampaign.description}
                    onChange={this.onChangeDescription}
                    name="description"
                    autoComplete="off"
                    disabled={!this.state.isMaker}
                    />
                </div>

                <div className="form-group">
                  <label htmlFor="tokenname">Token Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="tokenname"
                    maxLength="9"
                    required
                    value={currentCampaign.tokenname}
                    onChange={this.onChangeTokenName}
                    name="tokenname"
                    style={{textTransform : "uppercase"}}
                    disabled={true}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="blockchain">Blockchain *</label>
                  <select
                        onChange={this.onChangeBlockchain}                         
                        className="form-control"
                        id="blockchain"
                        disabled={true}
                        >
                        <option value="80001"            >Polygon   Testnet Mumbai</option>
                        <option value="11155111" disabled>Ethereum  Testnet Sepolia (not in use at the moment)</option>
                        <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                        <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                        <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                        <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
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
                        disabled={!this.state.isMaker}
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
                        disabled={!this.state.isMaker}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="sponsor">Sponsor</label>
                      <select
                        value={currentCampaign.sponsor}
                        onChange={this.onChangeSponsor}                         
                        className="form-control"
                        id="sponsor"
                        disabled={!this.state.isMaker}
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
                        disabled={!this.state.isMaker}
                        />
                    </div>                
                    {    this.state.isMaker? 
                    <div className="form-group">
                      <label htmlFor="checker">Checker *</label>
                      <select
                            value={currentCampaign.checker}
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
                    : null
                    }
                    {    this.state.isMaker? 
                    <div className="form-group">
                      <label htmlFor="approver">Approver *</label>
                      <select
                          value={currentCampaign.approver}
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
                    : null}
                  </form>
                  { this.state.isMaker?
                    ((this.state.datachanged) ? 
                        <button
                          type="submit"
                          className="m-3 btn btn-sm btn-primary"
                          onClick={this.submitUpdateCampaign}
                        >
                          Update
                        </button> 
                      :
                        <button
                        type="submit"
                        className="m-3 btn btn-sm btn-primary"
                        onClick={this.showModal_nochange}
                        >
                          Update
                        </button> 
                    )
                    : 
                    <Link to="/campaign">
                    <button className="m-3 btn btn-sm btn-secondary">
                      Back
                    </button>
                    </Link>
 
                  }

  &nbsp;
  { this.state.isMaker?

                  <button
                    className="m-3 btn btn-sm btn-danger"
                    onClick={this.showModalDelete}
                  >
                    Delete
                  </button>
                  : null}
  &nbsp;
  { this.state.isMaker?

                   ((this.state.datachanged) ? 
                    <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>
                      Cancel
                    </button>
                    : 
                    <Link to="/campaign">
                    <button className="m-3 btn btn-sm btn-secondary">
                      Cancel
                    </button>
                    </Link>
                   )
                   : null
                   }


                  {this.state.isLoading ? <LoadingSpinner /> : null}

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/campaign'} handleProceed2={this.submitDeleteCampaign} handleProceed3={null} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
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