import React, { Component } from "react";
import RepoDataService from "../services/repo.service.js";
import CampaignDataService from "../services/campaign.service.js";
import PBMDataService from "../services/pbm.service.js";
import RecipientDataService from "../services/recipient.service.js";
import UserOpsRoleDataService from "../services/user_opsrole.service.js";
import { withRouter } from '../common/with-router.js';
import AuthService from "../services/auth.service.js";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";

class Repo extends Component {
  constructor(props) {
    super(props);
    /*
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
*/

    this.getRepo = this.getRepo.bind(this);
    this.executeRepo = this.executeRepo.bind(this);
    /*
    this.acceptRepo = this.acceptRepo.bind(this);
    this.approveRepo = this.approveRepo.bind(this);
    this.rejectRepo = this.rejectRepo.bind(this);
    this.deleteRepo = this.deleteRepo.bind(this);
    this.dropRequest = this.dropRequest.bind(this);
    */
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


      currentRepo: {
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
        approvedrepoid: null,
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

      originalRepo: {
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
        approvedrepoid: null,
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
      isNewRepo: null,
      
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
    UserOpsRoleDataService.getAllMakersCheckersApprovers("repo")
      .then(response => {
        console.log("Data received by getAllCheckerApprovers:", response.data);
        let chkList = response.data.find((element) => {
          //var el_id = element.id;                       console.log("typeof(el_id)", typeof(el_id));
          //console.log("element.name:", element.name);   console.log("typeof(element.name)", typeof(element.name));
          try {
            if (element.name.toUpperCase() === "CHECKER") 
              return element;
          } catch(e) {
            // do nothing, sometime when repoList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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
            // do nothing, sometime when repoList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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

    this.getRepo(user, this.props.router.params.id);
    this.getAllUnderlyingAssets();
    this.getAllCounterpartys();
//    this.retrieveAllMakersCheckersApprovers();
  }
/*
  onChangeName(e) {
    const name = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentRepo: {
          ...prevState.currentRepo,
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
        currentRepo: {
          ...prevState.currentRepo,
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
        currentRepo: {
          ...prevState.currentRepo,
          underlyingTokenID1: underlyingTokenID,
          blockchain: newBlockchain,
          smartcontractaddress1: newUnderlyingDSGDsmartcontractaddress,
          campaign: newCampaign,
        }
      };
    });
    console.log("New currentRepo=", this.state.currentRepo);
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
        currentRepo: {
          ...prevState.currentRepo,
          underlyingTokenID2: underlyingTokenID,
          blockchain: newBlockchain,
          smartcontractaddress2: newUnderlyingDSGDsmartcontractaddress,
          campaign: newCampaign,
        }
      };
    });
    console.log("New currentRepo=", this.state.currentRepo);
  }

  onChangeCounterParty1(e) {
    const counterpartyx = e.target.value;

    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
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
      currentRepo: {
        ...prevState.currentRepo,
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
      currentRepo: {
        ...prevState.currentRepo,
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
      currentRepo: {
        ...prevState.currentRepo,
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
      currentRepo: {
        ...prevState.currentRepo,
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
      currentRepo: {
        ...prevState.currentRepo,
        enddate: enddate
      }
    }));
  }

  onChangeChecker(e) {
    const checker = e.target.value;

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
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
        currentRepo: {
          ...prevState.currentRepo,
          checkerComments: checkerComments
        }
      };
    });
  }

  onChangeApprover(e) {
    const approver = e.target.value;

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
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
        currentRepo: {
          ...prevState.currentRepo,
          approverComments: approverComments
        }
      };
    });
  }
*/

  getRepo(user, id) {
    console.log("+++ findOne(id):", id);

    if (id !== undefined) {
      RepoDataService.findOne(id)
        .then(response => {
          response.data[0].actionby = user.username;
          this.setState({
            currentRepo: response.data[0],
            originalRepo: response.data[0],
          });
          console.log("Response from findOne(id):",response.data[0]);

          let ismaker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "MAKER" && user.id === response.data[0].maker);
          console.log("isMaker:", (ismaker === undefined? false: true));
          this.setState({ isMaker: (ismaker === undefined? false: true),});
      
          let ischecker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "CHECKER" && user.id === response.data[0].checker);
          console.log("isChecker:", (ischecker === undefined? false: true));
          this.setState({ isChecker: (ischecker === undefined? false: true),});
          //if (ischecker !== undefined) {  // clears the checkers comments
          //  this.setState({ isChecker: true, currentRepo: {checkerComments: ""}, });
          //}
          

          let isapprover= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "APPROVER" && user.id === response.data[0].approver);
          console.log("isApprover:", (isapprover === undefined? false: true));
          this.setState({ isApprover: (isapprover === undefined? false: true),});
          /*
          if (isapprover !== undefined) {
            this.setState({ isApprover: true, currentRepo: {approverComments: ""}, });
          }
          */

          this.setState({ isNewRepo : (response.data[0].smartcontractaddress === "" || response.data[0].smartcontractaddress === null) });
        })
        .catch(e => {
          console.log("Error from findOne(id):", e);
          alert("Error: " + e.response.data[0].message);

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
        
      // dont need t check description, it can be empty
    if (this.state.currentRepo.amount1 === "") err += "- Amount 1 cannot be empty\n";
    if (parseInt(this.state.currentRepo.amount1) <=  0) err += "- Amount 1 must be more than zero\n";
    if (! validator.isDate(this.state.currentRepo.startdate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.currentRepo.enddate)) err += "- End Date is invalid\n";
    if (this.state.currentRepo.startdate.trim() !== "" && this.state.currentRepo.enddate.trim() !== "" && this.state.currentRepo.startdate > this.state.currentRepo.enddate) err += "- Start date cannot be later than End date\n";    

    console.log("start date:'"+this.state.currentRepo.startdate+"'");
    console.log("end date:'"+this.state.currentRepo.enddate+"'");
    console.log("Start > End? "+ (this.state.currentRepo.startdate > this.state.currentRepo.enddate));
/*
    if (this.state.currentRepo.checker === "" || this.state.currentRepo.checker === null) err += "- Checker cannot be empty\n";
    if (this.state.currentRepo.approver === "" || this.state.currentRepo.approver === null) err += "- Approver cannot be empty\n";
    if (this.state.currentRepo.checker === this.state.currentUser.id.toString() 
        && this.state.currentRepo.approver === this.state.currentUser.id.toString()) {
      err += "- Maker, Checker and Approver cannot be the same person\n";
    } else {
      if (this.state.currentRepo.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.currentRepo.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
      if (this.state.currentRepo.checker!==null && this.state.currentRepo.checker!=="" 
            && this.state.currentRepo.checker === this.state.currentRepo.approver) err += "- Checker and Approver cannot be the same person\n";
    }
*/
    if (err !=="" ) {
      err = "Form validation issues found:\n"+err;
      //alert(err);
      this.displayModal(err, null, null, null, "OK");
      err = ""; // clear var
      return false;
    }
    return true;
  }

async executeRepo() {
  
  if (await this.validateForm()) { 
        console.log("Form Validation passed");
  
        console.log("IsLoad=true");
        this.show_loading();
  
        await RepoDataService.executeRepoById(
          this.state.currentRepo.id,
          this.state.currentRepo,
        )
        .then(response => {
          this.hide_loading();
  
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();
    
          this.setState({  
            datachanged: false,
          });
          this.displayModal("Repo executed successfully.", "OK", null, null, null);
        })
        .catch(e => {
          this.hide_loading();
  
          try {
            console.log("e->response->data->msg:  ", e.response.data.message);
            console.log(e.message);
            this.displayModal("Repo submit failed. "+e.response.data.message, null, null, null, "OK");
                // Need to check draft and approved repo names
//            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
//              this.displayModal("The Repo submit failed. The new repo name is already used, please use another name.", null, null, null, "OK");
//            }
          } catch(e) {
            this.hide_loading();
  
            console.log("Error: ",e);
            console.log("Response error:", e.response.data.message);
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
    
/*
async acceptRepo() {  // checker endorse
  
//    if (await this.validateForm()) { 
//      console.log("Form Validation passed");

      console.log("IsLoad=true");
      this.show_loading();

      await RepoDataService.acceptDraftById(
        this.state.currentRepo.id,
        this.state.currentRepo,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();
  
        this.setState({  
          datachanged: false,
        });
        this.displayModal("Repo request checked, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Repo accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The repo accept failed. The new repo name is already used, please use another name.", null, null, null, "OK");
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

async approveRepo() {
  
    //    if (await this.validateForm()) { 
    //      console.log("Form Validation passed");
    
    console.log("IsLoad=true");
    this.show_loading();

    await RepoDataService.approveDraftById(
      this.state.currentRepo.id,
      this.state.currentRepo,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("The Repo smart contract is approved, executed successfully"+ (typeof(response.data.smartcontractaddress)!=="undefined" && response.data.smartcontractaddress!==null && response.data.smartcontractaddress!==""? " and deployed at "+response.data.smartcontractaddress+". \n\nYou can start using it to transacting using the Repo smart contract now.": "."), "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log("-->response:",e);
      console.log(e.message);
      //this.displayModal("Repo approval failed. "+e.message+".", null, null, "OK");
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      try {
        console.log(e.response.data.message);
        if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
          this.displayModal("The Repo smart contract update failed. The Repo smart contract name is already used, please use another name.", null, null, null, "OK");
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

async rejectRepo() {

  console.log("isChecker? ", this.state.isChecker);
  console.log("this.state.currentRepo.checkerComments: ", this.state.currentRepo.checkerComments);
  console.log("isApprover? ", this.state.isApprover);
  console.log("this.state.currentRepo.approverComments: ", this.state.currentRepo.approverComments);

  if ( this.state.isChecker && (typeof this.state.currentRepo.checkerComments==="undefined" || this.state.currentRepo.checkerComments==="" || this.state.currentRepo.checkerComments===null)) { 
    this.displayModal("Please enter the reason for rejection in the Checker Comments.", null, null, null, "OK");
  } else 
  if (this.state.isApprover && (typeof this.state.currentRepo.approverComments==="undefined" || this.state.currentRepo.approverComments==="" || this.state.currentRepo.approverComments===null)) {
    this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
  } else {
    //console.log("Form Validation passed");
  
    console.log("IsLoad=true");
    this.show_loading();

    await RepoDataService.rejectDraftById(
      this.state.currentRepo.id,
      this.state.currentRepo,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("This repo request is rejected. Routing back to maker.", "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log(e);
      console.log(e.message);
      this.displayModal("Repo rejection failed.", null, null, null, "OK");
    });
  }
  this.hide_loading();
}

async deleteRepo() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await RepoDataService.approveDeleteDraftById(
      this.state.currentRepo.id,
      this.state.currentRepo,
    )
    .then(response => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress

      this.displayModal("Repo is deleted.", "OK", null, null, null);
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

    await RepoDataService.dropRequestById(
      this.state.currentRepo.id,
      this.state.currentRepo,
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
*/
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
    this.displayModal("Are you sure you want to Delete this Repo?", null, "Yes, delete", null, "Cancel");
  };

  hideModal = () => {
    this.setState({ showm: false });
  };

  render() {
    const { underlyingDSGDList, PBMList, recipientList, currentRepo, checkerList, approverList } = this.state;
    console.log("Render underlyingDSGDList:", underlyingDSGDList);
    console.log("Render recipientList:", recipientList);
    console.log("Render currentRepo:", currentRepo);

    try {
      return (
        <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>{this.state.currentRepo.txntype===0?"Execute ":""} Repo Transaction { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
            </h3>
          </header>

        </div>: null}

                <div className="edit-form list-row">
                  <h4></h4>
                  <div className="col-md-8">

                  <form autoComplete="off">
                    <div className="form-group">
                      <label htmlFor="name">Repo Smart Contract Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        maxLength="45"
                        value={currentRepo.name}
                        onChange={this.onChangeName}
                        disabled="true"
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
                      value={currentRepo.description}
                      onChange={this.onChangeDescription}
                      name="description"
                      autoComplete="off"
                      disabled="true"
                      />
                  </div>
                  <div className="form-group">
                    <label htmlFor="counterparty1">Counterparty 1 Wallet Addr *</label>
                    <select
                          onChange={this.onChangeCounterParty1}                         
                          className="form-control"
                          id="counterparty1"
                          disabled="true"
                          >
                          <option value=""> </option>
                          {
                            Array.isArray(recipientList) ?
                            recipientList.map( (d) => {
                                // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                                if (typeof d.id === "number")
                                  return <option value={d.id} selected={d.walletaddress === this.state.currentRepo.counterparty1}>{d.name} ({d.walletaddress})</option>
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
                          disabled="true"
                          >
                          <option value=""> </option>
                          {
                            Array.isArray(recipientList) ?
                            recipientList.map( (d) => {
                                // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                                if (typeof d.id === "number")
                                  return <option value={d.walletaddress} selected={d.walletaddress === this.state.currentRepo.counterparty2}>{d.name} ({d.walletaddress})</option>
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
                          disabled="true"
                          >
                          <option value=""> </option>
                          <option value="" disabled>--- Digital Cash ---</option>
                          {
                            Array.isArray(underlyingDSGDList) ?
                            underlyingDSGDList.map( (d) => {
                              // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                                if (typeof d.id === "number")
                                  return <option value={d.id} selected={d.id === this.state.currentRepo.underlyingTokenID1}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                              })
                            : null
                          }
                          <option value="" disabled>--- PBM ---</option>
                          {
                            Array.isArray(PBMList) ?
                            PBMList.map( (d) => {
                              // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                                if (typeof d.id === "number")
                                  return <option value={d.id} selected={d.id === this.state.currentRepo.underlyingTokenID1}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
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
                          disabled="true"
                          >
                          <option value=""> </option>
                          <option value="" disabled>--- Digital Cash ---</option>
                          {
                            Array.isArray(underlyingDSGDList) ?
                            underlyingDSGDList.map( (d) => {
                              // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              if (typeof d.id === "number" && d.blockchain === this.state.currentRepo.blockchain)
                                return <option value={d.id} selected={d.id === this.state.currentRepo.underlyingTokenID2}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                            })
                            : null
                          }
                          <option value="" disabled>--- PBM ---</option>
                          {
                            Array.isArray(PBMList) ?
                            PBMList.map( (d) => {
                              // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              if (typeof d.id === "number" && d.blockchain === this.state.currentRepo.blockchain)
                                return <option value={d.id} selected={d.id === this.state.currentRepo.underlyingTokenID2}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                            })
                            : null
                          }
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="blockchain">Blockchain to deploy at</label>
                    {// use the blockchain where the underlying was deployed
                    }
                    <select
                          onChange={this.onChangeBlockchain}                         
                          className="form-control"
                          id="blockchain"
                          disabled="true"
                        >
                          <option >   </option>
                          <option value="80002"  selected={this.state.currentRepo.blockchain === 80002}>Polygon   Testnet Amoy</option>
                          <option value="11155111" selected={this.state.currentRepo.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                          <option value="80001"  selected={this.state.currentRepo.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
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
                          value={this.state.currentRepo.amount1}
                          onChange={this.onChangeAmount1}
                          name="amount1"
                          autoComplete="off"
                          disabled="true"
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
                          value={this.state.currentRepo.amount2}
                          onChange={this.onChangeAmount2}
                          name="amount2"
                          autoComplete="off"
                          disabled="true"
                          />
                      </div>
                    </td>
                    </tr>
                    </table>
                    <br/>
{/*
                    <div className="form-group">
                      <label htmlFor="checker">Checker *</label>
                      <select
                            value={currentRepo.checker}
                            onChange={this.onChangeChecker}                         
                            className="form-control"
                            id="checker"
                            disabled={!this.state.isMaker || this.state.currentRepo.txntype===2}
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
                        value={currentRepo.checkerComments}
                        onChange={this.onChangeCheckerComments}
                        name="checkerComments"
                        autoComplete="off"
                        disabled={!this.state.isChecker}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="approver">Approver *</label>
                      <select
                          value={currentRepo.approver}
                          onChange={this.onChangeApprover}                         
                          className="form-control"
                          id="approver"
                          disabled={!this.state.isMaker || this.state.currentRepo.txntype===2}
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
                        value={currentRepo.approverComments}
                        onChange={this.onChangeApproverComments}
                        name="approverComments"
                        autoComplete="off"
                        disabled={!this.state.isApprover}
                        />
                    </div>
*/}

                  </form>
                  {
                  //this.state.isMaker?
                  <>
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={this.executeRepo}
                    disabled={this.state.currentRepo.smartcontractaddress === ""}

                    >
                      Execute Repo transaction 
                      {
                        //(this.state.currentRepo.txntype===0? " Create ":
                        //(this.state.currentRepo.txntype===1? " Update ":
                        //(this.state.currentRepo.txntype===2? " Delete ":null)))
                      }
                      
                    </button> 
{/*
                    <button
                      className="m-3 btn btn-sm btn-danger"
                      onClick={this.showModal_dropRequest}
                    >
                      Drop Request
                    </button>
*/}
                </>

                  
                  /*
                  :
                  (this.state.isChecker? 
                  <button
                  type="submit"
                  className="m-3 btn btn-sm btn-primary"
                  onClick={this.acceptRepo}
                  >
                    Endorse
                    {
                      (this.state.currentRepo.txntype===0? " Create ":
                      (this.state.currentRepo.txntype===1? " Update ":
                      (this.state.currentRepo.txntype===2? " Delete ":null)))
                    }
                    Request

                  </button> 
                  :
                  (
                    this.state.isApprover?
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={this.state.currentRepo.txntype===2? this.deleteDraft: this.approveRepo}
                    >
                      Approve
                      {
                        (this.state.currentRepo.txntype===0? " Create ":
                        (this.state.currentRepo.txntype===1? " Update ":
                        (this.state.currentRepo.txntype===2? " Delete ":null)))
                      }
                      Request

                    </button> 
                  */
//                    : null
//                  ))
                  }
   &nbsp;
                  {
                    this.state.isChecker || this.state.isApprover ?

                  <button
                  type="submit"
                  className="m-3 btn btn-sm btn-danger"
                  onClick={this.rejectRepo}
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

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/repo'} handleProceed2={this.deleteRepo} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
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

export default withRouter(Repo);