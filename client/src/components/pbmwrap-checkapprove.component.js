import React, { Component } from "react";
import PBMDataService from "../services/pbm.service";
import CampaignDataService from "../services/campaign.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { withRouter } from '../common/with-router';
import AuthService from "../services/auth.service";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";

class PBMWrapMint extends Component {
  constructor(props) {
    super(props);
    this.onChangeUnderlying       = this.onChangeUnderlying.bind(this);
    this.onChangePBMWrapMint      = this.onChangePBMWrapMint.bind(this);

    this.onChangeAmount           = this.onChangeAmount.bind(this);
    this.onChangeChecker          = this.onChangeChecker.bind(this);
    this.onChangeApprover         = this.onChangeApprover.bind(this);
    this.onChangeCheckerComments  = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
    this.getPBMwrapmint           = this.getPBMwrapmint.bind(this);
    this.submitPBMWrapMint        = this.submitPBMWrapMint.bind(this);
    this.acceptPBMWrapMint        = this.acceptPBMWrapMint.bind(this);
    this.approvePBMWrapMint       = this.approvePBMWrapMint.bind(this);
    this.rejectPBMWrapMint        = this.rejectPBMWrapMint.bind(this);
    this.deletePBMWrapMint        = this.deletePBMWrapMint.bind(this);
    this.dropWrapMintRequest      = this.dropWrapMintRequest.bind(this);
    this.showModal_Leave          = this.showModal_Leave.bind(this);
    this.showModal_dropWrapMintRequest = this.showModal_dropWrapMintRequest.bind(this);
    this.hideModal                = this.hideModal.bind(this);

    this.state = {      

      adddatafield : false,
      hidedatafield1 : true,
      hidedatafield2 : true,  

      PBMList: [],
      pbm_id: "",


      currentPBM: {
        id: null,
        name: "",
        tokenname: "",
        description: "",

        datafield1_name: "",
        datafield1_value: "",
        operator1: "",
        datafield2_name: "",
        datafield2_value: "",

        smartcontractaddress: "",
        blockchain: "",
        startdate: "",
        enddate: "",
        sponsor: "",
        amount: "",
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedpbmid: null,
        actionby: "",
        name_changed: 0,
        description_changed: 0,
        startdate_changed: 0,
        enddate_changed: 0,
        sponsor_changed: 0,
        amount_changed: 0,
      },

      originalPBM: {
        id: null,
        name: "",
        tokenname: "",
        description: "",

        datafield1_name: "",
        datafield1_value: "",
        operator1: "",
        datafield2_name: "",
        datafield2_value: "",

        smartcontractaddress: "",
        blockchain: "",
        underlyingTokenID:"",      // underlyingTokenID
        startdate: "",
        enddate: "",
        sponsor: "",
        amount: "",
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedpbmid: null,
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
      isNewPBM: null,
      
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
    UserOpsRoleDataService.getAllMakersCheckersApprovers("wrapmint")
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

  async retrievePBM() {
    await PBMDataService.getAll()
      .then(response => {
        this.setState({
          PBMList: response.data
        });
        console.log("Response data from retrievePBM() PBMDataService.getAll:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }

  async getPBMwrapmint(user, id) {
    console.log("+++ id:", id);

    if (id !== undefined) {
      await PBMDataService.getAllWrapMintDraftsById(id)
        .then(response => {
          response.data[0].actionby = user.username;
          this.setState({
            currentPBM: response.data[0],
            originalPBM: response.data[0],
          });
          console.log("Response from getAllDraftsByPBMId(id):",response.data[0]);

          let ismaker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "MAKER" && user.id === response.data[0].maker);
          console.log("isMaker:", (ismaker === undefined? false: true));
          this.setState({ isMaker: (ismaker === undefined? false: true),});
      
          let ischecker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "CHECKER" && user.id === response.data[0].checker);
          console.log("isChecker:", (ischecker === undefined? false: true));
          this.setState({ isChecker: (ischecker === undefined? false: true),});
          //if (ischecker !== undefined) {  // clears the checkers comments
          //  this.setState({ isChecker: true, currentPBM: {checkerComments: ""}, });
          //}
          

          let isapprover= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "APPROVER" && user.id === response.data[0].approver);
          console.log("isApprover:", (isapprover === undefined? false: true));
          this.setState({ isApprover: (isapprover === undefined? false: true),});
          /*
          if (isapprover !== undefined) {
            this.setState({ isApprover: true, currentPBM: {approverComments: ""}, });
          }
          */

          this.setState({ isNewPBM : (response.data[0].smartcontractaddress === "" || response.data[0].smartcontractaddress === null) });
        })
        .catch(e => {
          console.log("Error from getAllDraftsByPBMId(id):", e);
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
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user) this.setState({ redirect: "/home" });
    this.setState({ currentUser: user, userReady: true })

    this.getPBMwrapmint(user, this.props.router.params.id);
    this.retrievePBM();
    this.getAllUnderlyingAssets();
    this.retrieveAllMakersCheckersApprovers();
  }

  onChangeUnderlying(e) {
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
        currentPBM: {
          ...prevState.currentPBM,
          underlyingTokenID: underlyingTokenID,
          blockchain: newBlockchain,
          underlyingDSGDsmartcontractaddress: newUnderlyingDSGDsmartcontractaddress,
          campaign: newCampaign,
        }
      };
    });
    console.log("New currentPBM=", this.state.currentPBM);
  }

  onChangePBMWrapMint(e) {
    const pbm_id = e.target.value;  // remove . and other chars

    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentPBM: {
        ...prevState.currentPBM,
        pbm_id: pbm_id,
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
      currentPBM: {
        ...prevState.currentPBM,
        amount: amount
      }
    }));
  }

  updateCurrentPBM(s) {
    
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentPBM: {
        ...prevState.currentPBM,
        PBMsmartcontractaddress: s
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
      currentPBM: {
        ...prevState.currentPBM,
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
        currentPBM: {
          ...prevState.currentPBM,
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
      currentPBM: {
        ...prevState.currentPBM,
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
        currentPBM: {
          ...prevState.currentPBM,
          approverComments: approverComments
        }
      };
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

    if (!(typeof this.state.currentPBM.name ==='string' || this.state.currentPBM.name instanceof String)) {
      err += "- Name cannot be empty\n";
    } else if ((this.state.currentPBM.name.trim() === "")) {
      err += "- Name cannot be empty\n"; 
    } else if (this.state.isNewPBM) { // only check if new pbm, dont need to check if it is existing pbm because surely will have name alrdy
      await PBMDataService.findByNameExact(this.state.currentPBM.name.trim())
      .then(response => {
        console.log("Find duplicate name:",response.data);

        if (response.data.length > 0) {
          err += "- Name of pbm is already present (duplicate name)\n";
          console.log("Found pbm name (duplicate!):"+this.state.currentPBM.name);
        } else {
          console.log("Didnt find pbm name1 (ok no duplicate):"+this.state.currentPBM.name);
        }
      })
      .catch(e => {
        console.log("Didnt find pbm name2 (ok no duplicate):"+this.state.currentPBM.name);
        // ok to proceed
      });
    }
        
      // dont need t check description, it can be empty
    if (! validator.isDate(this.state.currentPBM.startdate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.currentPBM.enddate)) err += "- End Date is invalid\n";
    if (this.state.currentPBM.sponsor === "") err += "- Sponsor cannot be empty\n";
    if (this.state.currentPBM.amount === "") err += "- Amount cannot be empty\n";
    if (parseInt(this.state.currentPBM.amount) <=  0) err += "- Amount must be more than zero\n";
    if (this.state.currentPBM.startdate.trim() !== "" && this.state.currentPBM.enddate.trim() !== "" && this.state.currentPBM.startdate > this.state.currentPBM.enddate) err += "- Start date cannot be later than End date\n";    

    console.log("start date:'"+this.state.currentPBM.startdate+"'");
    console.log("end date:'"+this.state.currentPBM.enddate+"'");
    console.log("Start > End? "+ (this.state.currentPBM.startdate > this.state.currentPBM.enddate));

    if (this.state.currentPBM.checker === "" || this.state.currentPBM.checker === null) err += "- Checker cannot be empty\n";
    if (this.state.currentPBM.approver === "" || this.state.currentPBM.approver === null) err += "- Approver cannot be empty\n";
    if (this.state.currentPBM.checker === this.state.currentUser.id.toString() 
        && this.state.currentPBM.approver === this.state.currentUser.id.toString()) {
      err += "- Maker, Checker and Approver cannot be the same person\n";
    } else {
      if (this.state.currentPBM.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.currentPBM.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
      if (this.state.currentPBM.checker!==null && this.state.currentPBM.checker!=="" 
            && this.state.currentPBM.checker === this.state.currentPBM.approver) err += "- Checker and Approver cannot be the same person\n";
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

async submitPBMWrapMint() {
  
  if (await this.validateForm()) { 
        console.log("Form Validation passed");
  
        console.log("IsLoad=true");
        this.show_loading();
  
        await PBMDataService.submitWrapMintDraftById(
          this.state.currentPBM.id,
          this.state.currentPBM,
        )
        .then(response => {
          this.hide_loading();
  
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();
    
          this.setState({  
            datachanged: false,
          });
          this.displayModal("WrapMint submitted. Routing to checker.", "OK", null, null, null);
        })
        .catch(e => {
          this.hide_loading();
  
          console.log(e);
          console.log(e.message);
          this.displayModal("WrapMint submit failed.", null, null, null, "OK");
  
          try {
            console.log(e.response.data.message);
            // Need to check draft and approved pbm names
            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
              this.displayModal("The WrapMint submit failed. The new WrapMint name is already used, please use another name.", null, null, null, "OK");
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
    
async acceptPBMWrapMint() {
  
//    if (await this.validateForm()) { 
//      console.log("Form Validation passed");

      console.log("IsLoad=true");
      this.show_loading();

      await PBMDataService.acceptWrapMintDraftById(
        this.state.currentPBM.id,
        this.state.currentPBM,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();
  
        this.setState({  
          datachanged: false,
        });
        this.displayModal("WrapMint request accepted, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("WrapMint accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The wrapmint accept failed. The new wrapmint name is already used, please use another name.", null, null, null, "OK");
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

async approvePBMWrapMint() {
  
    //    if (await this.validateForm()) { 
    //      console.log("Form Validation passed");
    
    console.log("IsLoad=true");
    this.show_loading();

    await PBMDataService.approveWrapMintDraftById(
      this.state.currentPBM.id,
      this.state.currentPBM,
    )
    .then(response => {
      this.hide_loading();

      console.log("!!! Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      const defaultmsg = "The Digital SGD has been wrapped successfully and new PBM is minted.";
      this.displayModal(response.data.message, "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log("-->response:",e);
      console.log(e.message);
      //this.displayModal("PBM approval failed. "+e.message+".", null, null, "OK");
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      try {
        console.log(e.response.data.message);
        if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
          this.displayModal("The wrapmint failed. The new wrapmint name is already used, please use another name.", null, null, null, "OK");
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

async rejectPBMWrapMint() {

  console.log("isChecker? ", this.state.isChecker);
  console.log("this.state.currentPBM.checkerComments: ", this.state.currentPBM.checkerComments);
  console.log("isApprover? ", this.state.isApprover);
  console.log("this.state.currentPBM.approverComments: ", this.state.currentPBM.approverComments);

  if ( this.state.isChecker && (typeof this.state.currentPBM.checkerComments==="undefined" || this.state.currentPBM.checkerComments==="" || this.state.currentPBM.checkerComments===null)) { 
    this.displayModal("Please enter the reason for rejection in the Checker Comments.", null, null, null, "OK");
  } else 
  if (this.state.isApprover && (typeof this.state.currentPBM.approverComments==="undefined" || this.state.currentPBM.approverComments==="" || this.state.currentPBM.approverComments===null)) {
    this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
  } else {
    //console.log("Form Validation passed");
  
    console.log("IsLoad=true");
    this.show_loading();

    await PBMDataService.rejectWrapMintDraftById(
      this.state.currentPBM.id,
      this.state.currentPBM,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("This wrapmint request is rejected. Routing back to maker.", "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log(e);
      console.log(e.message);
      this.displayModal("WrapMint rejection failed.", null, null, null, "OK");
    });
  }
  this.hide_loading();
}

async deletePBMWrapMint() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await PBMDataService.approveDeleteWrapMintDraftById(
      this.state.currentPBM.id,
      this.state.currentPBM,
    )
    .then(response => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress

      this.displayModal("WrapMint is deleted.", "OK", null, null, null);
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

  async dropWrapMintRequest() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await PBMDataService.dropWrapMintRequestById(
      this.state.currentPBM.id,
      this.state.currentPBM,
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

  showModal_Leave = () => {
    this.displayModal("You have made changes. Are you sure you want to leave this page without submitting?", "Yes, leave", null, null, "Cancel");
  };

  showModal_dropWrapMintRequest = () => {
    this.displayModal("Are you sure you want to Drop this Request?", null, null, "Yes, drop", "Cancel");
  };
  
  showModalDelete = () => {
    this.displayModal("Are you sure you want to Delete this PBM?", null, "Yes, delete", null, "Cancel");
  };0

  hideModal = () => {
    this.setState({ showm: false });
  };

  render() {
    const { underlyingDSGDList, PBMList, currentPBM, checkerList, approverList } = this.state;
    console.log("Render underlyingDSGDList:", underlyingDSGDList);
    console.log("Render PBMList:", PBMList);
    console.log("Render currentPBM:", currentPBM);

//    console.log(">>> PBMList is array and not empty? ", this.state.PBMList.length > 0)
//    console.log(">>> currentPBM ===''? ", this.state.currentPBM ==="")
    
    if (this.state.PBMList.length>0 && this.state.currentPBM.id !== null && this.state.currentPBM.PBMsmartcontractaddress === null) { // wait for loading... 
      // if didnt check currentPBM.smartcontractaddress === null, and we keep updating, it will cause infinite re-render
      const PBMsmartcontractaddress1 = this.state.PBMList.find((ee) => ee.id === parseInt(this.state.currentPBM.pbm_id)).smartcontractaddress
      console.log("Render ----- PBMsmartcontractaddress:", PBMsmartcontractaddress1);

      this.updateCurrentPBM(PBMsmartcontractaddress1);
    }

    try {
      return (
        <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>{this.state.currentPBM.txntype===0?"Create ":(this.state.currentPBM.txntype===1?"Update ":(this.state.currentPBM.txntype===2?"Delete ":null))}Wrap Digtal SGD with PBM { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
            </h3>
          </header>

        </div>: null}

          <div className="edit-form list-row">
            <h4></h4>
            <div className="col-md-8">
              <form autoComplete="off">
                <div className="form-group">
                  <label htmlFor="name">Digital SGD *</label>
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
                      // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                        if (typeof d.id === "number")
                          return <option value={d.id} selected={d.id === currentPBM.campaign.id}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                      })
                    : null
                  }
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="name">PBM *</label>
                  <select
                        onChange={this.onChangePBMWrapMint}                         
                        className="form-control"
                        id="pbm_id"
                        disabled={!this.state.isMaker || this.state.underlyingTokenID===""}
                      >
                        <option > </option>
                        {
                          Array.isArray(PBMList) ?
                          PBMList.map( (d) => {
                            // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              return <option value={d.id} selected={d.id === currentPBM.pbm_id}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                            })
                          : null
                        }
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="blockchain">Blockchain *</label>
                  <select
                        onChange={this.onChangeBlockchain}                         
                        className="form-control"
                        id="blockchain"
                        disabled="true"
                        >
                        <option >   </option>
                        <option value="80002"  selected={currentPBM.campaign.blockchain === 80002}>Polygon   Testnet Amoy</option>
                        <option value="11155111" selected={currentPBM.campaign.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                        <option value="80001"  selected={currentPBM.campaign.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                        <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                        <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                        <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                        <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
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
                        value={currentPBM.amount}
                        onChange={this.onChangeAmount}
                        disabled={!this.state.isMaker || this.state.currentPBM.txntype===2}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="checker">Checker *</label>
                      <select
                            value={currentPBM.checker}
                            onChange={this.onChangeChecker}                         
                            className="form-control"
                            id="checker"
                            disabled={!this.state.isMaker || this.state.currentPBM.txntype===2}
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
                        value={currentPBM.checkerComments}
                        onChange={this.onChangeCheckerComments}
                        name="checkerComments"
                        autoComplete="off"
                        disabled={!this.state.isChecker}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="approver">Approver *</label>
                      <select
                          value={currentPBM.approver}
                          onChange={this.onChangeApprover}                         
                          className="form-control"
                          id="approver"
                          disabled={!this.state.isMaker || this.state.currentPBM.txntype===2}
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
                        value={currentPBM.approverComments}
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
                    onClick={this.submitPBMWrapMint}
                    >
                      Submit 
                      {
                        (this.state.currentPBM.txntype===0? " Create ":
                        (this.state.currentPBM.txntype===1? " Update ":
                        (this.state.currentPBM.txntype===2? " Delete ":null)))
                      }
                      Request

                    </button> 

                    <button
                      className="m-3 btn btn-sm btn-danger"
                      onClick={this.showModal_dropWrapMintRequest}
                    >
                      Drop Request
                    </button>
                </>

                  : (this.state.isChecker? 
                  <button
                  type="submit"
                  className="m-3 btn btn-sm btn-primary"
                  onClick={this.acceptPBMWrapMint}
                  >
                    Endorse
                    {
                      (this.state.currentPBM.txntype===0? " Create ":
                      (this.state.currentPBM.txntype===1? " Update ":
                      (this.state.currentPBM.txntype===2? " Delete ":null)))
                    }
                    Request

                  </button> 
                  :
                  (
                    this.state.isApprover?
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={this.state.currentPBM.txntype===2? this.deleteDraft: this.approvePBMWrapMint}
                    >
                      Approve
                      {
                        (this.state.currentPBM.txntype===0? " Create ":
                        (this.state.currentPBM.txntype===1? " Update ":
                        (this.state.currentPBM.txntype===2? " Delete ":null)))
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
                  onClick={this.rejectPBMWrapMint}
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

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/inbox'} handleProceed2={this.deletePBMWrapMint} handleProceed3={this.dropWrapMintRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
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

export default withRouter(PBMWrapMint);