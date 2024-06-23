import React, { Component } from "react";
import DvPDataService from "../services/dvp.service";
import CampaignDataService from "../services/campaign.service";
import PBMDataService from "../services/pbm.service";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { withRouter } from '../common/with-router';
import AuthService from "../services/auth.service";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";

class DvP extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeUnderlying1 = this.onChangeUnderlying1.bind(this);
    this.onChangeUnderlying2 = this.onChangeUnderlying2.bind(this);
    this.onChangeCounterParty1 = this.onChangeCounterParty1.bind(this);
    this.onChangeCounterParty2 = this.onChangeCounterParty2.bind(this);
    this.onChangeAmount1 = this.onChangeAmount1.bind(this);
    this.onChangeAmount2 = this.onChangeAmount2.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);

    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.onChangeCheckerComments = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
    this.getDvP = this.getDvP.bind(this);
    this.submitDvP = this.submitDvP.bind(this);
    this.acceptDvP = this.acceptDvP.bind(this);
    this.approveDvP = this.approveDvP.bind(this);
    this.rejectDvP = this.rejectDvP.bind(this);
    this.deleteDvP = this.deleteDvP.bind(this);
    this.dropRequest = this.dropRequest.bind(this);
    this.showModal_Leave = this.showModal_Leave.bind(this);
  //  this.showModal_nochange = this.showModal_nochange.bind(this);
//  this.showModalDelete = this.showModalDelete.bind(this);
    this.showModal_dropRequest = this.showModal_dropRequest.bind(this);
    this.hideModal = this.hideModal.bind(this);

    this.state = {      
      recipientList: {
        id: null,
        name: "",
        walletaddress: "",
        bank: "",
        bankaccount: "",
        type: ""
      },

      adddatafield : false,
      hidedatafield1 : true,
      hidedatafield2 : true,  


      currentDvP: {
        id: null,
        name: "",
        description: "",
        underlyingTokenID1: "",
        underlyingTokenID2: "",
        blockchain: "",
        smartcontractaddress:"",
        smartcontractaddress1:"",
        smartcontractaddress2:"",
        counterparty1: "",
        counterparty2: "",
        amount1: "",
        amount2: "",
        startdate: "",
        enddate: "",

        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approveddvpid: null,
        actionby: "",
        name_changed: 0,
        description_changed: 0,
        startdate_changed: 0,
        enddate_changed: 0,
        counterparty1_changed: 0,
        counterparty2_changed: 0,
        amount1_changed: 0,
        amount2_changed: 0,
      },

      originalDvP: {
        id: null,
        name: "",
        description: "",
        underlyingTokenID1: "",
        underlyingTokenID2: "",
        smartcontractaddress:"",
        smartcontractaddress1:"",
        smartcontractaddress2:"",
        blockchain: "",
        counterparty1: "",
        counterparty2: "",
        amount1: "",
        amount2: "",
        startdate: "",
        enddate: "",
  
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approveddvpid: null,
        actionby: "",
        name_original: "",
        description_original: "",
        startdate_original: "",
        enddate_original: "",
        counterparty1_original: "",
        counterparty2_original: "",
        amount1_original: "",
        amount2_original: "",
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
      isNewDvP: null,
      
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

    if (!user) this.setState({ redirect: "/home" });
    this.setState({ currentUser: user, userReady: true })

    this.getDvP(user, this.props.router.params.id);
    this.getAllUnderlyingAssets();
    this.getAllCounterpartys();
    this.retrieveAllMakersCheckersApprovers();
/*
    const newBlockchain = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(this.state.underlying)).blockchain;
    this.setState({
      blockchain: newBlockchain
    });
*/
  }

  onChangeName(e) {
    const name = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentDvP: {
          ...prevState.currentDvP,
          name: name
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
        currentDvP: {
          ...prevState.currentDvP,
          description: description
        }
      };
    });
  }

  onChangeUnderlying1(e) {
    const underlyingTokenID = e.target.value;
    console.log("New underlying=", underlyingTokenID);
    const newBlockchain = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
    console.log("New blockchain=", newBlockchain);
    const newUnderlyingDSGDsmartcontractaddress = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).smartcontractaddress
    const newCampaign = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID));

    // when underlying changes, blockchain might change also bccos underlying could be in different blockchain
    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentDvP: {
          ...prevState.currentDvP,
          underlyingTokenID1: underlyingTokenID,
          blockchain: newBlockchain,
          smartcontractaddress1: newUnderlyingDSGDsmartcontractaddress,
          campaign: newCampaign,
        }
      };
    });
    console.log("New currentDvP=", this.state.currentDvP);
  }

  onChangeUnderlying2(e) {
    const underlyingTokenID = e.target.value;
    console.log("New underlying=", underlyingTokenID);
    const newBlockchain = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
    console.log("New blockchain=", newBlockchain);
    const newUnderlyingDSGDsmartcontractaddress = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).smartcontractaddress
    const newCampaign = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID));

    // when underlying changes, blockchain might change also bccos underlying could be in different blockchain
    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentDvP: {
          ...prevState.currentDvP,
          underlyingTokenID2: underlyingTokenID,
          blockchain: newBlockchain,
          smartcontractaddress2: newUnderlyingDSGDsmartcontractaddress,
          campaign: newCampaign,
        }
      };
    });
    console.log("New currentDvP=", this.state.currentDvP);
  }

  onChangeCounterParty1(e) {
    const counterpartyx = e.target.value;

    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentDvP: {
        ...prevState.currentDvP,
        counterparty1: counterpartyx
      }
    }));
  }

  onChangeCounterParty2(e) {
    const counterpartyx = e.target.value;

    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentDvP: {
        ...prevState.currentDvP,
        counterparty2: counterpartyx
      }
    }));
  }

  onChangeAmount1(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");  // remove . and other chars
    const amount = e.target.value;
    
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentDvP: {
        ...prevState.currentDvP,
        amount1: amount
      }
    }));
  }

  onChangeAmount2(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");  // remove . and other chars
    const amount = e.target.value;
    
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentDvP: {
        ...prevState.currentDvP,
        amount2: amount
      }
    }));
  }

  onChangeStartDate(e) {
    const startdate = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentDvP: {
        ...prevState.currentDvP,
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
      currentDvP: {
        ...prevState.currentDvP,
        enddate: enddate
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
      currentDvP: {
        ...prevState.currentDvP,
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
        currentDvP: {
          ...prevState.currentDvP,
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
      currentDvP: {
        ...prevState.currentDvP,
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
        currentDvP: {
          ...prevState.currentDvP,
          approverComments: approverComments
        }
      };
    });
  }

  getDvP(user, id) {
    console.log("+++ id:", id);

    if (id !== undefined) {
      DvPDataService.getAllDraftsByDvPId(id)
        .then(response => {
          response.data[0].actionby = user.username;
          this.setState({
            currentDvP: response.data[0],
            originalDvP: response.data[0],
          });
          console.log("Response from getAllDraftsByDvPId(id):",response.data[0]);

          let ismaker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "MAKER" && user.id === response.data[0].maker);
          console.log("isMaker:", (ismaker === undefined? false: true));
          this.setState({ isMaker: (ismaker === undefined? false: true),});
      
          let ischecker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "CHECKER" && user.id === response.data[0].checker);
          console.log("isChecker:", (ischecker === undefined? false: true));
          this.setState({ isChecker: (ischecker === undefined? false: true),});
          //if (ischecker !== undefined) {  // clears the checkers comments
          //  this.setState({ isChecker: true, currentDvP: {checkerComments: ""}, });
          //}
          

          let isapprover= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "APPROVER" && user.id === response.data[0].approver);
          console.log("isApprover:", (isapprover === undefined? false: true));
          this.setState({ isApprover: (isapprover === undefined? false: true),});
          /*
          if (isapprover !== undefined) {
            this.setState({ isApprover: true, currentDvP: {approverComments: ""}, });
          }
          */

          this.setState({ isNewDvP : (response.data[0].smartcontractaddress === "" || response.data[0].smartcontractaddress === null) });
        })
        .catch(e => {
          console.log("Error from getAllDraftsByDvPId(id):", e);
          alert("Error: " + e.response.data.message);

        });


    }
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

  getAllCounterpartys() {
    RecipientDataService.findAllRecipients()
      .then(response => {

        this.setState({
            recipientList: response.data
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

    if (!(typeof this.state.currentDvP.name ==='string' || this.state.currentDvP.name instanceof String)) {
      err += "- Name cannot be empty\n";
    } else if ((this.state.currentDvP.name.trim() === "")) {
      err += "- Name cannot be empty\n"; 
    } else if (this.state.isNewDvP) { // only check if new dvp, dont need to check if it is existing dvp because surely will have name alrdy
      await DvPDataService.findByNameExact(this.state.currentDvP.name.trim())
      .then(response => {
        console.log("Find duplicate name:",response.data);

        if (response.data.length > 0) {
          err += "- Name of dvp is already present (duplicate name)\n";
          console.log("Found dvp name (duplicate!):"+this.state.currentDvP.name);
        } else {
          console.log("Didnt find dvp name1 (ok no duplicate):"+this.state.currentDvP.name);
        }
      })
      .catch(e => {
        console.log("Didnt find dvp name2 (ok no duplicate):"+this.state.currentDvP.name);
        // ok to proceed
      });
    }
        
      // dont need t check description, it can be empty
    if (! validator.isDate(this.state.currentDvP.startdate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.currentDvP.enddate)) err += "- End Date is invalid\n";
    if (this.state.currentDvP.sponsor === "") err += "- Sponsor cannot be empty\n";
    if (this.state.currentDvP.amount === "") err += "- Amount cannot be empty\n";
    if (parseInt(this.state.currentDvP.amount) <=  0) err += "- Amount must be more than zero\n";
    if (this.state.currentDvP.startdate.trim() !== "" && this.state.currentDvP.enddate.trim() !== "" && this.state.currentDvP.startdate > this.state.currentDvP.enddate) err += "- Start date cannot be later than End date\n";    

    console.log("start date:'"+this.state.currentDvP.startdate+"'");
    console.log("end date:'"+this.state.currentDvP.enddate+"'");
    console.log("Start > End? "+ (this.state.currentDvP.startdate > this.state.currentDvP.enddate));

    if (this.state.currentDvP.checker === "" || this.state.currentDvP.checker === null) err += "- Checker cannot be empty\n";
    if (this.state.currentDvP.approver === "" || this.state.currentDvP.approver === null) err += "- Approver cannot be empty\n";
    if (this.state.currentDvP.checker === this.state.currentUser.id.toString() 
        && this.state.currentDvP.approver === this.state.currentUser.id.toString()) {
      err += "- Maker, Checker and Approver cannot be the same person\n";
    } else {
      if (this.state.currentDvP.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.currentDvP.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
      if (this.state.currentDvP.checker!==null && this.state.currentDvP.checker!=="" 
            && this.state.currentDvP.checker === this.state.currentDvP.approver) err += "- Checker and Approver cannot be the same person\n";
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

async submitDvP() {
  
  if (await this.validateForm()) { 
        console.log("Form Validation passed");
  
        console.log("IsLoad=true");
        this.show_loading();
  
        await DvPDataService.submitDraftById(
          this.state.currentDvP.id,
          this.state.currentDvP,
        )
        .then(response => {
          this.hide_loading();
  
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();
    
          this.setState({  
            datachanged: false,
          });
          this.displayModal("DvP submitted. Routing to checker.", "OK", null, null, null);
        })
        .catch(e => {
          this.hide_loading();
  
          console.log(e);
          console.log(e.message);
          this.displayModal("DvP submit failed.", null, null, null, "OK");
  
          try {
            console.log(e.response.data.message);
            // Need to check draft and approved dvp names
            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
              this.displayModal("The DvP submit failed. The new dvp name is already used, please use another name.", null, null, null, "OK");
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
    
async acceptDvP() {  // checker endorse
  
//    if (await this.validateForm()) { 
//      console.log("Form Validation passed");

      console.log("IsLoad=true");
      this.show_loading();

      await DvPDataService.acceptDraftById(
        this.state.currentDvP.id,
        this.state.currentDvP,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();
  
        this.setState({  
          datachanged: false,
        });
        this.displayModal("DvP request checked, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("DvP accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The dvp accept failed. The new dvp name is already used, please use another name.", null, null, null, "OK");
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

async approveDvP() {
  
    //    if (await this.validateForm()) { 
    //      console.log("Form Validation passed");
    
    console.log("IsLoad=true");
    this.show_loading();

    await DvPDataService.approveDraftById(
      this.state.currentDvP.id,
      this.state.currentDvP,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("The DvP smart contract is approved and executed successfully"+ (typeof(response.data.smartcontractaddress)!=="undefined" && response.data.smartcontractaddress!==null && response.data.smartcontractaddress!==""? " with smart contract deployed at "+response.data.smartcontractaddress+". \n\nYou can start using it to transacting using the DvP smart contract now.": "."), "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log("-->response:",e);
      console.log(e.message);
      //this.displayModal("DvP approval failed. "+e.message+".", null, null, "OK");
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      try {
        console.log(e.response.data.message);
        if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
          this.displayModal("The DvP smart contract update failed. The DvP smart contract name is already used, please use another name.", null, null, null, "OK");
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

async rejectDvP() {

  console.log("isChecker? ", this.state.isChecker);
  console.log("this.state.currentDvP.checkerComments: ", this.state.currentDvP.checkerComments);
  console.log("isApprover? ", this.state.isApprover);
  console.log("this.state.currentDvP.approverComments: ", this.state.currentDvP.approverComments);

  if ( this.state.isChecker && (typeof this.state.currentDvP.checkerComments==="undefined" || this.state.currentDvP.checkerComments==="" || this.state.currentDvP.checkerComments===null)) { 
    this.displayModal("Please enter the reason for rejection in the Checker Comments.", null, null, null, "OK");
  } else 
  if (this.state.isApprover && (typeof this.state.currentDvP.approverComments==="undefined" || this.state.currentDvP.approverComments==="" || this.state.currentDvP.approverComments===null)) {
    this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
  } else {
    //console.log("Form Validation passed");
  
    console.log("IsLoad=true");
    this.show_loading();

    await DvPDataService.rejectDraftById(
      this.state.currentDvP.id,
      this.state.currentDvP,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("This dvp request is rejected. Routing back to maker.", "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log(e);
      console.log(e.message);
      this.displayModal("DvP rejection failed.", null, null, null, "OK");
    });
  }
  this.hide_loading();
}
    

async deleteDvP() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await DvPDataService.approveDeleteDraftById(
      this.state.currentDvP.id,
      this.state.currentDvP,
    )
    .then(response => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress

      this.displayModal("DvP is deleted.", "OK", null, null, null);
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

    await DvPDataService.dropRequestById(
      this.state.currentDvP.id,
      this.state.currentDvP,
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
    this.displayModal("Are you sure you want to Delete this DvP?", null, "Yes, delete", null, "Cancel");
  };

  hideModal = () => {
    this.setState({ showm: false });
  };

  render() {
    const { underlyingDSGDList, PBMList, recipientList, currentDvP, checkerList, approverList } = this.state;
    console.log("Render underlyingDSGDList:", underlyingDSGDList);
    console.log("Render recipientList:", recipientList);
    console.log("Render currentDvP:", currentDvP);

    try {
      return (
        <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>{this.state.currentDvP.txntype===0?"Create ":(this.state.currentDvP.txntype===1?"Update ":(this.state.currentDvP.txntype===2?"Delete ":null))}DvP { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
            </h3>
          </header>

        </div>: null}

                <div className="edit-form list-row">
                  <h4></h4>
                  <div className="col-md-8">

                  <form autoComplete="off">
                    <div className="form-group">
                      <label htmlFor="name">DvP Smart Contract Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        maxLength="45"
                        value={currentDvP.name}
                        onChange={this.onChangeName}
                        disabled={!this.state.isMaker || this.state.currentDvP.txntype===2}
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
                      value={currentDvP.description}
                      onChange={this.onChangeDescription}
                      name="description"
                      autoComplete="off"
                      disabled={!this.state.isMaker || this.state.currentDvP.txntype===2}
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
                                  return <option value={d.id} selected={d.walletaddress === this.state.currentDvP.counterparty1}>{d.name} ({d.walletaddress})</option>
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
                                  return <option value={d.walletaddress} selected={d.walletaddress === this.state.currentDvP.counterparty2}>{d.name} ({d.walletaddress})</option>
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
                          <option value="" disabled>--- DSGD ---</option>
                          {
                            Array.isArray(underlyingDSGDList) ?
                            underlyingDSGDList.map( (d) => {
                              // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                                if (typeof d.id === "number")
                                  return <option value={d.id} selected={d.id === this.state.currentDvP.underlyingTokenID1}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                              })
                            : null
                          }
                          <option value="" disabled>--- PBM ---</option>
                          {
                            Array.isArray(PBMList) ?
                            PBMList.map( (d) => {
                              // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                                if (typeof d.id === "number")
                                  return <option value={d.id} selected={d.id === this.state.currentDvP.underlyingTokenID1}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
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
                          <option value="" disabled>--- DSGD ---</option>
                          {
                            Array.isArray(underlyingDSGDList) ?
                            underlyingDSGDList.map( (d) => {
                              // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              if (typeof d.id === "number" && d.blockchain === this.state.currentDvP.blockchain)
                                return <option value={d.id} selected={d.id === this.state.currentDvP.underlyingTokenID2}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                            })
                            : null
                          }
                          <option value="" disabled>--- PBM ---</option>
                          {
                            Array.isArray(PBMList) ?
                            PBMList.map( (d) => {
                              // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              if (typeof d.id === "number" && d.blockchain === this.state.currentDvP.blockchain)
                                return <option value={d.id} selected={d.id === this.state.currentDvP.underlyingTokenID2}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
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
                          <option value="80002"  selected={this.state.currentDvP.blockchain === 80002}>Polygon   Testnet Amoy</option>
                          <option value="11155111" selected={this.state.currentDvP.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                          <option value="80001"  selected={this.state.currentDvP.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                          <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                          <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                          <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                          <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                        </select>
                  </div>


                  <label htmlFor="datafield1_name">Exchange Rate between Tokens</label>

                  <table style={{border : '1px solid blue', width: '100%'}}>
                  <tr>
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
                          value={this.state.currentDvP.amount1}
                          onChange={this.onChangeAmount1}
                          name="amount1"
                          autoComplete="off"
                          disabled={!this.state.currentDvP.isMaker}
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
                          value={this.state.currentDvP.amount2}
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
                      <label htmlFor="checker">Checker *</label>
                      <select
                            value={currentDvP.checker}
                            onChange={this.onChangeChecker}                         
                            className="form-control"
                            id="checker"
                            disabled={!this.state.isMaker || this.state.currentDvP.txntype===2}
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
                        value={currentDvP.checkerComments}
                        onChange={this.onChangeCheckerComments}
                        name="checkerComments"
                        autoComplete="off"
                        disabled={!this.state.isChecker}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="approver">Approver *</label>
                      <select
                          value={currentDvP.approver}
                          onChange={this.onChangeApprover}                         
                          className="form-control"
                          id="approver"
                          disabled={!this.state.isMaker || this.state.currentDvP.txntype===2}
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
                        value={currentDvP.approverComments}
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
                    onClick={this.submitDvP}
                    >
                      Submit 
                      {
                        (this.state.currentDvP.txntype===0? " Create ":
                        (this.state.currentDvP.txntype===1? " Update ":
                        (this.state.currentDvP.txntype===2? " Delete ":null)))
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
                  onClick={this.acceptDvP}
                  >
                    Endorse
                    {
                      (this.state.currentDvP.txntype===0? " Create ":
                      (this.state.currentDvP.txntype===1? " Update ":
                      (this.state.currentDvP.txntype===2? " Delete ":null)))
                    }
                    Request

                  </button> 
                  :
                  (
                    this.state.isApprover?
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={this.state.currentDvP.txntype===2? this.deleteDraft: this.approveDvP}
                    >
                      Approve
                      {
                        (this.state.currentDvP.txntype===0? " Create ":
                        (this.state.currentDvP.txntype===1? " Update ":
                        (this.state.currentDvP.txntype===2? " Delete ":null)))
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
                  onClick={this.rejectDvP}
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

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/inbox'} handleProceed2={this.deleteDvP} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
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

export default withRouter(DvP);