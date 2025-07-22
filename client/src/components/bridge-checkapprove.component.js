import React, { Component } from "react";
import BridgeDataService from "../services/bridge.service.js";
import CampaignDataService from "../services/campaign.service.js";
import RecipientDataService from "../services/recipient.service.js";
import UserOpsRoleDataService from "../services/user_opsrole.service.js";
import { withRouter } from '../common/with-router.js';
import AuthService from "../services/auth.service.js";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";


class Bridge extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeSourceBlockchain = this.onChangeSourceBlockchain.bind(this);
    this.onChangeDestBlockchain = this.onChangeDestBlockchain.bind(this);
    this.onChangeSourceTokenSymbol = this.onChangeSourceTokenSymbol.bind(this);
    this.onChangeDestTokenSymbol = this.onChangeDestTokenSymbol.bind(this);
    this.onChangeSourceTokenSmartContractAddress = this.onChangeSourceTokenSmartContractAddress.bind(this);
    this.onChangeDestTokenSmartContractAddress = this.onChangeDestTokenSmartContractAddress.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.onChangeCheckerComments = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
    this.getAllBridges = this.getAllBridges.bind(this);
    this.createBridgeDraft = this.createBridgeDraft.bind(this);
    this.submitBridge = this.submitBridge.bind(this);
    this.acceptBridge = this.acceptBridge.bind(this);
    this.approveBridge = this.approveBridge.bind(this);
    this.rejectBridge = this.rejectBridge.bind(this);
    this.deleteBridge = this.deleteBridge.bind(this);
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
      currentBridge: {
        id: 0,    // 0 for new bridge draft
        name: "",

        sourcetokensymbol: "",
        desttokensymbol: "",

        sourcebridgesmartcontractaddress: "",
        destbridgesmartcontractaddress: "",
        sourceblockchain: "",
        destblockchain: "",
        sourcetokensmartcontractaddress: "",
        desttokensmartcontractaddress: "",

        txntype: 0,
        status: null,

        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedbridgeid: null,
        actionby: "",
        blockchain_changed: 0,
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
      isNewBridge: null,
      
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
    UserOpsRoleDataService.getAllMakersCheckersApprovers("bridge")
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
    console.log("User: ", user);

    if (!user) this.setState({ redirect: "/login" });
    this.setState({ currentUser: user, actionby:user.username, userReady: true })

    let ismaker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "MAKER");
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "CHECKER");
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "APPROVER");
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

    this.getAllBridges(user, this.props.router.params.id);
    //this.getAllBridgesTemplates();
    this.getAllCashTokenAssets();
    this.getAllIssuers();
    this.retrieveAllMakersCheckersApprovers();
  }

  formatNumber2decimals(num) {
    const trimmed = parseFloat(parseFloat(num).toFixed(10)); // remove floating point noise

    // If it's a whole number, show exactly 2 decimal places
    if (trimmed % 1 === 0) {
      return trimmed.toFixed(2);
    }

    // Otherwise, trim to meaningful decimals (up to 10), removing trailing zeros
    return trimmed.toString();
  }

  onChangeName(e) {
    const name = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentBridge: {
          ...prevState.currentBridge,
          name: name
        }
      };
    });
  }

  onChangeSourceBlockchain(e) {
    const blockchain = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentBridge: {
          ...prevState.currentBridge,
          sourceblockchain: blockchain
        }
      };
    });
  }

  onChangeDestBlockchain(e) {
    const blockchain = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentBridge: {
          ...prevState.currentBridge,
          destblockchain: blockchain,
        }
      };
    });
  }

  onChangeSourceTokenSymbol(e) {
    const tokensymbol = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentBridge: {
          ...prevState.currentBridge,
          sourcetokensymbol: tokensymbol
        }
      };
    });
  }

  onChangeDestTokenSymbol(e) {
    const tokensymbol = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentBridge: {
          ...prevState.currentBridge,
          desttokensymbol: tokensymbol
        }
      };
    });
  }

  onChangeSourceTokenSmartContractAddress(e) {
    const address = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentBridge: {
          ...prevState.currentBridge,
          sourcetokensmartcontractaddress: address
        }
      };
    });
  }

  onChangeDestTokenSmartContractAddress(e) {
    const address = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentBridge: {
          ...prevState.currentBridge,
          desttokensmartcontractaddress: address
        }
      };
    });
  }

  onChangeChecker(e) {
    const checker = e.target.value;
    /*
    this.setState({
      datachanged: true
    });
    */
    this.setState(prevState => ({
      currentBridge: {
        ...prevState.currentBridge,
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
        currentBridge: {
          ...prevState.currentBridge,
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
      currentBridge: {
        ...prevState.currentBridge,
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
        currentBridge: {
          ...prevState.currentBridge,
          approverComments: approverComments
        }
      };
    });
  }

  getAllBridges(user, id) {
    console.log("+++ id:", id);

    if (id !== undefined && id != 0) {
      BridgeDataService.getAllDraftsByBridgeId(id)
        .then(response => {
          response.data[0].actionby = user.username;
          this.setState({
            currentBridge: {
              ...response.data[0],
              facevalue: this.formatNumber2decimals(response.data[0].facevalue),
              couponrate: this.formatNumber2decimals(response.data[0].couponrate),
            },
          });
          console.log("Response from getAllDraftsByBridgeId(id):",response.data[0]);

          this.setState({ isNewBridge : (response.data[0].smartcontractaddress === "" || response.data[0].smartcontractaddress === null) });
        })
        .catch(e => {
          console.log("Error from getAllDraftsByBridgeId(id):", e);
          alert("Error: " + e.response.data.message);

        });
    }
  }

  getAllCashTokenAssets() {
    CampaignDataService.getAll()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            cashTokenList: [ { id:-1, name:"No campaign available, please create a campaign first."}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            cashTokenList: [first_array_record].concat(response.data)
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }

  getAllIssuers() {
    RecipientDataService.findAllRecipients()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            recipient: [ { id:-1, name:"No recipients available, please create a recipient first."}],
          });
        } else {          
//          var first_array_record = [  // add 1 empty record to front of array which is the option list
//            { }
//          ];
          this.setState({
//            recipient: [first_array_record].concat(response.data)
            recipient: response.data
          });
        }
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

    if (!(typeof this.state.currentBridge.name ==='string' || this.state.currentBridge.name instanceof String)) {
      err += "- Name cannot be empty\n";
    } else if ((this.state.currentBridge.name.trim() === "")) {
      err += "- Name cannot be empty\n"; 
    } else if (this.state.isNewBridge) { // only check if new bridge, dont need to check if it is existing bridge because surely will have name alrdy
      await BridgeDataService.findByNameExact(this.state.currentBridge.name.trim())
      .then(response => {
        console.log("Find duplicate name:",response.data);

        if (response.data.length > 0) {
          err += "- Name of bridge is already present (duplicate name)\n";
          console.log("Found bridge name (duplicate!):"+this.state.currentBridge.name);
        } else {
          console.log("Didnt find bridge name1 (ok no duplicate):"+this.state.currentBridge.name);
        }
      })
      .catch(e => {
        console.log("Didnt find bridge name2 (ok no duplicate):"+this.state.currentBridge.name);
        // ok to proceed
      });
    }
        
    if (! validator.isDate(this.state.currentBridge.issuedate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.currentBridge.maturitydate)) err += "- End Date is invalid\n";
    if (this.state.currentBridge.facevalue === "") err += "- Face value cannot be empty\n";
    if (this.state.currentBridge.couponrate === "") err += "- Coupon Rate cannot be empty\n";
    if (this.state.currentBridge.counponinterval === "") err += "- Coupon Interval cannot be empty\n";
    if (this.state.currentBridge.issuer === "") err += "- Issuer cannot be empty\n";
    if (this.state.currentBridge.totalsupply === "") err += "- TotalSupply cannot be empty\n";
    if (parseInt(this.state.currentBridge.totalsupply) <=  0) err += "- TotalSupply must be more than zero\n";
    if (this.state.currentBridge.issuedate.trim() !== "" && this.state.currentBridge.maturitydate.trim() !== "" && this.state.currentBridge.issuedate > this.state.currentBridge.maturitydate) err += "- Start date cannot be later than End date\n";    

    console.log("start date:'"+this.state.currentBridge.issuedate+"'");
    console.log("end date:'"+this.state.currentBridge.maturitydate+"'");
    console.log("Start > End? "+ (this.state.currentBridge.issuedate > this.state.currentBridge.maturitydate));

    if (! validator.isURL(this.state.currentBridge.prospectusurl)) err += "- Prospectus URL is invalid\n";

    if (this.state.currentBridge.checker === "" || this.state.currentBridge.checker === null) err += "- Checker cannot be empty\n";
    if (this.state.currentBridge.approver === "" || this.state.currentBridge.approver === null) err += "- Approver cannot be empty\n";
    if (this.state.currentBridge.checker === this.state.currentUser.id.toString() 
        && this.state.currentBridge.approver === this.state.currentUser.id.toString()) {
      err += "- Maker, Checker and Approver cannot be the same person\n";
    } else {
      if (this.state.currentBridge.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.currentBridge.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
      if (this.state.currentBridge.checker!==null && this.state.currentBridge.checker!=="" 
            && this.state.currentBridge.checker === this.state.currentBridge.approver) err += "- Checker and Approver cannot be the same person\n";
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

  async createBridgeDraft() {  // for Maker

    if (this.state.isMaker) {  // only for Makers
      
        if (await this.validateForm() === true) { 
  
        var data = {
          name              : (this.state.currentBridge.name).trim(),
          sourceblockchain  : (this.state.currentBridge.sourceblockchain).trim(),
          destblockchain    : (this.state.currentBridge.destblockchain).trim(),
          sourcetokensymbol : (this.state.currentBridge.sourcetokensymbol).trim(),
          desttokensymbol   : (this.state.currentBridge.desttokensymbol).trim(),
          sourcetokensmartcontractaddress: (this.state.currentBridge.sourcetokensmartcontractaddress).trim(),
          desttokensmartcontractaddress  : (this.state.currentBridge.desttokensmartcontractaddress).trim(),
//          sourcebridgesmartcontractaddress: (this.state.currentBridge.sourcebridgesmartcontractaddress).trim(),
//          destbridgesmartcontractaddress  : (this.state.currentBridge.destbridgesmartcontractaddress).trim(),

          txntype           : 0,    // create

          maker             : this.state.currentUser.id,
          checker           : this.state.currentBridge.checker,
          approver          : this.state.currentBridge.approver,
          actionby          : this.state.currentUser.username,
          approvedbridgeid    : -1,
        };
    
        console.log("Form Validation passed! creating bridge...");
        //alert("Form validation passed! creating bridge...");

        console.log("IsLoad=true");
        this.show_loading();  // show progress


        await BridgeDataService.draftCreate(data)
        .then(response => {
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();  // hide progress
    
          this.setState({
            id                  : response.data.id,
            name                : (response.data.name).trim(),
            securityname        : (response.data.securityname).trim(),
            ISIN                : (response.data.ISIN).trim(),
            tokenname           : (response.data.tokenname).trim(),
            tokensymbol         : (response.data.tokensymbol).trim(),

            couponinterval      : response.data.couponinterval,
            couponrate          : response.data.couponrate,
            facevalue           : response.data.facevalue,
  
            cashTokenID         : response.data.cashTokenID,
            CashTokensmartcontractaddress: response.data.CashTokensmartcontractaddress,
            smartcontractaddress: response.data.smartcontractaddress,
            blockchain          : response.data.blockchain,
            issuedate           : response.data.issuedate,
            maturitydate        : response.data.maturitydate,
            issuer              : response.data.issuer,
            totalsupply         : response.data.totalsupply,
            prospectusurl       : response.data.prospectusurl,

            submitted: true,
          });
//          this.displayModal("Bridge draft submitted for review" + (response.data.smartcontractaddress !==""? " with smart contract deployed at "+response.data.smartcontractaddress : "." ) ,
//                              "OK", null, null);
          this.displayModal("Bridge creation request submitted for review.", "OK", null, null, null);

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

  } // createBridgeDraft()

  async submitBridge() {
    
    if (await this.validateForm()) { 
        console.log("Form Validation passed");
  
        console.log("IsLoad=true");
        this.show_loading();

        console.log("Submitting Bridge draft this.state.bridge=", this.state.currentBridge);
  
        await BridgeDataService.submitDraftById(
          this.state.currentBridge.id,
          this.state.currentBridge,
        )
        .then(response => {
          this.hide_loading();
  
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();
    
          this.setState({  
            datachanged: false,
          });
          this.displayModal("Bridge submitted. Routing to checker.", "OK", null, null, null);
        })
        .catch(e => {
          this.hide_loading();
  
          console.log(e);
          console.log(e.message);
          this.displayModal("Bridge submit failed.", null, null, null, "OK");
  
          try {
            console.log(e.response.data.message);
            // Need to check draft and approved bridge names
            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
              this.displayModal("The Bridge submit failed. The new bridge name is already used, please use another name.", null, null, null, "OK");
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
  } // submitBridge()
    
  async acceptBridge() {
  
//    if (await this.validateForm()) { 
//      console.log("Form Validation passed");

      console.log("IsLoad=true");
      this.show_loading();

      await BridgeDataService.acceptDraftById(
        this.state.currentBridge.id,
        this.state.currentBridge,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();
  
        this.setState({  
          datachanged: false,
        });
        this.displayModal("Bridge request checked, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Bridge accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The bridge accept failed. The new bridge name is already used, please use another name.", null, null, null, "OK");
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
  } //  acceptBridge()

  async approveBridge() {
  
    //    if (await this.validateForm()) { 
    //      console.log("Form Validation passed");
    
    console.log("IsLoad=true");
    this.show_loading();

    await BridgeDataService.approveDraftById(
      this.state.currentBridge.id,
      this.state.currentBridge,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("The bridge is approved and executed successfully"+ (typeof(response.data.smartcontractaddress)!=="undefined" && response.data.smartcontractaddress!==null && response.data.smartcontractaddress!==""? " with smart contract deployed at "+response.data.smartcontractaddress+". \n\nThe Bridge tokens are minted into the platform wallet.": "."), "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log("-->response:",e);
      console.log(e.message);
      //this.displayModal("Bridge approval failed. "+e.message+".", null, null, "OK");
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      try {
        console.log(e.response.data.message);
        if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
          this.displayModal("The bridge update failed. The new bridge name is already used, please use another name.", null, null, null, "OK");
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
  } // approveBridge()

  async rejectBridge() {

    console.log("isChecker? ", this.state.isChecker);
    console.log("this.state.currentBridge.checkerComments: ", this.state.currentBridge.checkerComments);
    console.log("isApprover? ", this.state.isApprover);
    console.log("this.state.currentBridge.approverComments: ", this.state.currentBridge.approverComments);

    if ( this.state.isChecker && (typeof this.state.currentBridge.checkerComments==="undefined" || this.state.currentBridge.checkerComments==="" || this.state.currentBridge.checkerComments===null)) { 
      this.displayModal("Please enter the reason for rejection in the Checker Comments.", null, null, null, "OK");
    } else 
    if (this.state.isApprover && (typeof this.state.currentBridge.approverComments==="undefined" || this.state.currentBridge.approverComments==="" || this.state.currentBridge.approverComments===null)) {
      this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
    } else {
      //console.log("Form Validation passed");
    
      console.log("IsLoad=true");
      this.show_loading();

      await BridgeDataService.rejectDraftById(
        this.state.currentBridge.id,
        this.state.currentBridge,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();

        this.setState({  
          datachanged: false,
        });
        this.displayModal("This bridge request is rejected. Routing back to maker.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Bridge rejection failed.", null, null, null, "OK");
      });
    }
    this.hide_loading();
  }
    
  async deleteBridge() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await BridgeDataService.approveDeleteDraftById(
      this.state.currentBridge.id,
      this.state.currentBridge,
    )
    .then(response => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress

      this.displayModal("Bridge is deleted.", "OK", null, null, null);
      console.log(response.data);
      //this.props.router.navigate('/inbox');
    })
    .catch(e => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      console.log(e);
    });
  } // deleteBridge()

  async dropRequest() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await BridgeDataService.dropRequestById(
      this.state.currentBridge.id,
      this.state.currentBridge,
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
  } // dropRequest()

  show_loading() {
    this.setState({isLoading: true});
  }

  hide_loading(){
    this.setState({isLoading: false});
  }

  showModal_Leave = () => {
    this.displayModal("You have made changes. Are you sure you want to leave this page without submitting?", "Yes, leave", null, null, "Cancel");
  };

  showModal_dropRequest = () => {
    this.displayModal("Are you sure you want to Drop this Request?", null, null, "Yes, drop", "Cancel");
  };
  
  showModalDelete = () => {
    this.displayModal("Are you sure you want to Delete this Bridge?", null, "Yes, delete", null, "Cancel");
  };

  hideModal = () => {
    this.setState({ showm: false });
  };

  render() {
    const { cashTokenList, recipient, currentBridge, checkerList, approverList } = this.state;
    console.log("Render cashTokenList:", cashTokenList);
    console.log("Render recipient:", recipient);
    console.log("Render currentBridge:", currentBridge);

    try {
      return (
        <div className="container">
          { 
            (this.state.userReady) ?
            <div>
            <header className="jumbotron col-md-8">
              <h3>
                <strong>{this.state.currentBridge.txntype===0?"Create ":(this.state.currentBridge.txntype===1?"Update ":(this.state.currentBridge.txntype===2?"Delete ":null))}Bridge { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
              </h3>
            </header>

            </div>
          : null
          }

          <div className="edit-form list-row">
            <h4></h4>
            <div className="col-md-8">

              <form autoComplete="off">
                <div className="form-group">
                  <label htmlFor="name">Name & description *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    maxLength="45"
                    value={currentBridge.name}
                    onChange={this.onChangeName}
                    required
                    disabled={!this.state.isMaker || currentBridge.txntype===2 || currentBridge.status > 0 }
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Source Token Symbol *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="sourcetokensymbol"
                    maxLength="20"
                    required
                    value={currentBridge.sourcetokensymbol}
                    onChange={this.onChangeSourceTokenSymbol}
                    name="sourcetokensymbol"
                    style={{textTransform : "uppercase"}}
                    disabled={!this.state.isMaker || this.state.currentBridge.txntype===2 || currentBridge.status > 0 }
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Destination Token Symbol *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="desttokensymbol"
                    maxLength="20"
                    required
                    value={currentBridge.desttokensymbol}
                    onChange={this.onChangeDestTokenSymbol}
                    name="desttokensymbol"
                    style={{textTransform : "uppercase"}}
                    disabled={!this.state.isMaker || this.state.currentBridge.txntype===2 || currentBridge.status > 0 }
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Source Token Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="sourcetokensmartcontractaddress"
                    maxLength="42"
                    required
                    value={currentBridge.sourcetokensmartcontractaddress}
                    onChange={this.onChangeSourceTokenSmartContractAddress}
                    name="sourcetokensmartcontractaddress"
                    disabled={!this.state.isMaker || this.state.currentBridge.txntype===2 || currentBridge.status > 0 }
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Destination Token Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="desttokensymbol"
                    maxLength="42"
                    required
                    value={currentBridge.desttokensmartcontractaddress}
                    onChange={this.onChangeDestTokenSmartContractAddress}
                    name="desttokensmartcontractaddress"
                    disabled={!this.state.isMaker || this.state.currentBridge.txntype===2 || currentBridge.status > 0 }
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="sourceblockchain">Source Blockchain *</label>
                  <select
                        onChange={this.onChangeSourceBlockchain}                         
                        className="form-control"
                        id="sourceblockchain"
                        disabled={!this.state.isMaker || this.state.currentBridge.txntype===2 || currentBridge.status > 0 }
                        >
                        <option >   </option>
                        <option value="80002"  selected={currentBridge ? currentBridge.sourceblockchain === 80002 : this.state.blockchain === 80002}>Polygon   Testnet Amoy</option>
                        <option value="11155111" selected={currentBridge ? currentBridge.sourceblockchain === 11155111 : this.state.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                        <option value="80001"  selected={currentBridge ? currentBridge.sourceblockchain === 80001 : this.state.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                        <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                        <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                        <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                        <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                      </select>
                </div>
                <div className="form-group">
                  <label htmlFor="destblockchain">Destination Blockchain *</label>
                  <select
                        onChange={this.onChangeDestBlockchain}                         
                        className="form-control"
                        id="destblockchain"
                        disabled={!this.state.isMaker || this.state.currentBridge.txntype===2 || currentBridge.status > 0 }
                        >
                        <option >   </option>
                        <option value="80002"  selected={currentBridge ? currentBridge.destblockchain === 80002 : this.state.blockchain === 80002}>Polygon   Testnet Amoy</option>
                        <option value="11155111" selected={currentBridge ? currentBridge.destblockchain === 11155111 : this.state.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                        <option value="80001"  selected={currentBridge ? currentBridge.destblockchain === 80001 : this.state.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                        <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                        <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                        <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                        <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                      </select>
                </div>

                <div className="form-group">
                  <label htmlFor="checker">Checker *</label>
                  <select
                        value={currentBridge.checker}
                        onChange={this.onChangeChecker}                         
                        className="form-control"
                        id="checker"
                        required
                        disabled={!this.state.isMaker || currentBridge.txntype===2 || currentBridge.status > 0 }
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
                {
                (currentBridge.id !== 0 ? // add new bridge
                <div className="form-group">
                  <label htmlFor="checkerComments">Checker Comments</label>
                  <input
                    type="text"
                    maxLength="255"
                    className="form-control"
                    id="checkerComments"
                    required
                    value={currentBridge.checkerComments}
                    onChange={this.onChangeCheckerComments}
                    name="checkerComments"
                    autoComplete="off"
                    disabled={!this.state.isChecker || currentBridge.id === 0 || currentBridge.status !== 1 }
                    />
                </div>
                :
                null
                )
                }
                <div className="form-group">
                  <label htmlFor="approver">Approver *</label>
                  <select
                      value={currentBridge.approver}
                      onChange={this.onChangeApprover}                         
                      className="form-control"
                      id="approver"
                      required
                      disabled={!this.state.isMaker || currentBridge.txntype===2 || currentBridge.status > 0 }
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
                (currentBridge.id !== 0 ? // add new bridge
                <div className="form-group">
                  <label htmlFor="approverComments">Approver Comments</label>
                  <input
                    type="text"
                    maxLength="255"
                    className="form-control"
                    id="approverComments"
                    required
                    value={currentBridge.approverComments}
                    onChange={this.onChangeApproverComments}
                    name="approverComments"
                    autoComplete="off"
                    disabled={!this.state.isApprover || currentBridge.id === 0 || currentBridge.status !== 2 }
                    />
                </div>
                : null
                )
                }
              </form>


              {  //// buttons!


                  this.state.isMaker && currentBridge.id === 0 &&  // creating new draft
                        <button 
                        onClick={this.createBridgeDraft} 
                        type="submit"
                        className="m-3 btn btn-sm btn-primary"
                        >
                          Submit Request
                        </button>
              }
                    
              { 
                  this.state.isMaker && currentBridge.status !== null && currentBridge.status <= 0 &&  // creating draft or amending draft
                        <>
                            <button
                            type="submit"
                            className="m-3 btn btn-sm btn-primary"
                            onClick={this.submitBridge}
                            >
                              Submit 
                              {
                                (currentBridge.txntype===0? " Create ":
                                (currentBridge.txntype===1? " Update ":
                                (currentBridge.txntype===2? " Delete ":null)))
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
              }

              {
                this.state.isChecker && currentBridge.status === 1 && 
                    <button
                      type="submit"
                      className="m-3 btn btn-sm btn-primary"
                      onClick={this.acceptBridge}
                    >
                      Endorse
                      {
                        (currentBridge.txntype===0? " Create ":
                        (currentBridge.txntype===1? " Update ":
                        (currentBridge.txntype===2? " Delete ":null)))
                      }
                      Request
                    </button> 
              }
              
              {
                    this.state.isApprover && currentBridge.status === 2 &&
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={currentBridge.txntype===2? this.deleteDraft: this.approveBridge}
                    >
                      Approve
                      {
                        (currentBridge.txntype===0? " Create ":
                        (currentBridge.txntype===1? " Update ":
                        (currentBridge.txntype===2? " Delete ":null)))
                      }
                      Request

                    </button> 
                
              }
&nbsp;
              {
                currentBridge.id !== 0 && (this.state.isChecker || this.state.isApprover) && 
                currentBridge.status <= 2 &&   // status < 2 still in draft and not deployed yet
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-danger"
                    onClick={this.rejectBridge}
                    >
                      Reject
                    </button> 
              }
&nbsp;
              { 
                this.state.isMaker?
                (this.state.datachanged ? 
                  <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>
                    Cancel
                  </button>
                  : 
                  <Link to="/bridge">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Cancel
                  </button>
                  </Link>
                )
              : 
                <Link to="/bridge">
                <button className="m-3 btn btn-sm btn-secondary">
                  Cancel
                </button>
                </Link>
              }  

              {this.state.isLoading ? <LoadingSpinner /> : null}

              <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/bridge'} handleProceed2={this.deleteBridge} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
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

export default withRouter(Bridge);