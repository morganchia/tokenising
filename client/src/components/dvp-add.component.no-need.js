import React, { Component } from "react";
import { Link, Navigate } from "react-router-dom";
import DvPDataService from "../services/dvp.service.js";
import CampaignDataService from "../services/campaign.service.js";
import PBMDataService from "../services/pbm.service.js";
import RecipientDataService from "../services/recipient.service.js";
import UserOpsRoleDataService from "../services/user_opsrole.service.js";
import AuthService from "../services/auth.service.js";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";

export default class DvPEdit extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeUnderlying1 = this.onChangeUnderlying1.bind(this);
    this.onChangeUnderlying2 = this.onChangeUnderlying2.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.onChangeCounterParty1 = this.onChangeCounterParty1.bind(this);
    this.onChangeCounterParty2 = this.onChangeCounterParty2.bind(this);
    this.onChangeAmount1 = this.onChangeAmount1.bind(this);
    this.onChangeAmount2 = this.onChangeAmount2.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.createDvP = this.createDvP.bind(this);
    this.newDvP = this.newDvP.bind(this);

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


      id: null,
      name: "",
      description: "",
      underlyingTokenID1: "",
      underlyingTokenID2: "",
      blockchain: "",
      counterparty1: "",
      counterparty2: "",
      amount1: "",
      amount2: "",
      startdate: "",
      enddate: "",

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

  onChangeName(e) {
    this.setState({
      name: e.target.value,
      datachanged: true
    });
  }

  onChangeDescription(e) {
    this.setState({
      description: e.target.value,
      datachanged: true
    });
  }

  onChangeUnderlying1(e) {
    const underlyingTokenIDx = e.target.value;
    console.log("New underlying=", underlyingTokenIDx);
    var newBlockchain;

    if (underlyingTokenIDx === "") 
      newBlockchain = "";
    else {
      if (underlyingTokenIDx < 1000000000) { // cash token
        newBlockchain = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenIDx)).blockchain;
        console.log("New blockchain=", newBlockchain);
      } else if (underlyingTokenIDx < 2000000000) { // PBM token
        newBlockchain = this.state.PBMList.find((ee) => ee.id === parseInt(underlyingTokenIDx)).blockchain;
        console.log("New blockchain=", newBlockchain);
      }
    }

// when underlying changes, blockchain might change also bccos underlying could be in different blockchain
    this.setState({
      underlyingTokenID1: underlyingTokenIDx,
      blockchain: newBlockchain,
      datachanged: true
    });
  }

  onChangeUnderlying2(e) {
    const underlyingTokenIDx = e.target.value;
    console.log("New underlying=", underlyingTokenIDx);

    this.setState({
      underlyingTokenID2: underlyingTokenIDx,
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

  onChangeCounterParty1(e) {
    const counterpartyx = e.target.value;

    this.setState({
      counterparty1: counterpartyx,
      datachanged: true
    });
  }

  onChangeCounterParty2(e) {
    const counterpartyx = e.target.value;

    this.setState({
      counterparty2: counterpartyx,
      datachanged: true
    });
  }

  onChangeAmount1(e) {
    const amount1 = e.target.value.replace(/[^0-9]/g, "");  // remove . and other chars
    
    /*
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentDvP: {
        ...prevState.currentDvP,
        amount: amount
      }
    }));
    */
    this.setState({
      amount1: amount1,
      datachanged: true
    });
  }

  onChangeAmount2(e) {
    const amount2 = e.target.value.replace(/[^0-9]/g, "");  // remove . and other chars
    
    this.setState({
      amount2: amount2,
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

    if (!(typeof this.state.name ==='string' || this.state.name instanceof String)) {
      err += "- Name cannot be empty\n";
    } else if ((this.state.name.trim() === "")) {
      err += "- Name cannot be empty\n"; 
    } else {
      await DvPDataService.findByNameExact(this.state.name.trim())
      .then(response => {
        console.log("Find duplicate name:",response.data);

        if (response.data.length > 0) {
          err += "- Name of dvp is already present (duplicate name)\n";
          console.log("Found dvp name (duplicate!):"+this.state.name);
        } else {
          console.log("Didnt find dvp name1 (ok no duplicate):"+this.state.name);
        }
      })
      .catch(e => {
        console.log("Didnt find dvp name2 (ok no duplicate):"+this.state.name);
        // ok to proceed
      });
    }
    
    // dont need t check description, it can be empty
    if (this.state.underlyingTokenID1 === "") err += "- Token 1 cannot be empty\n"; 
    if (this.state.underlyingTokenID2 === "") {
      err += "- Token 2 cannot be empty\n" 
    } else if (this.state.underlyingTokenID1 === this.state.underlyingTokenID2) err += "- both tokens must be different\n"; 
    if (this.state.counterparty1 === "") err += "- Counterparty1 cannot be empty\n";
    if (this.state.counterparty2 === "") { 
      err += "- Counterparty2 cannot be empty\n"; 
    } else if (this.state.counterparty1 === this.state.counterparty2) err += "- Counterparties must be different\n";

    if (this.state.amount1 === "" || parseInt(this.state.amount1) === 0 ) err += "- Token 1 Amount cannot be empty\n";
    if (this.state.amount2 === "" || parseInt(this.state.amount2) === 0 ) err += "- Token 2 Amount cannot be empty\n";
    
    if (! validator.isDate(this.state.startdate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.enddate)) err += "- End Date is invalid\n";
    if (this.state.startdate.trim() !== "" && this.state.enddate.trim() !== "" && this.state.startdate > this.state.enddate) err += "- Start date cannot be later than End date\n";  

    if (this.state.checker === "") err += "- Checker cannot be empty\n";
    if (this.state.approver === "") err += "- Approver cannot be empty\n";
    if (this.state.checker === this.state.currentUser.id.toString() 
        && this.state.approver === this.state.currentUser.id.toString()) {
      err += "- Maker, Checker and Approver cannot be the same person\n";
    } else {
      if (this.state.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
      if (this.state.checker!==null && this.state.checker!=="" 
            && this.state.checker === this.state.approver) err += "- Checker and Approver cannot be the same person\n";
    }
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

  async createDvP() {  // for Maker

    if (this.state.isMaker) {  // only for Makers
      
        if (await this.validateForm() === true) { 

        console.log("Creating DvP draft this.state.underlyingDSGDList= ", this.state.underlyingDSGDList);
        if (this.state.underlyingTokenID1 < 1000000000) { // DSGD 1 ~ 1000000000,   PBM > 1000000000
          console.log("Creating DvP draft underlyingDSGDsmartcontractaddress1= ", this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.underlyingTokenID1)).smartcontractaddress);
        } else {
          console.log("Creating DvP draft underlyingPBMsmartcontractaddress1= ", this.state.PBMList.find((e) => e.id === parseInt(this.state.underlyingTokenID1)).smartcontractaddress);
        }

        if (this.state.underlyingTokenID2 < 1000000000) { // DSGD 1 ~ 1000000000,   PBM > 1000000000
          console.log("Creating DvP draft underlyingDSGDsmartcontractaddress2= ", this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.underlyingTokenID2)).smartcontractaddress);  
        } else {
          console.log("Creating DvP draft underlyingPBMsmartcontractaddress2= ", this.state.PBMList.find((e) => e.id === parseInt(this.state.underlyingTokenID2)).smartcontractaddress);  
        }

        var data = {
          name               : this.state.name,
          description        : this.state.description,

          counterparty1      : this.state.counterparty1,
          counterparty2      : this.state.counterparty2,
          underlyingTokenID1 : this.state.underlyingTokenID1,
          underlyingTokenID2 : this.state.underlyingTokenID2,
          smartcontractaddress1  : (this.state.underlyingTokenID1 < 1000000000 ? this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.underlyingTokenID1)).smartcontractaddress : this.state.PBMList.find((e) => e.id === parseInt(this.state.underlyingTokenID1)).smartcontractaddress),
          smartcontractaddress2  : (this.state.underlyingTokenID2 < 1000000000 ? this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.underlyingTokenID2)).smartcontractaddress : this.state.PBMList.find((e) => e.id === parseInt(this.state.underlyingTokenID2)).smartcontractaddress),
          blockchain         : this.state.blockchain,
          amount1            : this.state.amount1,
          amount2            : this.state.amount2,
          startdate          : this.state.startdate,
          enddate            : this.state.enddate,
          txntype            : 0,    // create
          maker              : this.state.currentUser.id,
          checker            : this.state.checker,
          approver           : this.state.approver,
          actionby           : this.state.currentUser.username,
          approveddvpid      : -1,
        };
    
        console.log("Form Validation passed! creating dvp smart contract...");
        //alert("Form validation passed! creating dvp...");

        console.log("IsLoad=true");
        this.show_loading();  // show progress


        await DvPDataService.draftCreate(data)
        .then(response => {
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();  // hide progress
    
          this.setState({
            id                  : response.data.id,
            name                : response.data.name,
            description         : response.data.description,
  
            underlyingTokenID1  : response.data.underlyingTokenID1,
            underlyingTokenID2  : response.data.underlyingTokenID2,
            smartcontractaddress1: response.data.smartcontractaddress1,
            smartcontractaddress2: response.data.smartcontractaddress2,
            startdate           : response.data.startdate,
            enddate             : response.data.enddate,
            counterparty1       : response.data.counterparty1,
            counterparty2       : response.data.counterparty2,
            amount1             : response.data.amount1,
            amount2             : response.data.amount2,

            submitted: true,

          });
//          this.displayModal("DvP draft submitted for review" + (response.data.smartcontractaddress !==""? " with smart contract deployed at "+response.data.smartcontractaddress + ". You can start minting now.": "." ) ,
//                              "OK", null, null);
          this.displayModal("DvP smart contract creation request submitted for review.", "OK", null, null, null);

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

  newDvP() {
    this.setState({
      id: null,
      name: "",
      description: "",
      
      underlyingTokenID1: "",
      underlyingTokenID2: "",
      startdate: "",
      enddate: "",
      counterparty1: "",
      counterparty2: "",
      amount1: "",
      amount2: "",

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

    PBMDataService.getAll()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            PBMList: [ { id:-1, name:""}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            PBMList: [first_array_record].concat(response.data)
          });
        }
        console.log("Response data from retrievePBM() PBMDataService.getAll:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }

  getAllcounterpartys() {
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
    UserOpsRoleDataService.getAllMakersCheckersApprovers("dvp")
      .then(response => {
        console.log("Data received by getAllCheckerApprovers:", response.data);
        let chkList = response.data.find((element) => {
          //var el_id = element.id;                       console.log("typeof(el_id)", typeof(el_id));
          //console.log("element.name:", element.name);   console.log("typeof(element.name)", typeof(element.name));
          try {
            if (element.name.toUpperCase() === "CHECKER") 
              return element;
          } catch(e) {
            // do nothing, sometime when dvpList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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
            // do nothing, sometime when dvpList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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

    this.getAllUnderlyingAssets();
    this.getAllcounterpartys();
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

    const { underlyingDSGDList, PBMList, recipientList, checkerList, approverList } = this.state;
    console.log("Render underlyingDSGDList:", underlyingDSGDList);
    console.log("Render PBMList:", PBMList);
    console.log("Render recipientList:", recipientList);

    return (
      <div className="container">
      {(this.state.userReady) ?
        <div>
        <header className="jumbotron col-md-8">
          <h3>
            <strong>Create DvP ({ (this.state.isMaker? "Maker" : (this.state.isChecker? "Checker": (this.state.isApprover? "Approver":null)) )})</strong>
          </h3>
        </header>

        </div>: null}

          <div className="submit-form list-row">
            <h4> </h4>
              <div className="col-md-8">
                <div className="form-group">
                  <label htmlFor="name">DvP Smart Contract Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    maxLength="45"
                    required
                    value={this.state.name}
                    onChange={this.onChangeName}
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
                  <label htmlFor="counterparty1">Counterparty 1 Wallet Addr *</label>
                  <select
                        onChange={this.onChangeCounterParty1}                         
                        className="form-control"
                        id="counterparty1"
                        disabled={!this.state.isMaker}
                      >
                        <option value=""> </option>
                        {
                          Array.isArray(recipientList) ?
                          recipientList.map( (d) => {
                              // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              if (typeof d.id === "number")
                                return <option value={d.walletaddress} selected={d.walletaddress === this.state.counterparty1}>{d.name} ({d.walletaddress})</option>
                            })
                          : null
                        }
                      </select>
                </div>
                <div className="form-group">
                  <label htmlFor="counterparty2">Counterparty 2 Wallet Addr *</label>
                  <select
                        onChange={this.onChangeCounterParty2}                         
                        className="form-control"
                        id="counterparty2"
                        disabled={!this.state.isMaker}
                      >
                        <option value=""> </option>
                        {
                          Array.isArray(recipientList) ?
                          recipientList.map( (d) => {
                              // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              if (typeof d.id === "number")
                                return <option value={d.walletaddress} selected={d.walletaddress === this.state.counterparty2}>{d.name} ({d.walletaddress})</option>
                            })
                          : null
                        }
                      </select>
                </div>
                <div className="form-group">
                  <label htmlFor="name">Token 1 *</label>
                  <select
                        onChange={this.onChangeUnderlying1}                         
                        className="form-control"
                        id="underlyingTokenID1"
                        disabled={!this.state.isMaker}
                      >
                        <option value=""> </option>
                        <option value="" disabled>--- Digital Cash ---</option>
                        {
                          Array.isArray(underlyingDSGDList) ?
                          underlyingDSGDList.map( (d) => {
                            // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              if (typeof d.id === "number")
                                return <option value={d.id} selected={d.id === this.state.underlyingTokenID1}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                            })
                          : null
                        }
                        <option value="" disabled>--- PBM ---</option>
                        {
                          Array.isArray(PBMList) ?
                          PBMList.map( (d) => {
                            // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              if (typeof d.id === "number")
                                return <option value={d.id} selected={d.id === this.state.underlyingTokenID1}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                            })
                          : null
                        }
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="name">Token 2 *</label>
                  <select
                        onChange={this.onChangeUnderlying2}                         
                        className="form-control"
                        id="underlyingTokenID2"
                        disabled={!this.state.isMaker || this.state.underlyingTokenID1 === ""}
                      >
                        <option value=""> </option>
                        <option value="" disabled>--- Digital Cash ---</option>
                        {
                          Array.isArray(underlyingDSGDList) ?
                          underlyingDSGDList.map( (d) => {
                            // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                            if (typeof d.id === "number" && d.blockchain === this.state.blockchain)
                              return <option value={d.id} selected={d.id === this.state.underlyingTokenID2}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                          })
                          : null
                        }
                        <option value="" disabled>--- PBM ---</option>
                        {
                          Array.isArray(PBMList) ?
                          PBMList.map( (d) => {
                            // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                            if (typeof d.id === "number" && d.blockchain === this.state.blockchain)
                              return <option value={d.id} selected={d.id === this.state.underlyingTokenID2}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                          })
                          : null
                        }
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="blockchain">Blockchain to Deploy at</label>
                  {// use the blockchain where the underlying was deployed
                  }
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


                <label htmlFor="amount1">Exchange Rate between Tokens</label>

                <table style={{border : '1px solid blue', width: '100%'}}>
                <tr>
{/*
                  <td style={{fontSize:"100px", border:"0"}}>(</td>
*/}
                  <td style={{border : '0'}}>
                    <div className="form-group">
                      <label htmlFor="amount1">Token 1 amount</label>
                      <input
                        type="number"
                        className="form-control"
                        id="amount1"
                        min="0"
                        step="1"
                        required
                        value={this.state.amount1}
                        onChange={this.onChangeAmount1}
                        name="amount1"
                        autoComplete="off"
                        disabled={!this.state.isMaker}
                      />
                    </div>
                  </td>
                  <td style={{border : '0'}}>
                    vs
                  </td>
                  <td style={{border : '0'}}>
                  <div className="form-group">
                      <label htmlFor="amount2">Token 2 amount</label>
                      <input
                        type="number"
                        className="form-control"
                        id="amount2"
                        min="0"
                        step="1"
                        required
                        value={this.state.amount2}
                        onChange={this.onChangeAmount2}
                        name="amount2"
                        autoComplete="off"
                        disabled={!this.state.isMaker}
                      />
                    </div>
                  </td>
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

                { this.state.isMaker?
                  <button onClick={this.createDvP} className="btn btn-primary">
                    Submit for Review
                  </button>
                : null
                }
                { this.state.isMaker?
                 (this.state.datachanged) ? 
                  <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>
                    Cancel
                  </button>
                  : 
                  <Link to="/dvp">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Cancel
                  </button>
                  </Link>
                : 
                  <Link to="/dvp">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Back
                  </button>
                  </Link>
                }
                {this.state.isLoading ? <LoadingSpinner /> : null}

                <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/dvp'} handleProceed2={null} handleProceed3={null} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                  {this.state.modalmsg}
                </Modal>

                <p>{this.state.message}</p>

              </div>
          </div>
      </div>
    );
  }
}
