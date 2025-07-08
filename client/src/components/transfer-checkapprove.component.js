import React, { Component } from "react";
import TransferDataService from "../services/transfer.service";
import CampaignDataService from "../services/campaign.service";
import RecipientDataService from "../services/recipient.service";
import PBMDataService from "../services/pbm.service";
import BondDataService from "../services/bond.service";

import UserOpsRoleDataService from "../services/user_opsrole.service";
import { withRouter } from '../common/with-router';
import AuthService from "../services/auth.service";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";

class Transfer extends Component {
  constructor(props) {
    super(props);
    /*
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeTokenName = this.onChangeTokenName.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.onChangeSponsor = this.onChangeSponsor.bind(this);
    */
    this.onChangeCampaign = this.onChangeCampaign.bind(this);
    this.onChangeRecipient = this.onChangeRecipient.bind(this);
    this.onChangeAmount = this.onChangeAmount.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.onChangeCheckerComments = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
    this.getTransfer = this.getTransfer.bind(this);
    this.saveTransfer = this.saveTransfer.bind(this);     // create new draft
    this.submitTransfer = this.submitTransfer.bind(this);  // amend draft
    this.acceptTransfer = this.acceptTransfer.bind(this);
    this.approveTransfer = this.approveTransfer.bind(this);
    this.rejectTransfer = this.rejectTransfer.bind(this);
    this.deleteTransfer = this.deleteTransfer.bind(this);
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

      recipientList: {
        id: null,
        name: "",
        walletaddress: "",
      },

      campaignList: {
        id: null,
        name: "",
      },

      currentTransfer: {
        id: 0,    // 0 for new transfer draft
        campaign: null,
        recipientwallet: "",
        transferAmount: "",
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedtransferid: null,
        actionby: "",
        status: 0,
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
      isNewTransfer: null,
      
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

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user) this.setState({ redirect: "/home" });
    this.setState({ currentUser: user, userReady: true })

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
    
    this.getAllRecipients();

    Promise.all([this.getAllCampaigns(), this.getAllPBMs(), this.getAllBonds()])
    .then(() => {
      // Now call getTransfer after all data is populated
      this.getTransfer(user, this.props.router.params.id);
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      // Handle error appropriately
    });

    this.retrieveAllMakersCheckersApprovers();
  }

  async getAllBonds() {
      await BondDataService.getAll()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            bondList: [ { id:-1, name:""}],
          });
        } else {          
  //        var first_array_record = [  // add 1 empty record to front of array which is the option list
  //          { }
  //        ];
          this.setState({
  //          bondList: [first_array_record].concat(response.data)
            bondList: response.data
          });
        }
      });
  }

  async getAllPBMs() {
    await PBMDataService.getAll()
    .then(response => {
      if (response.data.length === 0) {
        this.setState({
          PBMList: [ { id:-1, name:""}],
        });
      } else {          
//        var first_array_record = [  // add 1 empty record to front of array which is the option list
//          { }
//        ];
        this.setState({
//          PBMList: [first_array_record].concat(response.data)
          PBMList: response.data
        });
      }
      console.log("Response data from retrievePBM() PBMDataService.getAll:", response.data);
    })
    .catch(e => {
      console.log(e);
    });
  }

  getAllRecipients() {
    RecipientDataService.findAllRecipients()
      .then(response => {
        console.log("recipientList from server:", response.data);
        console.log("Response.data length:", response.data.length);
        if (response.data.length === 0) {
          this.setState({
            recipientList: [ { id:-1, name:"No recipients available, please create a recipient first."}],
          });
        } else {          
//          var first_array_record = [  // add 1 empty record to front of array which is the option list
//            { }
//          ];
          this.setState({
//            recipientList: [first_array_record].concat(response.data)
            recipientList: response.data
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }
  
  async getAllCampaigns() {
    await CampaignDataService.getAll()
      .then(response => {
        console.log("campaignList from server:", response.data);
        console.log("Response.data length:", response.data.length);
        if (response.data.length === 0) {
          this.setState({
            campaignList: [ { id:-1, name:"No campaign available, please create a campaign first."}],
          });
        } else {          
//          var first_array_record = [  // add 1 empty record to front of array which is the option list
//            { }
//          ];
          this.setState({
//            campaignList: [first_array_record].concat(response.data)
            campaignList: response.data
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }
  
  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("transfer")
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

  
/*
  onChangeName(e) {
    const name = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentTransfer: {
          ...prevState.currentTransfer,
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
        currentTransfer: {
          ...prevState.currentTransfer,
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
        currentTransfer: {
          ...prevState.currentTransfer,
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
      currentTransfer: {
        ...prevState.currentTransfer,
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
      currentTransfer: {
        ...prevState.currentTransfer,
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
      currentTransfer: {
        ...prevState.currentTransfer,
        sponsor: sponsor
      }
    }));  
  }
*/

  updateToken(tokenid) {
    var newBlockchain = "";
    var selectedCampaign = "";
    var newCashTokensmartcontractaddress = "";
    var service = "";
    console.log("Updating token id:", tokenid);

    if (tokenid === "") 
      newBlockchain = "";
    else {
      if (tokenid < 1000000000) { // cash token
        selectedCampaign = this.state.campaignList.find((ee) => ee.id === parseInt(tokenid));
        newBlockchain = selectedCampaign.blockchain;
        service = CampaignDataService;
        console.log("Updating cash token!");
      } else if (tokenid < 2000000000) { // PBM token
        selectedCampaign = this.state.PBMList.find((ee) => ee.id === parseInt(tokenid));
        newBlockchain = selectedCampaign.campaign.blockchain;
        service = PBMDataService;
        console.log("Updating PBM token!");
      } else if (tokenid < 3000000000) { // Bond token
        selectedCampaign = this.state.bondList.find((ee) => ee.id === parseInt(tokenid));
        newBlockchain = selectedCampaign.campaign.blockchain;
        service = BondDataService;
        console.log("Updating Bond token!");
      }
      newCashTokensmartcontractaddress = selectedCampaign.smartcontractaddress
    }
    console.log("SelectedCampaign=", selectedCampaign);
    console.log("New blockchain=", newBlockchain);

    service.getInWalletMintedTotalSupply(tokenid)
    .then(response => {
      console.log("getInWalletMintedTotalSupply from server:", response.data);
      console.log("Response.data length:", response.data.length);
      if (! response.data) {
        this.setState({
          inwallet      : 0,
          minted_tokens : 0,
          totalSupply   : 0,
        });
      } else {          
        this.setState({
          inwallet      : response.data.inWallet,
          minted_tokens : response.data.totalMinted,
          totalSupply   : response.data.totalSupply,
        });
      }
    })
    .catch(e => {
      console.log(e);
      //return(null);
    });

    this.setState({
      datachanged: true
    });

    this.setState({
      campaignid: tokenid,
      // this.state.campaignList.find((ee) => ee.id === parseInt(cashTokenID)).blockchain;
      tokenname: (selectedCampaign ? selectedCampaign.tokenname : ""),
      blockchain: newBlockchain,
      smartcontractaddress: (selectedCampaign ? selectedCampaign.smartcontractaddress : ""),
      startdate: (selectedCampaign ? selectedCampaign.startdate : ""), 
      enddate: (selectedCampaign ? selectedCampaign.enddate : ""), 
      totalsupply: (selectedCampaign ? selectedCampaign.amount : ""),  // total supply
    });
  
    this.setState(function(prevState) {
      return {
        currentTransfer: {
          ...prevState.currentTransfer,
          cashTokenID: tokenid,
          blockchain: newBlockchain,
          CashTokensmartcontractaddress: newCashTokensmartcontractaddress,
          campaign: selectedCampaign,
        }
      };
    });
  }

  onChangeCampaign(e) {
    const tokenid = e.target.value;
    this.updateToken(tokenid);
  }

  onChangeRecipient(e) {
    const recipient_id = e.target.value;
    const selectedRecipient = this.state.recipientList.find((ee) => ee.id === parseInt(recipient_id));

    console.log("selectedRecipient: ", selectedRecipient);
    console.log("New Recipient=", e.target.value);
    
    this.setState({
      recipient: e.target.value,
      recipientwallet: (selectedRecipient ? selectedRecipient.walletaddress : ""),
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentTransfer: {
          ...prevState.currentTransfer,
          recipient: e.target.value,
          recipientwallet: (selectedRecipient ? selectedRecipient.walletaddress : ""),
        }
      };
    });
  }

  onChangeAmount(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");  // remove . and other chars
    const amount = e.target.value;
    
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentTransfer: {
        ...prevState.currentTransfer,
        transferAmount: amount
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
      currentTransfer: {
        ...prevState.currentTransfer,
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
        currentTransfer: {
          ...prevState.currentTransfer,
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
      currentTransfer: {
        ...prevState.currentTransfer,
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
        currentTransfer: {
          ...prevState.currentTransfer,
          approverComments: approverComments
        }
      };
    });
  }

  getTransfer(user, id) {
    console.log("+++ id:", id);

    if (id !== undefined && id != 0) {
      TransferDataService.getAllDraftsByTransferId(id)
        .then(response => {
          const campaignId1 = response.data[0].campaignId;
          console.log("Response data from getAllDraftsByTransferId(id):", response.data);
          response.data[0].actionby= user.username;
          this.setState({
            currentTransfer: response.data[0],
          });
          this.updateToken(campaignId1 !=="" && typeof(campaignId1) === "string"? parseInt(response.data[0].campaignId): campaignId1);

          this.setState({ 
            isNewTransfer : (response.data[0].smartcontractaddress === "" || response.data[0].smartcontractaddress === null) 
          });
        })
        .catch(e => {
          console.log("Error from getAllDraftsByTransferId(id):",e);
        });
    }
  }

  /*
  getAllSponsors() {
//    RecipientDataService.getAll()
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
*/

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
  if (!(typeof this.state.currentTransfer.campaign.name ==='string' || this.state.currentTransfer.campaign.name instanceof String)) {
    err += "- Name cannot be empty\n";
  } else if ((this.state.currentTransfer.campaign.name.trim() === "")) {
    err += "- Name cannot be empty\n"; 
  } 
  
    else if (this.state.isNewTransfer) { // only check if new transfer, dont need to check if it is existing transfer because surely will have name alrdy
    await TransferDataService.findByNameExact(this.state.currentTransfer.campaign.name.trim())
    .then(response => {
      console.log("Find duplicate name:",response.data);

      if (response.data.length > 0) {
        err += "- Name of transfer is already present (duplicate name)\n";
        console.log("Found transfer name (duplicate!):"+this.state.currentTransfer.campaign.name);
      } else {
        console.log("Didnt find transfer name1 (ok no duplicate):"+this.state.currentTransfer.name);
      }
    })
    .catch(e => {
      console.log("Didnt find transfer name2 (ok no duplicate):"+this.state.currentTransfer.name);
      // ok to proceed
    });
  }
      */
    // dont need t check description, it can be empty
//    if (! validator.isDate(this.state.currentTransfer.startdate)) err += "- Start Date is invalid\n";
//    if (! validator.isDate(this.state.currentTransfer.enddate)) err += "- End Date is invalid\n";
//  if (this.state.currentTransfer.sponsor === "") err += "- Sponsor cannot be empty\n";
  if (this.state.currentTransfer.transferAmount === "") {
    err += "- Amount cannot be empty\n";
  } else if (parseInt(this.state.currentTransfer.transferAmount) <=  0) {
    err += "- Amount must be more than zero\n";
  } else if (parseInt(this.state.currentTransfer.transferAmount) > parseInt(this.state.inwallet)) {
    err += "- Amount must be less than or equal to the amount in wallet\n";
  } else if (parseInt(this.state.currentTransfer.transferAmount) > parseInt(this.state.totalsupply)) {
    err += "- Amount must be less than or equal to the total supply\n";
  }

//    if (this.state.currentTransfer.startdate.trim() !== "" && this.state.currentTransfer.enddate.trim() !== "" && this.state.currentTransfer.startdate > this.state.currentTransfer.enddate) err += "- Start date cannot be later than End date\n";    

//    console.log("start date:'"+this.state.currentTransfer.startdate+"'");
//    console.log("end date:'"+this.state.currentTransfer.enddate+"'");
//    console.log("Start > End? "+ (this.state.currentTransfer.startdate > this.state.currentTransfer.enddate));

  if (this.state.currentTransfer.checker === "" || this.state.currentTransfer.checker === null) err += "- Checker cannot be empty\n";
  if (this.state.currentTransfer.approver === "" || this.state.currentTransfer.approver === null) err += "- Approver cannot be empty\n";
  if (this.state.currentTransfer.checker === this.state.currentUser.id.toString() 
      && this.state.currentTransfer.approver === this.state.currentUser.id.toString()) {
    err += "- Maker, Checker and Approver cannot be the same person\n";
  } else {
    if (this.state.currentTransfer.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
    if (this.state.currentTransfer.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
    if (this.state.currentTransfer.checker!==null && this.state.currentTransfer.checker!=="" 
          && this.state.currentTransfer.checker === this.state.currentTransfer.approver) err += "- Checker and Approver cannot be the same person\n";
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

async saveTransfer() {   // create new draft
  var data = {
//      name: this.state.name,
//      description: this.state.description,
    campaignId            : this.state.currentTransfer.campaign.id,
    tokenname             : this.state.currentTransfer.campaign.tokenname,
    smartcontractaddress  : this.state.currentTransfer.campaign.smartcontractaddress,
    blockchain            : this.state.currentTransfer.blockchain,
    recipient             : this.state.currentTransfer.recipient,
    recipientwallet       : this.state.currentTransfer.recipientwallet,
    transferAmount        : this.state.currentTransfer.transferAmount,
    txntype               : 0,    // create
    actionby              : this.state.currentUser.username,
    maker                 : this.state.currentUser.id,
    checker               : this.state.currentTransfer.checker,
    approver              : this.state.currentTransfer.approver,
  };

  if (await this.validateForm() === true) { 
    console.log("Form Validation passed! creating transfer...");
    //alert("Form validation passed! creating transfer...");

    console.log("IsLoad=true");
    this.setState({isLoading: true}); // show progress

    await TransferDataService.draftCreate(data)
    .then(response => {
      console.log("Response from Transfer create: ", response);

      console.log("IsLoad=false");
      this.setState({isLoading: false}); // hide progress

      this.setState({
        id: response.data.id,
/*
//      name: response.data.name,
        tokenname: response.data.tokenname,
        smartcontractaddress: response.data.smartcontractaddress,
        blockchain: response.data.blockchain,

//      description: response.data.description,
        recipient: response.data.recipient,
        recipientwallet: response.data.recipientwallet,
        campaignid: response.data.campaign,
        transferAmount: response.data.transferAmount,
*/
        submitted: true,
      });
      this.displayModal("Transfer request submitted for review", "OK", null, null, null);
    })
    .catch(e => {
      console.log("IsLoad=false");
      this.setState({isLoading: false}); // hide progress

      console.log("Error: ",e);
      console.log("Response error:",e.response.data.message);
      if (e.response.data.message !== "") 
        this.displayModal("Error: "+e.response.data.message+". Please contact tech support.", null, null, null, "OK");
      else
        this.displayModal("Error: "+e.message+". Please contact tech support.", null, null, null, "OK");

    });
  } else {
    console.log("Form Validation failed >>>");
  }
  console.log("IsLoad=false");
  this.setState({isLoading: false}); // hide progress

} // saveTransfer


async submitTransfer() {  // amend draft
  
  if (await this.validateForm()) { 
        console.log("Form Validation passed");
  
        console.log("IsLoad=true");
        this.show_loading();
  
        await TransferDataService.submitDraftById(
          this.state.currentTransfer.id,
          this.state.currentTransfer,
        )
        .then(response => {
          this.hide_loading();
  
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();
    
          this.setState({  
            datachanged: false,
          });
          this.displayModal("Transfer submitted. Routing to checker.", "OK", null, null, null);
        })
        .catch(e => {
          this.hide_loading();
  
          console.log(e);
          console.log(e.message);
          this.displayModal("Transfer submit failed.", null, null, null, "OK");
  
          try {
            console.log(e.response.data.message);
            // Need to check draft and approved transfer names
            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
              this.displayModal("The transfer submit failed. The new transfer name is already used, please use another name.", null, null, null, "OK");
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
  }  // submitTransfer amend draft
    
async acceptTransfer() {
  
//    if (await this.validateForm()) { 
//      console.log("Form Validation passed");

      console.log("IsLoad=true");
      this.show_loading();

      await TransferDataService.acceptDraftById(
        this.state.currentTransfer.id,
        this.state.currentTransfer,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();
  
        this.setState({  
          datachanged: false,
        });
        this.displayModal("Transfer request checked, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Transfer accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The transfer accept failed. The new transfer name is already used, please use another name.", null, null, null, "OK");
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

  async approveTransfer() {
  
    //    if (await this.validateForm()) { 
    //      console.log("Form Validation passed");
    
    console.log("IsLoad=true");
    this.show_loading();

    await TransferDataService.approveDraftById(
      this.state.currentTransfer.id,
      this.state.currentTransfer,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("The transfer is approved and executed successfully.", "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log("-->response:",e);
      console.log(e.message);
      //this.displayModal("Transfer approval failed. "+e.message+".", null, null, "OK");
      this.displayModal(e.message+".\n"+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      try {
        console.log(e.response.data.message);
        if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
          this.displayModal("The transfer update failed. The new transfer name is already used, please use another name.", null, null, null, "OK");
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
    this.hide_loading();
  }

  async rejectTransfer() {

    console.log("isChecker? ", this.state.isChecker);
    console.log("this.state.currentTransfer.checkerComments: ", this.state.currentTransfer.checkerComments);
    console.log("isApprover? ", this.state.isApprover);
    console.log("this.state.currentTransfer.approverComments: ", this.state.currentTransfer.approverComments);

    if ( this.state.isChecker && (typeof this.state.currentTransfer.checkerComments==="undefined" || this.state.currentTransfer.checkerComments==="" || this.state.currentTransfer.checkerComments===null)) { 
      this.displayModal("Please enter the reason for rejection in the Checker Comments.", null, null, null, "OK");
    } else 
    if (this.state.isApprover && (typeof this.state.currentTransfer.approverComments==="undefined" || this.state.currentTransfer.approverComments==="" || this.state.currentTransfer.approverComments===null)) {
      this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
    } else {
      //console.log("Form Validation passed");
    
      console.log("IsLoad=true");
      this.show_loading();

      await TransferDataService.rejectDraftById(
        this.state.currentTransfer.id,
        this.state.currentTransfer,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();

        this.setState({  
          datachanged: false,
        });
        this.displayModal("This transfer request is rejected. Routing back to maker.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Transfer rejection failed.", null, null, null, "OK");
      });
    }
    this.hide_loading();
  }

  async deleteTransfer() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await TransferDataService.approveDeleteDraftById(
      this.state.currentTransfer.id,
      this.state.currentTransfer,
    )
      .then(response => {
        console.log("IsLoad=false");
        this.hide_loading();     // hide progress
  
        this.displayModal("Transfer is deleted.", "OK", null, null, null);
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

    await TransferDataService.dropRequestById(
      this.state.currentTransfer.id,
      this.state.currentTransfer,
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

  showModal_dropRequest = () => {
    this.displayModal("Are you sure you want to Drop this Request?", null, null, "Yes, drop", "Cancel");
  };

  showModal_Leave = () => {
    this.displayModal("You have made changes. Are you sure you want to leave this page without submitting?", "Yes, leave", null, null, "Cancel");
  };

  /*
  showModalDelete = () => {
    this.displayModal("Are you sure you want to delete this transfer?", null, "Yes, delete", null, "Cancel");
  };
*/
  hideModal = () => {
    this.setState({ showm: false });
  };


  render() {
    const { recipient, bondList, PBMList, recipientList, campaignList, currentTransfer, checkerList, approverList } = this.state;
    console.log("Render recipient:", recipient);
    console.log("Render recipientList:", recipientList);
    console.log("Render currentTransfer:", currentTransfer);
    console.log("Render bondList:", bondList);

    try {
      return (
        <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>{this.state.currentTransfer.txntype===0?"Create ":(this.state.currentTransfer.txntype===1?"Update ":(this.state.currentTransfer.txntype===2?"Delete ":null))}Transfer Request { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
            </h3>
          </header>

        </div>: null}

                <div className="edit-form list-row">
                  <h4></h4>
                  <div className="col-md-8">

                  <form autoComplete="off">
                    <div className="form-group">
                      <label htmlFor="name">Token *</label>
                      <select
                        onChange={this.onChangeCampaign}                         
                        className="form-control"
                        id="campaignid"
                        name="campaignid"
                        disabled={!this.state.isMaker || currentTransfer.txntype===2 || currentTransfer.status >0}
                      >
                        <option value=""> </option>
                        <option value="" disabled>--- Cash Token ---</option>

                        {
                          Array.isArray(campaignList) ?
                            campaignList.map( (d) => {
                              // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              return <option value={d.id} selected={d.id === currentTransfer.campaignId}>{d.name} - {d.smartcontractaddress}</option>
                            })
                          : 
                          <option value="" disabled> Nil </option>
                        }
                        <option value="" disabled>--- Bond ---</option>
                        {Array.isArray(bondList) ?
                          bondList.map( (d) => {
                            // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              if (typeof d.id === "number")
                                return <option value={d.id} selected={d.id === currentTransfer.campaignId}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                            })
                          :                         
                          <option value="" disabled> Nil </option>
                        }

                        <option value="" disabled>--- PBM ---</option>
                        {Array.isArray(PBMList) ?
                          PBMList.map( (d) => {
                            // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              if (typeof d.id === "number")
                                return <option value={d.id} selected={d.id === this.state.underlyingTokenID1}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                            })
                          : 
                          <option value="" disabled> Nil </option>
                        }

                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="name">Token Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="tokenname"
                        maxLength="5"
                        required
                        value={currentTransfer.campaign ? currentTransfer.campaign.tokenname: ""}
                        name="tokenname"
                        style={{textTransform : "uppercase"}}
                        disabled="true"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="blockchain">Blockchain</label>
                      <select
                            onChange={this.onChangeBlockchain}                         
                            className="form-control"
                            id="blockchain"
                            disabled="true"
                      >
                        <option >   </option>
                        <option value="80002"  selected={currentTransfer.blockchain ? currentTransfer.blockchain === 80002 : this.state.blockchain === 80002}>Polygon   Testnet Amoy</option>
                        <option value="11155111" selected={currentTransfer.blockchain ? currentTransfer.blockchain === 11155111 : this.state.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                        <option value="80001"  selected={currentTransfer.blockchain ? currentTransfer.blockchain === 80001 : this.state.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                        <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                        <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                        <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                        <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="recipient">Recipient *</label>
                      <select
                          onChange={this.onChangeRecipient}                         
                          className="form-control"
                          id="recipient"
                          disabled={!this.state.isMaker || currentTransfer.txntype===2 || currentTransfer.status >0}
                        >
                          <option> </option>
                          {
                            Array.isArray(recipientList) ?
                            recipientList.map( (d) => {
                                return <option value={d.id} selected={currentTransfer.recipientId ? currentTransfer.recipientId === d.id : null}>{d.name}</option>
                              })
                            : null
                          }
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="recipientwallet">Recipient Wallet</label>
                      <input
                        type="text"
                        className="form-control"
                        id="recipientwallet"
                        required
                        value={currentTransfer.recipientwallet}
                        name="recipientwallet"
                        autoComplete="off"
                        disabled="true"
                      />
                    </div>

                    <div className="form-group">
                    <label htmlFor="transferAmount">Transfer Amount * { ( (this.state.inwallet !== undefined && this.state.inwallet != null && this.state.inwallet !=="" ) ? `(${ (parseFloat(this.state.inwallet)).toLocaleString() } currently in Campaign Wallet)` : null)}
                    {(this.state.inwallet !== undefined && this.state.inwallet != null && this.state.inwallet !=="" && this.state.inwallet <= 0) ?
                          <><br /><font color="red">There is zero balance of this token in the wallet, please choose another token for transferring</font></>
                          :
                          ""
                        }
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="transferAmount"
                        min="1"
                        max={ (this.state.inwallet !== undefined && this.state.inwallet != null && this.state.inwallet !=="") ? (parseFloat(this.state.inwallet)).toLocaleString():"0"}
                        step="1"
                        required
                        value={currentTransfer.transferAmount}
                        onChange={this.onChangeAmount}
                        disabled={!this.state.isMaker || currentTransfer.txntype===2 || currentTransfer.status >0 || (this.state.inwallet !== undefined && this.state.inwallet != null && this.state.inwallet !=="" && this.state.inwallet <= 0)}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="checker">Checker *</label>
                      <select
                            value={currentTransfer.checker}
                            onChange={this.onChangeChecker}                         
                            className="form-control"
                            id="checker"
                            disabled={!this.state.isMaker || currentTransfer.txntype===2 || currentTransfer.status >0}
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
                    (currentTransfer.id !== 0 ?  // add new transfer
                    <div className="form-group">
                      <label htmlFor="checkerComments">Checker Comments</label>
                      <input
                        type="text"
                        maxLength="255"
                        className="form-control"
                        id="checkerComments"
                        required
                        value={currentTransfer.checkerComments}
                        onChange={this.onChangeCheckerComments}
                        name="checkerComments"
                        autoComplete="off"
                        disabled={!this.state.isChecker || currentTransfer.id === 0 || currentTransfer.status !=1}
                        />
                    </div>
                    :
                    null
                    )
                    }
                    <div className="form-group">
                      <label htmlFor="approver">Approver *</label>
                      <select
                          value={currentTransfer.approver}
                          onChange={this.onChangeApprover}                         
                          className="form-control"
                          id="approver"
                          disabled={!this.state.isMaker || this.state.currentTransfer.txntype===2 || currentTransfer.status >0}
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
                      (currentTransfer.id !== 0 ? // add new transfer
                      <div className="form-group">
                        <label htmlFor="approverComments">Approver Comments</label>
                        <input
                          type="text"
                          maxLength="255"
                          className="form-control"
                          id="approverComments"
                          required
                          value={currentTransfer.approverComments}
                          onChange={this.onChangeApproverComments}
                          name="approverComments"
                          autoComplete="off"
                          disabled={!this.state.isApprover || currentTransfer.id === 0 || currentTransfer.status != 2}
                          />
                      </div>
                      : null
                      )
                    }
                  </form>
                  {
                  this.state.isMaker && currentTransfer.status <= 0 ? ( currentTransfer.id === 0?
                  <button onClick={this.saveTransfer} className="btn btn-primary">
                    Submit Request
                  </button>
                  :
                  <>
                  <button
                  type="submit"
                  className="m-3 btn btn-sm btn-primary"
                  onClick={this.submitTransfer}
                  >
                    Submit 
                    {
                      (currentTransfer.txntype===0? " Create ":
                      (currentTransfer.txntype===1? " Update ":
                      (currentTransfer.txntype===2? " Delete ":null)))
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
              : (this.state.isChecker && currentTransfer.status == 1 ? 
              <button
              type="submit"
              className="m-3 btn btn-sm btn-primary"
              onClick={this.acceptTransfer}
              >
                Endorse
                {
                  (currentTransfer.txntype===0? " Create ":
                  (currentTransfer.txntype===1? " Update ":
                  (currentTransfer.txntype===2? " Delete ":null)))
                }
                Request

              </button> 
              :
              (
                this.state.isApprover && currentTransfer.status == 2?
                <button
                type="submit"
                className="m-3 btn btn-sm btn-primary"
                onClick={currentTransfer.txntype===2? this.deleteDraft: this.approveTransfer}
                >
                  Approve
                  {
                    (currentTransfer.txntype===0? " Create ":
                    (currentTransfer.txntype===1? " Update ":
                    (currentTransfer.txntype===2? " Delete ":null)))
                  }
                  Request

                </button> 
                : null
              ))
              }
&nbsp;
              {
                currentTransfer.id !== 0 && (this.state.isChecker || this.state.isApprover)  && currentTransfer.status > 0 ?

              <button
              type="submit"
              className="m-3 btn btn-sm btn-danger"
              onClick={this.rejectTransfer}
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
                  <Link to="/transfer">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Cancel
                  </button>
                  </Link>
                )
              : 
                <Link to="/transfer">
                <button className="m-3 btn btn-sm btn-secondary">
                  Cancel
                </button>
                </Link>
              }  

              {this.state.isLoading ? <LoadingSpinner /> : null}

              <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/transfer'} handleProceed2={this.deleteTransfer} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
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

export default withRouter(Transfer);