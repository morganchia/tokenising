import React, { Component } from "react";
import PBMDataService from "../services/pbm.service";
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

class PBM extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeTokenName = this.onChangeTokenName.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeUnderlying = this.onChangeUnderlying.bind(this);

    this.onChangeDatafield1_name = this.onChangeDatafield1_name.bind(this);
    this.onChangeDatafield1_value = this.onChangeDatafield1_value.bind(this);
    this.onChangeDatafield2_name = this.onChangeDatafield2_name.bind(this);
    this.onChangeDatafield2_value = this.onChangeDatafield2_value.bind(this);
    this.onChangeOperator1 = this.onChangeOperator1.bind(this);

    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.onChangeSponsor = this.onChangeSponsor.bind(this);
    this.onChangeAmount = this.onChangeAmount.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.onChangeCheckerComments = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
    this.getPBM = this.getPBM.bind(this);
    this.createPBM = this.createPBM.bind(this);
    this.submitPBM = this.submitPBM.bind(this);
    this.acceptPBM = this.acceptPBM.bind(this);
    this.approvePBM = this.approvePBM.bind(this);
    this.rejectPBM = this.rejectPBM.bind(this);
    this.deletePBM = this.deletePBM.bind(this);
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

      adddatafield : false,
      hidedatafield1 : false,
      hidedatafield2 : true,  


      currentPBM: {
        id: 0,
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
        underlyingTokenID:"",      // underlyingTokenID
        underlyingDSGDsmartcontractaddress: "",
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

    this.getPBM(user, this.props.router.params.id);
    this.getAllPBMTemplates();
    this.getAllUnderlyingAssets();
    this.getAllSponsors();
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
        currentPBM: {
          ...prevState.currentPBM,
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
        currentPBM: {
          ...prevState.currentPBM,
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
        currentPBM: {
          ...prevState.currentPBM,
          description: description
        }
      };
    });
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

  onChangeDatafield1_name(e) {
    const datafield1_name = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentPBM: {
          ...prevState.currentPBM,
          datafield1_name: datafield1_name
        }
      };
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
    const datafield2_name = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentPBM: {
          ...prevState.currentPBM,
          datafield2_name: datafield2_name
        }
      };
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
    const datafield1_value = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentPBM: {
          ...prevState.currentPBM,
          datafield1_value: datafield1_value
        }
      };
    });
  }

  onChangeDatafield2_value(e) {
    const datafield2_value = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentPBM: {
          ...prevState.currentPBM,
          datafield2_value: datafield2_value
        }
      };
    });
  }

  onChangeOperator1(e) {
    const operator1 = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentPBM: {
          ...prevState.currentPBM,
          operator1: operator1
        }
      };
    });

    if (e.target.value === "") {
      this.setState(function(prevState) {
        return {
          currentPBM: {
            ...prevState.currentPBM,
            datafield2_name: "",
            datafield2_value: "",
          }
        };
      });
  
      this.setState({
        hidedatafield2: true,
      });
    } else {
      this.setState({
        hidedatafield2: false,
      });
    }
  }



  onChangeStartDate(e) {
    const startdate = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentPBM: {
        ...prevState.currentPBM,
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
      currentPBM: {
        ...prevState.currentPBM,
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
      currentPBM: {
        ...prevState.currentPBM,
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
      currentPBM: {
        ...prevState.currentPBM,
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

  getPBM(user, id) {
    console.log("+++ id:", id);

    if (id !== undefined && id != 0) {
      PBMDataService.getAllDraftsByPBMId(id)
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

  getAllSponsors() {
    /*
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
      */
    RecipientDataService.findAllRecipients()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            recipient: [ { id:-1, name:"No recipients available, please create a recipient first."}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            recipient: [first_array_record].concat(response.data)
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

  async createPBM() {  // for Maker

    if (this.state.isMaker) {  // only for Makers
      
        if (await this.validateForm() === true) { 

        console.log("this.state.currentPBM.underlyingTokenID= ", this.state.currentPBM.underlyingTokenID);

        console.log("Creating PBM draft this.state.underlyingDSGDList= ", this.state.underlyingDSGDList);
        console.log("Creating PBM draft underlyingDSGDsmartcontractaddress= ", this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.currentPBM.underlyingTokenID)).smartcontractaddress);
  
        var data = {
          name              : this.state.currentPBM.name,
          tokenname         : this.state.currentPBM.tokenname,
          description       : this.state.currentPBM.description,

          datafield1_name   : this.state.currentPBM.datafield1_name,
          datafield1_value  : this.state.currentPBM.datafield1_value,
          operator1         : this.state.currentPBM.operator1,
          datafield2_name   : this.state.currentPBM.datafield2_name,
          datafield2_value  : this.state.currentPBM.datafield2_value,

          underlyingTokenID : this.state.currentPBM.underlyingTokenID,
          underlyingDSGDsmartcontractaddress  : this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.currentPBM.underlyingTokenID)).smartcontractaddress,
          startdate         : this.state.currentPBM.startdate,
          enddate           : this.state.currentPBM.enddate,
          sponsor           : this.state.currentPBM.sponsor,
          amount            : this.state.currentPBM.amount,
          txntype           : 0,    // create
          maker             : this.state.currentUser.id,
          checker           : this.state.currentPBM.checker,
          approver          : this.state.currentPBM.approver,
          actionby          : this.state.currentUser.username,
          approvedpbmid: -1,
        };
    
        console.log("Form Validation passed! creating pbm...");
        //alert("Form validation passed! creating pbm...");

        console.log("IsLoad=true");
        this.show_loading();  // show progress


        await PBMDataService.draftCreate(data)
        .then(response => {
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();  // hide progress
    
          this.setState({
            id                  : response.data.id,
            name                : response.data.name,
            tokenname           : response.data.tokenname,
            description         : response.data.description,

            datafield1_name     : response.data.datafield1_name,
            datafield1_value    : response.data.datafield1_value,
            operator1           : response.data.operator1,
            datafield2_name     : response.data.datafield2_name,
            datafield2_value    : response.data.datafield2_value,
  
            underlyingTokenID   : response.data.underlyingTokenID,
            smartcontractaddress: response.data.smartcontractaddress,
            startdate           : response.data.startdate,
            enddate             : response.data.enddate,
            sponsor             : response.data.sponsor,
            amount              : response.data.amount,

            submitted: true,

          });
//          this.displayModal("PBM draft submitted for review" + (response.data.smartcontractaddress !==""? " with smart contract deployed at "+response.data.smartcontractaddress + ". You can start minting now.": "." ) ,
//                              "OK", null, null);
          this.displayModal("PBM creation request submitted for review.", "OK", null, null, null);

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

  } // createPBM()

  async submitPBM() {
    
    if (await this.validateForm()) { 
        console.log("Form Validation passed");
  
        console.log("IsLoad=true");
        this.show_loading();
  
        await PBMDataService.submitDraftById(
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
          this.displayModal("PBM submitted. Routing to checker.", "OK", null, null, null);
        })
        .catch(e => {
          this.hide_loading();
  
          console.log(e);
          console.log(e.message);
          this.displayModal("PBM submit failed.", null, null, null, "OK");
  
          try {
            console.log(e.response.data.message);
            // Need to check draft and approved pbm names
            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
              this.displayModal("The PBM submit failed. The new pbm name is already used, please use another name.", null, null, null, "OK");
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
  } // submitPBM()
    
  async acceptPBM() {
  
//    if (await this.validateForm()) { 
//      console.log("Form Validation passed");

      console.log("IsLoad=true");
      this.show_loading();

      await PBMDataService.acceptDraftById(
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
        this.displayModal("PBM request checked, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("PBM accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The pbm accept failed. The new pbm name is already used, please use another name.", null, null, null, "OK");
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
  } //  acceptPBM()

  async approvePBM() {
  
    //    if (await this.validateForm()) { 
    //      console.log("Form Validation passed");
    
    console.log("IsLoad=true");
    this.show_loading();

    await PBMDataService.approveDraftById(
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
      this.displayModal("The pbm is approved and executed successfully"+ (typeof(response.data.smartcontractaddress)!=="undefined" && response.data.smartcontractaddress!==null && response.data.smartcontractaddress!==""? " with smart contract deployed at "+response.data.smartcontractaddress+". \n\nYou can start using it to mint PBMs from DSGD now.": "."), "OK", null, null, null);
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
          this.displayModal("The pbm update failed. The new pbm name is already used, please use another name.", null, null, null, "OK");
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
  } // approvePBM()

  async rejectPBM() {

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

      await PBMDataService.rejectDraftById(
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
        this.displayModal("This pbm request is rejected. Routing back to maker.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("PBM rejection failed.", null, null, null, "OK");
      });
    }
    this.hide_loading();
  }
    
  async deletePBM() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await PBMDataService.approveDeleteDraftById(
      this.state.currentPBM.id,
      this.state.currentPBM,
    )
    .then(response => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress

      this.displayModal("PBM is deleted.", "OK", null, null, null);
      console.log(response.data);
      //this.props.router.navigate('/inbox');
    })
    .catch(e => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      console.log(e);
    });
  } // deletePBM()

  async dropRequest() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await PBMDataService.dropRequestById(
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
    this.displayModal("Are you sure you want to Delete this PBM?", null, "Yes, delete", null, "Cancel");
  };

  hideModal = () => {
    this.setState({ showm: false });
  };


  render() {
    const { underlyingDSGDList, recipient, currentPBM, checkerList, approverList } = this.state;
    console.log("Render underlyingDSGDList:", underlyingDSGDList);
    console.log("Render recipient:", recipient);
    console.log("Render currentPBM:", currentPBM);

    try {
      return (
        <div className="container">
          { 
            (this.state.userReady) ?
            <div>
            <header className="jumbotron col-md-8">
              <h3>
                <strong>{this.state.currentPBM.txntype===0?"Create ":(this.state.currentPBM.txntype===1?"Update ":(this.state.currentPBM.txntype===2?"Delete ":null))}PBM { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
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
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    maxLength="45"
                    value={currentPBM.name}
                    onChange={this.onChangeName}
                    disabled={!this.state.isMaker || this.state.currentPBM.txntype===2}
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
                    value={currentPBM.description}
                    onChange={this.onChangeDescription}
                    name="description"
                    autoComplete="off"
                    disabled={!this.state.isMaker || this.state.currentPBM.txntype===2}
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
                    value={currentPBM.tokenname}
                    onChange={this.onChangeTokenName}
                    name="tokenname"
                    style={{textTransform : "uppercase"}}
                    disabled={!this.state.isMaker || this.state.currentPBM.txntype===2}
                    />
                </div>

                <label htmlFor="datafield1_name">PBM Conditions</label>

                <table style={{border : '1px solid blue', width: '100%'}}>
                <tr>
                {/*
                  <td style={{fontSize:"100px", border:"0"}}>(</td>
                */}
                  <td style={{border : '0'}}>
                    <div className="form-group" id="datafield1_name_div" style={{ display: (this.state.hidedatafield1 || !this.state.isMaker || currentPBM.txntype===2) ? "none" : "block" }}>
                      <label htmlFor="datafield1_name">{currentPBM.datafield1_name === ""? "Please choose a field" : ""}</label>
                      <select
                        onChange={this.onChangeDatafield1_name}                         
                        className="form-control"
                        id="datafield1_name"
                        name="datafield1_name"

                        disabled={!this.state.isMaker || currentPBM.txntype===2}
                        >
                        <option value=""></option>
                        <option value="UEN"           selected={typeof(this.state.currentPBM.datafield1_name) === 'string' && this.state.currentPBM.datafield1_name.toUpperCase() === "UEN"}>UEN</option>
                        <option value="IndustryCode" selected={typeof(this.state.currentPBM.datafield1_name) === 'string' && this.state.currentPBM.datafield1_name.toUpperCase() === "INDUSTRYCODE"}>Industry code</option>
                        <option value="Location"      selected={typeof(this.state.currentPBM.datafield1_name) === 'string' && this.state.currentPBM.datafield1_name.toUpperCase() === "LOCATION"}>Location</option>
                        <option value="PostalCode"   selected={typeof(this.state.currentPBM.datafield1_name) === 'string' && this.state.currentPBM.datafield1_name.toUpperCase() === "POSTALCODE"}>Postal code</option>
                      </select>
                    </div>
                    { this.state.currentPBM.datafield1_name !=="" && (
                    <div className="form-group">
                      <label onClick={() => this.setState({ hidedatafield1: false })} htmlFor="datafield1_value">{this.state.currentPBM.datafield1_name} &nbsp;<i class="bx bx-cog" style={{ display: (!this.state.isMaker || this.state.currentPBM.txntype===2) ? "none" : "block" }}/></label>
                      <input
                        className="form-control"
                        id="datafield1_value"
                        name="datafield1_value"
                        maxLength="16"
                        required
                        value={this.state.currentPBM.datafield1_value}
                        onChange={this.onChangeDatafield1_value}
                        autoComplete="off"
                        disabled={!this.state.isMaker || this.state.currentPBM.txntype===2}
                      />
                    </div>
                    )
                  }
                  </td>
                  { this.state.isMaker && this.state.currentPBM.datafield1_name !=="" && this.state.currentPBM.datafield1_value !=="" && (!this.state.adddatafield && this.state.currentPBM.operator1 ==="") && (
                  <td style={{border : '0'}}>
                    <label htmlFor="operator1">&nbsp;</label>
                    <div className="form-group">
                    <button onClick={() => this.setState({ adddatafield: true })} className="btn btn-primary">Add more condition?</button>
                    </div>
                  </td>
                  )
                  }
                  { this.state.currentPBM.datafield1_name !=="" && this.state.currentPBM.datafield1_value !=="" && (this.state.adddatafield || this.state.currentPBM.operator1 !=="") && (
                  <td style={{border : '0'}}>
                    <div className="form-group">
                      <label htmlFor="operator1">{this.state.currentPBM.operator1 === ""? "Please choose an operator" : ""}&nbsp;</label>
                      <select style={{width: "90px"}}
                            onChange={this.onChangeOperator1}                         
                            className="form-control"
                            id="operator1"
                            disabled={!this.state.isMaker || this.state.currentPBM.txntype===2}
                      >
                            <option value=""></option>
                            <option value="OR"    selected={typeof(this.state.currentPBM.operator1) === 'string' && this.state.currentPBM.operator1.toUpperCase() === "OR"}> OR </option>
                            <option value="AND"   selected={typeof(this.state.currentPBM.operator1) === 'string' && this.state.currentPBM.operator1.toUpperCase() === "AND"}> AND </option>
                      </select>
                    </div>
                  </td>
                  )
                  }
                  <td style={{border : '0'}}>
                  {  this.state.currentPBM.operator1 !=="" && this.state.currentPBM.datafield1_name !=="" && this.state.currentPBM.datafield1_value !=="" && (
                    <div className="form-group" id="datafield2_name_div" style={{ display: (this.state.hidedatafield2 || !this.state.isMaker || this.state.currentPBM.txntype===2) ? "none" : "block" }}>
                    <label htmlFor="datafield2_name">{this.state.currentPBM.datafield2_name === ""? "Please choose a field" : ""}</label>
                    <select
                      onChange={this.onChangeDatafield2_name}                         
                      className="form-control"
                      id="datafield2_name"
                      name="datafield2_name"
                      disabled={!this.state.isMaker || this.state.currentPBM.txntype===2}
                    >
                      <option value=""></option>
                      <option value="UEN"           selected={typeof(this.state.currentPBM.datafield2_name) === 'string' && this.state.currentPBM.datafield2_name.toUpperCase() === "UEN"}>UEN</option>
                      <option value="IndustryCode" selected={typeof(this.state.currentPBM.datafield2_name) === 'string' && this.state.currentPBM.datafield2_name.toUpperCase() === "INDUSTRYCODE"}>Industry code</option>
                      <option value="Location"      selected={typeof(this.state.currentPBM.datafield2_name) === 'string' && this.state.currentPBM.datafield2_name.toUpperCase() === "LOCATION"}>Location</option>
                      <option value="PostalCode"   selected={typeof(this.state.currentPBM.datafield2_name) === 'string' && this.state.currentPBM.datafield2_name.toUpperCase() === "POSTALCODE"}>Postal code</option>
                    </select>
                  </div>
                  )}
                  { this.state.currentPBM.datafield2_name !=="" &&  this.state.currentPBM.operator1 !=="" && this.state.currentPBM.datafield1_name !=="" && this.state.currentPBM.datafield1_value !=="" && (
                  <div className="form-group">
                      <label onClick={() => this.setState({ hidedatafield2: false })} htmlFor="datafield2_value">{this.state.currentPBM.datafield2_name} &nbsp;<i class="bx bx-cog" style={{ display: (!this.state.isMaker || this.state.currentPBM.txntype===2) ? "none" : "block" }}/></label>
                    <input
                      className="form-control"
                      id="datafield2_value"
                      name="datafield2_value"
                      maxLength="16"
                      required
                      value={this.state.currentPBM.datafield2_value}
                      onChange={this.onChangeDatafield2_value}
                      autoComplete="off"
                      disabled={!this.state.isMaker || this.state.currentPBM.txntype===2}
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
                  <label htmlFor="name">Underlying DSGD Smart Contract *</label>
                  <select
                        onChange={this.onChangeUnderlying}                         
                        className="form-control"
                        id="underlyingTokenID"
                        required
                        disabled={!this.state.isMaker || this.state.currentPBM.txntype===2}
                  >
                        <option value=""> </option>
                        {
                          Array.isArray(underlyingDSGDList) ?
                          underlyingDSGDList.map( (d) => {
                            if (typeof d.id === "number")
                            // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              return <option value={d.id} selected={d.id === (currentPBM.campaign? currentPBM.campaign.id : this.state.underlyingTokenID)}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
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
                        <option value="80002"  selected={currentPBM.campaign ? currentPBM.campaign.blockchain === 80002 : this.state.blockchain === 80002}>Polygon   Testnet Amoy</option>
                        <option value="11155111" selected={currentPBM.campaign ? currentPBM.campaign.blockchain === 11155111 : this.state.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                        <option value="80001"  selected={currentPBM.campaign ? currentPBM.campaign.blockchain === 80001 : this.state.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                        <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                        <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                        <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                        <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                      </select>
                </div>

                <div className="form-group">
                  <label htmlFor="startdate">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="startdate"
                    value={currentPBM.startdate}
                    onChange={this.onChangeStartDate}
                    disabled={!this.state.isMaker || currentPBM.txntype===2}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="enddate">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="enddate"
                    value={currentPBM.enddate}
                    onChange={this.onChangeEndDate}
                    disabled={!this.state.isMaker || currentPBM.txntype===2}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sponsor">Sponsor</label>
                  <select
                    value={currentPBM.sponsor}
                    onChange={this.onChangeSponsor}                         
                    className="form-control"
                    id="sponsor"
                    disabled={!this.state.isMaker || currentPBM.txntype===2}
                    >
                  {
                    Array.isArray(recipient) ?
                      recipient.map( (d) => {
                        //return <option value={d.id}>{d.name}</option>
                        // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                        return <option value={d.id} selected={d.id === currentPBM.sponsor}>{d.name}</option>

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
                {
                (currentPBM.id !== 0 ? // add new pbm
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
                    disabled={!this.state.isChecker || currentPBM.id === 0}
                    />
                </div>
                :
                null
                )
                }
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
                { 
                (currentPBM.id !== 0 ? // add new pbm
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
                    disabled={!this.state.isApprover || currentPBM.id === 0}
                    />
                </div>
                : null
              )
                }


              </form>
              {
              this.state.isMaker? ( currentPBM.id === 0?
                <button onClick={this.createPBM} className="btn btn-primary">
                  Submit for Review
                </button>
                :
              <>
                <button
                type="submit"
                className="m-3 btn btn-sm btn-primary"
                onClick={this.submitPBM}
                >
                  Submit 
                  {
                    (currentPBM.txntype===0? " Create ":
                    (currentPBM.txntype===1? " Update ":
                    (currentPBM.txntype===2? " Delete ":null)))
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
              )
              : (this.state.isChecker? 
              <button
              type="submit"
              className="m-3 btn btn-sm btn-primary"
              onClick={this.acceptPBM}
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
                onClick={currentPBM.txntype===2? this.deleteDraft: this.approvePBM}
                >
                  Approve
                  {
                    (currentPBM.txntype===0? " Create ":
                    (currentPBM.txntype===1? " Update ":
                    (currentPBM.txntype===2? " Delete ":null)))
                  }
                  Request

                </button> 
                : null
              ))
              }
&nbsp;
              {
                currentPBM.id !== 0 && (this.state.isChecker || this.state.isApprover) ?

              <button
              type="submit"
              className="m-3 btn btn-sm btn-danger"
              onClick={this.rejectPBM}
              >
                Reject
              </button> 
              : null
              }
&nbsp;
              { 
                this.state.isMaker?
                (this.state.datachanged ? 
                  <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>
                    Cancel
                  </button>
                  : 
                  <Link to="/pbm">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Cancel
                  </button>
                  </Link>
                )
              : 
                <Link to="/pbm">
                <button className="m-3 btn btn-sm btn-secondary">
                  Cancel
                </button>
                </Link>
              }  

              {this.state.isLoading ? <LoadingSpinner /> : null}

              <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/pbm'} handleProceed2={this.deletePBM} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
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

export default withRouter(PBM);