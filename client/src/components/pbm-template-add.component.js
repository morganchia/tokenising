import React, { Component } from "react";
import { Link, Navigate } from "react-router-dom";
import PBMDataService from "../services/pbm.service";
import CampaignDataService from "../services/campaign.service";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import AuthService from "../services/auth.service";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";

export default class PBMEdit extends Component {
  constructor(props) {
    super(props);
    this.onChangeDatafield1_name = this.onChangeDatafield1_name.bind(this);
    this.onChangeDatafield1_value = this.onChangeDatafield1_value.bind(this);
    this.onChangeDatafield2_name = this.onChangeDatafield2_name.bind(this);
    this.onChangeDatafield2_value = this.onChangeDatafield2_value.bind(this);
    this.onChangeOperator1 = this.onChangeOperator1.bind(this);

    this.onChangeTemplateName = this.onChangeTemplateName.bind(this);
    this.onChangeTokenName = this.onChangeTokenName.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeUnderlying = this.onChangeUnderlying.bind(this);

    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.onChangeSponsor = this.onChangeSponsor.bind(this);
    this.onChangeAmount = this.onChangeAmount.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.createPBMTemplate = this.createPBMTemplate.bind(this);
    this.newPBM = this.newPBM.bind(this);

    this.state = {
/*
      UnderlyingDSGDList: {
        id: null,
        name: "",
        tokenname: "",
        description: "",
        underlyingTokenID: "",
        underlyingDSGDsmartcontractaddress: "",
        walletaddress: "",
        bank: "",
        bankaccount: "",
        type: ""
      },
*/
      recipientList: {
        id: null,
        name: "",
        tokenname: "",
        description: "",
        walletaddress: "",
        bank: "",
        bankaccount: "",
        type: ""
      },

      checkerList: {
        id: null,
        username: "",
      },
      approverList: {
        id: null,
        username: "",
      },

      PBMTemplatesList: {
        id: null,
        templatename: "",
      },

      id: null,
      datafield1_name: "",
      datafield1_value: "",
      datafield2_name: "",
      datafield2_value: "",
      operator1: "",
      adddatafield: false,
      operator2: "",
      hidedatafield1 : false,
      hidedatafield2 : false,
      templatename: "",

      tokenname: "",
      description: "",
      underlyingTokenID: "",

      startdate: "",
      enddate: "",
      sponsor: "",
      amount: "",
      checker: "",
      approver: "",

      currentUser: undefined,
      isMaker: false,
      isChecker: false,
      isApprover: false,
      
      actionby: undefined,
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

  onChangeDatafield1_name(e) {
    this.setState({
      datafield1_name: e.target.value,
      datachanged: true
    });

    if (e.target.value === "") 
      this.setState({
        hidedatafield1 : false
      })
    else 
      this.setState({
        hidedatafield1 : true
      });
  }

  onChangeDatafield2_name(e) {
    this.setState({
      datafield2_name: e.target.value,
      datachanged: true
    });
    if (e.target.value === "") 
    this.setState({
      hidedatafield2 : false
    })
  else 
    this.setState({
      hidedatafield2 : true
    })
  }

  onChangeDatafield1_value(e) {
    this.setState({
      datafield1_value: e.target.value,
      datachanged: true
    });
  }

  onChangeDatafield2_value(e) {
    this.setState({
      datafield2_value: e.target.value,
      datachanged: true
    });
  }

  onChangeOperator1(e) {
    this.setState({
      operator1: e.target.value,
      datachanged: true
    });
    if (e.target.value === "") {
      this.setState({
        datafield2_name: "",
        datafield2_value: "",
        hidedatafield2: true,
      });
    } else {
      this.setState({
        hidedatafield2: false,
      });
    }
  }

  onChangeTemplateName(e) {
    this.setState({
      templatename: e.target.value,
      datachanged: true
    });
  }

  onChangeTokenName(e) {
    this.setState({
      tokenname: e.target.value.toUpperCase(),
      datachanged: true
    });
  }

  onChangeDescription(e) {
    this.setState({
      description: e.target.value,
      datachanged: true
    });
  }
/*
  onChangeUnderlying(e) {
    const underlyingTokenID = e.target.value;

//    console.log("Underlying smartcontractaddress=", this.state.underlyingDSGDList.filter((xx) => xx.id === e.target.value));
//    console.log("Underlying smartcontractaddress=", this.state.underlyingDSGDList.find( (xx) => xx.id === e.target.value));

    this.setState({
      underlyingTokenID: underlyingTokenID,
      datachanged: true
    });
  }
*/

  onChangeUnderlying(e) {
    const underlyingTokenID = e.target.value;
    console.log("New underlying=", underlyingTokenID);
    const newBlockchain = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
    console.log("New blockchain=", newBlockchain);

// when underlying changes, blockchain might change also bccos underlying could be in different blockchain
    this.setState({
      underlyingTokenID: underlyingTokenID,
      blockchain: newBlockchain,
      datachanged: true
    });
  }

  onChangeStartDate(e) {
    this.setState({
      startdate: e.target.value,
      datachanged: true
    });
  }

  onChangeEndDate(e) {
    this.setState({
      enddate: e.target.value,
      datachanged: true
    });
  }

  onChangeSponsor(e) {
    const sponsor = e.target.value;

    this.setState({
      sponsor: sponsor,
      datachanged: true
    });
  }

  onChangeAmount(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");  // remove . and other chars
    const amount = e.target.value;
    
    /*
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentPBM: {
        ...prevState.currentPBM,
        amount: amount
      }
    }));
    */
    this.setState({
      amount: amount,
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

    if (!(typeof this.state.templatename ==='string' || this.state.templatename instanceof String)) {
      err += "- Template Name cannot be empty\n";
    } else if ((this.state.templatename.trim() === "")) {
      err += "- Template Name cannot be empty\n"; 
    } else {
      await PBMDataService.findByTemplateNameExact(this.state.templatename.trim())
      .then(response => {
        console.log("Find duplicate template name:",response.data);

        if (response.data.length > 0) {
          err += "- Template Name of pbm is already present (duplicate name)\n";
          console.log("Found pbm template name (duplicate!):"+this.state.templatename);
        } else {
          console.log("Didnt find pbm template name1 (ok no duplicate):"+this.state.templatename);
        }
      })
      .catch(e => {
        console.log("Didnt find pbm template name2 (ok no duplicate):"+this.state.templatename);
        // ok to proceed
      });
    }

    if (!(typeof this.state.tokenname ==='string' || this.state.tokenname instanceof String)) {
      err += "- Token Name cannot be empty\n";
    } else 
      if (this.state.tokenname.trim() === "") err += "- Token Name cannot be empty\n";
    
    // dont need t check description, it can be empty
    if (this.state.underlyingTokenID === "") err += "- Underlying DSGD cannot be empty\n";
    if (! validator.isDate(this.state.startdate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.enddate)) err += "- End Date is invalid\n";
    if (this.state.sponsor === "") err += "- Sponsor cannot be empty\n";
//    if (this.state.amount === "") err += "- Amount cannot be empty\n";
//    if (this.state.checker === "") err += "- Checker cannot be empty\n";
//    if (this.state.approver === "") err += "- Approver cannot be empty\n";
    if (this.state.startdate.trim() !== "" && this.state.enddate.trim() !== "" && this.state.startdate > this.state.enddate) err += "- Start date cannot be later than End date\n";    
/*    
    if (this.state.checker === this.state.currentUser.id.toString() 
        && this.state.approver === this.state.currentUser.id.toString()) {
      err += "- Maker, Checker and Approver cannot be the same person\n";
    } else {
      if (this.state.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
      if (this.state.checker!==null && this.state.checker!=="" 
            && this.state.checker === this.state.approver) err += "- Checker and Approver cannot be the same person\n";
    }
*/
    console.log("user:'"+this.state.currentUser.id+"'");
    console.log("checker:'"+this.state.checker+"'");
    console.log("start date:'"+this.state.startdate+"'");
    console.log("end date:'"+this.state.enddate+"'");
    console.log("Start > End? "+ (this.state.startdate > this.state.enddate));

    if (err !== '') {
      err = "Form validation issues found:\n"+err;
      this.displayModal(err, null, null, null, "OK");      

      err = ""; // clear var

      return false;
    }

    return true;
  }

  async createPBMTemplate() {  // for Maker


    if (this.state.isMaker) {  // only for Makers

      if (await this.validateForm() === true) { 

        console.log("Creating PBM template this.state.underlyingDSGDList= ", this.state.underlyingDSGDList);
        console.log("Creating PBM template underlyingDSGDsmartcontractaddress= ", this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.underlyingTokenID)).smartcontractaddress);
    
        var data = {
          templatename      : this.state.templatename,
          tokenname         : this.state.tokenname,
          description       : this.state.description,

          datafield1_name   : this.state.datafield1_name,
          datafield1_value  : this.state.datafield1_value,
          operator1         : this.state.operator1,
          datafield2_name   : this.state.datafield2_name,
          datafield2_value  : this.state.datafield2_value,

          underlyingTokenID : this.state.underlyingTokenID,
          underlyingDSGDsmartcontractaddress  : this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.underlyingTokenID)).smartcontractaddress,
          startdate         : this.state.startdate,
          enddate           : this.state.enddate,
          sponsor           : this.state.sponsor,
          amount            : this.state.amount,
          txntype           : 0,    // create
//          maker             : this.state.currentUser.id,
//          checker           : this.state.checker,
//          approver          : this.state.approver,
          actionby          : this.state.currentUser.username,
          approvedpbmid: -1,
        };
  
        console.log("Form Validation passed! creating pbm template...");
        //alert("Form validation passed! creating pbm template...");

        console.log("IsLoad=true");
        this.show_loading();  // show progress


        await PBMDataService.templateCreate(data)
        .then(response => {
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();  // hide progress
    
          this.setState({
            id: response.data.id,
            name: response.data.name,
            tokenname: response.data.tokenname,
            description: response.data.description,
            underlyingTokenID: response.data.underlyingTokenID,
            startdate: response.data.startdate,
            enddate: response.data.enddate,
            sponsor: response.data.sponsor,
            smartcontractaddress: response.data.smartcontractaddress,
            amount: response.data.amount,

            submitted: true,

          });
//          this.displayModal("PBM draft submitted for review" + (response.data.smartcontractaddress !==""? " with smart contract deployed at "+response.data.smartcontractaddress + ". You can start minting now.": "." ) ,
//                              "OK", null, null);
          this.displayModal("PBM template is created, you may use it to create a PBM now.", "OK", null, null, null);

          //console.log("Responseeeee"+response.data);
        })
        .catch(e => {
        
          this.hide_loading();  // hide progress

          console.log("Error: ",e);
          console.log("Response error:",e.response.data.message);
          if (e.response.data.message !== "") 
            this.displayModal("Error: "+e.response.data.message+".\n\nPlease contact tech support.", null, null, null, "OK");
          else
            this.displayModal("Error: "+e.message+".\n\nPlease contact tech support.", null, null, null, "OK");
        });
      } else {
        console.log("Form Validation failed >>>");
        //alert("Form Validation failed >>>");
        this.hide_loading();  // hide progress
      }
    } else {
      this.displayModal("Error: this role is only for maker.", null, null, null, "OK");
    }

    console.log("IsLoad=false");
    this.hide_loading();  // hide progress

  }

  newPBM() {
    this.setState({
      id: null,
      name: "",
      tokenname: "",
      description: "",
      underlyingTokenID: "",
      startdate: "",
      enddate: "",
      sponsor: "",
      amount: "",

      currentUser: undefined,
      actionby: undefined,
      datachanged: false,
      submitted: false
    });
  }

  getAllUnderlyingAssets() {
    CampaignDataService.getAll()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            underlyingDSGDList: [ { id:-1, name:"No campaign available, please create a campaign first."}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            underlyingDSGDList: [first_array_record].concat(response.data)
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }
/*
  retrievePBM() {
    PBMDataService.getAll()
      .then(response => {
        this.setState({
          pbm: response.data
        });
        console.log("Response data from retrievePBM() PBMDataService.getAll:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }
*/
  getAllPBMTemplates() {
    PBMDataService.getAllPBMTemplates()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            PBMTemplatesList: [ { id:-1, name:"Error retrieving templates"}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            PBMTemplatesList: [first_array_record].concat(response.data)
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }

  getAllSponsors() {
    RecipientDataService.findAllRecipients()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            recipientList: [ { id:-1, name:"No recipients available, please create a recipient first."}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            recipientList: [first_array_record].concat(response.data)
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }

  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("pbm")
      .then(response => {
        console.log("Data received by getAllCheckerApprovers:", response.data);
        let chkList = response.data.find(element => element.name.toUpperCase() === "CHECKER");
        let apprList = response.data.find(element => element.name.toUpperCase() === "APPROVER");

        const first_array_record = [{}];
        this.setState({
          checkerList: [first_array_record].concat(chkList.user || []), // Fallback to empty array
          approverList: [first_array_record].concat(apprList.user || []) // Fallback to empty array
        });
        console.log("checkerList: ", chkList.user);
        console.log("approverList: ", apprList.user);      
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

    this.getAllUnderlyingAssets();
    this.getAllSponsors();
    this.getAllPBMTemplates();
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
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { underlyingDSGDList, recipientList, PBMTemplatesList, checkerList, approverList } = this.state;
    console.log("Render underlyingDSGDList:", underlyingDSGDList);
    console.log("Render recipientList:", recipientList);
    console.log("Render PBMTemplatesList:", PBMTemplatesList);

    return (
      <div className="container">
      {(this.state.userReady) ?
        <div>
        <header className="jumbotron col-md-8">
          <h3>
            <strong>Create PBM Template ({ (this.state.isMaker? "Maker" : (this.state.isChecker? "Checker": (this.state.isApprover? "Approver":null)) )})</strong>
          </h3>
        </header>

        </div>: null}

          <div className="submit-form list-row">
            <h4> </h4>
              <div className="col-md-8">
                <div className="form-group">
                  <label htmlFor="name">PBM Template Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    maxLength="45"
                    required
                    value={this.state.templatename}
                    onChange={this.onChangeTemplateName}
                    name="name"
                    autoComplete="off"
                    disabled={!this.state.isMaker}
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
                    value={this.state.description}
                    onChange={this.onChangeDescription}
                    name="description"
                    autoComplete="off"
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">PBM Token Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="tokenname"
                    maxLength="9"
                    required
                    value={this.state.tokenname}
                    onChange={this.onChangeTokenName}
                    name="tokenname"
                    autoComplete="off"
                    style={{textTransform : "uppercase"}}
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">Underlying DSGD *</label>
                  <select
                        onChange={this.onChangeUnderlying}                         
                        className="form-control"
                        id="underlyingTokenID"
                        disabled={!this.state.isMaker}
                      >
                        <option value=""> </option>
                        {
                          Array.isArray(underlyingDSGDList) ?
                          underlyingDSGDList.map( (d) => {
                              if (typeof d.id === "number")
                              return <option value={d.id}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                            })
                          : null
                        }
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Blockchain to Deploy at</label>
                  <select
                        onChange={this.onChangeBlockchain}                         
                        className="form-control"
                        id="blockchain"
                        disabled="true"
                      >
                        <option >   </option>
                        <option value="80002"  selected={this.state.blockchain === 80002}>Polygon   Testnet Amoy</option>
                        <option value="11155111" selected={this.state.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                        <option value="80001"  selected={this.state.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                        <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                        <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                        <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                        <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                      </select>
                </div>

                <label htmlFor="datafield1_name">PBM Conditions</label>

                <table style={{border : '1px solid blue', width: '100%'}}>
                <tr>
{/*
                  <td style={{fontSize:"100px", border:"0"}}>(</td>
*/}
                  <td style={{border : '0'}}>
                    <div className="form-group" id="datafield1_name_div" style={{ display: this.state.hidedatafield1 ? "none" : "block" }}>
                      <label htmlFor="datafield1_name">{this.state.datafield1_name === ""? "Please choose a field" : ""}</label>
                      <select
                        onChange={this.onChangeDatafield1_name}                         
                        className="form-control"
                        id="datafield1_name"
                        name="datafield1_name"

                        disabled={!this.state.isMaker}
                      >
                        <option value=""></option>
                        <option value="UEN">UEN</option>
                        <option value="IndustryCode">Industry code</option>
                        <option value="Location">Location</option>
                        <option value="PostalCode">Postal code</option>
                      </select>
                    </div>
                    { this.state.datafield1_name !=="" && (
                    <div className="form-group">
                      <label onClick={() => this.setState({ hidedatafield1: false })} htmlFor="datafield1_value">{this.state.datafield1_name} &nbsp;<i class="bx bx-cog" /></label>
                      <input
                        className="form-control"
                        id="datafield1_value"
                        name="datafield1_value"
                        maxLength="16"
                        required
                        value={this.state.datafield1_value}
                        onChange={this.onChangeDatafield1_value}
                        autoComplete="off"
                        disabled={!this.state.isMaker}
                      />
                    </div>
                    )
                  }
                  </td>
                  { this.state.datafield1_name !=="" && this.state.datafield1_value !=="" && !this.state.adddatafield && (
                  <td style={{border : '0'}}>
                    <label htmlFor="operator1">&nbsp;</label>
                    <div className="form-group">
                    <button onClick={() => this.setState({ adddatafield: true })} className="btn btn-primary">Add more condition?</button>
                    </div>
                  </td>
                  )
                  }
                  { this.state.datafield1_name !=="" && this.state.datafield1_value !=="" && this.state.adddatafield && (
                  <td style={{border : '0'}}>
                    <div className="form-group">
                      <label htmlFor="operator1">{this.state.operator1 === ""? "Please choose an operator" : ""}&nbsp;</label>
                      <select style={{width: "90px"}}
                            onChange={this.onChangeOperator1}                         
                            className="form-control"
                            id="operator1"
                            disabled={!this.state.isMaker}
                          >
                            <option value=""></option>
                            <option value="OR" > OR </option>
                            <option value="AND"> AND </option>
                      </select>
                    </div>
                  </td>
                  )
                  }
                  <td style={{border : '0'}}>
                  {  this.state.operator1 !=="" && this.state.datafield1_name !=="" && this.state.datafield1_value !=="" && (
                    <div className="form-group" id="datafield2_name_div" style={{ display: this.state.hidedatafield2 ? "none" : "block" }}>
                    <label htmlFor="datafield2_name">{this.state.datafield2_name === ""? "Please choose a field" : ""}</label>
                    <select
                      onChange={this.onChangeDatafield2_name}                         
                      className="form-control"
                      id="datafield2_name"
                      name="datafield2_name"

                      disabled={!this.state.isMaker}
                    >
                      <option value=""></option>
                      <option value="UEN">UEN</option>
                      <option value="IndustryCode">Industry code</option>
                      <option value="Location">Location</option>
                      <option value="PostalCode">Postal code</option>
                    </select>
                  </div>
                  )}
                  { this.state.datafield2_name !=="" &&  this.state.operator1 !=="" && this.state.datafield1_name !=="" && this.state.datafield1_value !=="" && (
                  <div className="form-group">
                      <label onClick={() => this.setState({ hidedatafield2: false })} htmlFor="datafield2_value">{this.state.datafield2_name} &nbsp;<i class="bx bx-cog" /></label>
                    <input
                      className="form-control"
                      id="datafield2_value"
                      name="datafield2_value"
                      maxLength="16"
                      required
                      value={this.state.datafield2_value}
                      onChange={this.onChangeDatafield2_value}
                      autoComplete="off"
                      disabled={!this.state.isMaker}
                    />
                  </div>
                  )}
                  </td>
{/*
                  <td style={{fontSize:"100px", border:"0"}}>)</td>
*/}
                </tr>
                </table>
                <br/>

                <div className="form-group">
                  <label htmlFor="startdate">Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="startdate"
                    required
                    value={this.state.startdate}
                    onChange={this.onChangeStartDate}
                    name="startdate"
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="enddate">End Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="enddate"
                    required
                    value={this.state.enddate}
                    onChange={this.onChangeEndDate}
                    name="enddate"
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sponsor">Sponsor *</label>
                  <select
                        onChange={this.onChangeSponsor}                         
                        className="form-control"
                        id="sponsor"
                        disabled={!this.state.isMaker}
                      >
                        {
                          Array.isArray(recipientList) ?
                          recipientList.map( (d) => {
                              return <option value={d.id}>{d.name}</option>
                            })
                          : null
                        }
                      </select>
                </div>
{/*
                <div className="form-group">
                  <label htmlFor="amount">Max Amount of PBM to issue * (only integers without decimals)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="amount"
                    min="0"
                    step="1"
                    required
                    value={this.state.amount}
                    onChange={this.onChangeAmount}
                    name="amount"
                    autoComplete="off"
                    disabled={!this.state.isMaker}
                  />
                </div>
<br/>
<br/>
<hr/>
                
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
*/}

                { this.state.isMaker?
                  <button onClick={this.createPBMTemplate} className="btn btn-primary">
                    Save Template
                  </button>
                : null
                }
                { this.state.isMaker?
                 (this.state.datachanged) ? 
                  <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>
                    Cancel
                  </button>
                  : 
                  <Link to="/pbmtemplate">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Cancel
                  </button>
                  </Link>
                : 
                  <Link to="/pbmtemplate">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Back
                  </button>
                  </Link>
                }
                  {this.state.isLoading ? <LoadingSpinner /> : null}

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/pbmtemplate'} handleProceed2={null} handleProceed3={null} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                    {this.state.modalmsg}
                  </Modal>

                  <p>{this.state.message}</p>

              </div>
          </div>
      </div>
    );
  }
}
