import React, { Component } from "react";
import { Link } from "react-router-dom";
import TransferDataService from "../services/transfer.service.js";
import CampaignDataService from "../services/campaign.service.js";
import RecipientDataService from "../services/recipient.service.js";
import UserOpsRoleDataService from "../services/user_opsrole.service.js";
import AuthService from "../services/auth.service.js";
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";

export default class Transfer extends Component {
  constructor(props) {
    super(props);
    /*
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    */
    this.onChangeCampaign = this.onChangeCampaign.bind(this);
    this.onChangeRecipient = this.onChangeRecipient.bind(this);
    this.onChangeTransferAmount = this.onChangeTransferAmount.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);

    this.saveTransfer = this.saveTransfer.bind(this);
    this.newTransfer = this.newTransfer.bind(this);

    this.state = {
      campaignList: {
        id: null,
        name: "",
      },

      recipientList: {
        id: null,
        name: "",
        walletaddress: "",
      },

      checkerList: {
        id: null,
        username: "",
      },
      approverList: {
        id: null,
        username: "",
      },

      inwallet      : 0,
      minted_tokens : 0,
      totalSupply   : 0,

      id: null,
      campaignid: "",
      smartcontractaddress: "",
      blockchain: "",
      recipient: "",
      recipientwallet: "",
      transferAmount: "",

      currentUser: undefined,
      isMaker: false,
      isChecker: false,
      isApprover: false,

      actionby: undefined,
      maker: "",
      checker: "",
      approver: "",

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

  /*
// Cant change name
  onChangeName(e) {
    this.setState({
      name: e.target.value,
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
*/
  onChangeCampaign(e) {

    const selectedCampaign = this.state.campaignList.find((element) => { 
      var el_id = element.id;
      var campaign_id = e.target.value;
      console.log("typeof(el_id)", typeof(el_id));                console.log("element.id:", element.id);   
      console.log("typeof(campaign_id)", typeof(campaign_id));    console.log("campaign_id:", campaign_id)
      try {
        if (el_id.toString() === campaign_id) 
          return element;
      } catch(e) {
        // do nothing, sometime when campaignList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
      }
      return null;
    });
    console.log("selectedCampaign: ", selectedCampaign);

    CampaignDataService.getInWalletMintedTotalSupply(selectedCampaign.id)
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
      campaignid: e.target.value,
      tokenname: (selectedCampaign ? selectedCampaign.tokenname : ""),
      smartcontractaddress: (selectedCampaign ? selectedCampaign.smartcontractaddress : ""),
      blockchain: (selectedCampaign ? selectedCampaign.blockchain : ""),
      //recipient: (selectedCampaign ? selectedCampaign.recipient : ""), 
      totalsupply: (selectedCampaign ? selectedCampaign.amount : ""), 
      datachanged: true
    });
    console.log("Campaignid value:", e.target.value)
  }

  onChangeRecipient(e) {
    const selectedRecipient = this.state.recipientList.find((element) => { 
        var el_id = element.id;             console.log("typeof(el_id)", typeof(el_id));
        var recipient_id = e.target.value;   console.log("typeof(recipient_id)", typeof(recipient_id));
        console.log("element.id:", element.id);   console.log("campaign_id:", recipient_id)
        try {
          if (el_id.toString() === recipient_id) 
            return element;
        } catch(e) {
          // do nothing, sometime when campaignList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
        }
        return null;
      });
      console.log("selectedRecipient: ", selectedRecipient);
  
  
    this.setState({
      recipient: e.target.value,
      recipientwallet: (selectedRecipient ? selectedRecipient.walletaddress : ""),
      datachanged: true
    });
  }

  onChangeTransferAmount(e) {
    this.setState({
      transferAmount: e.target.value,
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

  async validateForm() {    
    var err = "";

//    if (! validator.isDate(this.state.startdate)) err += "- Start Date is invalid\n";
//    if (! validator.isDate(this.state.enddate)) err += "- End Date is invalid\n";
    if (this.state.campaignid === "") err += "- Campaign cannot be empty\n";
    if (this.state.recipient === "") err += "- Recipient cannot be empty\n";
    if (this.state.transferAmount === "") {
      err += "- Amount cannot be empty\n";
    } else if (this.state.transferAmount <= 0) err += "- Amount must be more than zero\n";
//    if (this.state.startdate.trim() !== "" && this.state.enddate.trim() !== "" && this.state.startdate > this.state.enddate) err += "- Start date cannot be later than End date\n";    

//    console.log("start date:'"+this.state.startdate+"'");
//    console.log("end date:'"+this.state.enddate+"'");
//    console.log("Start > End? "+ (this.state.startdate > this.state.enddate));

    if (this.state.checker===null || this.state.checker === "") err += "- Checker cannot be empty\n";
    if (this.state.approver===null || this.state.approver === "") err += "- Approver cannot be empty\n";

    if(this.state.checker === this.state.currentUser.id.toString() && this.state.approver === this.state.currentUser.id.toString()) {
      err += "- Maker, Checker and Approver cannot be the same person\n";
    } else {
      if (this.state.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
      if (this.state.checker!==null && this.state.checker!=="" 
          && this.state.checker === this.state.approver) err += "- Checker and Approver cannot be the same person\n";
    }

    if (!(typeof this.state.campaignid ==='string' || this.state.campaignid instanceof String)) {
      err = "Please choose a Campaign\n";
    } else if ((this.state.campaignid.trim() === "")) {
      err = "Please choose a Campaign\n"; 
    }


    if (err !== '') {
      err = "Form validation issues found:\n"+err;
      this.displayModal(err, null, null, null, "OK");

      err = ""; // clear var

      return false;
    }
    return true;
  }

  async saveTransfer() {
    var data = {
//      name: this.state.name,
//      description: this.state.description,
      campaignId            : this.state.campaignid,
      tokenname             : this.state.tokenname,
      smartcontractaddress  : this.state.smartcontractaddress,
      blockchain            : this.state.blockchain,
      recipient             : this.state.recipient,
      recipientwallet       : this.state.recipientwallet,
      transferAmount        : this.state.transferAmount,
      txntype               : 0,    // create
      actionby              : this.state.currentUser.username,
      maker                 : this.state.currentUser.id,
      checker               : this.state.checker,
      approver              : this.state.approver,

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
//          name: response.data.name,
          tokenname: response.data.tokenname,
          smartcontractaddress: response.data.smartcontractaddress,
          blockchain: response.data.blockchain,

//          description: response.data.description,
          recipient: response.data.recipient,
          recipientwallet: response.data.recipientwallet,
          campaignid: response.data.campaign,
          transferAmount: response.data.transferAmount,
*/
          submitted: true,
        });
        this.displayModal("Transfer request submitted for review", "OK", null, null, null);

        //console.log("Responseeeee"+response.data);
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
      //alert("Form Validation failed >>>");
    }
    console.log("IsLoad=false");
    this.setState({isLoading: false}); // hide progress

  }

  newTransfer() {
    this.setState({
      id: null,
      campaignid: "",
      tokenname: "",
      smartcontractaddress: "",
      blockchain: "",
      description: "",
      startdate: "",
      enddate: "",
      transferAmount: "",

      currentUser: undefined,
      actionby: undefined,
      datachanged: false,
      submitted: false
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

  getAllCampaigns() {
    CampaignDataService.getAll()
      .then(response => {
        console.log("campaignList from server:", response.data);
        console.log("Response.data length:", response.data.length);
        if (response.data.length === 0) {
          this.setState({
            campaignList: [ { id:-1, name:"No campaign available, please create a campaign first."}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            campaignList: [first_array_record].concat(response.data)
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }

  getAllTransfers() {
    TransferDataService.findAllByCampaign()
      .then(response => {
        var first_array_record = [  // add 1 empty record to front of array which is the option list
          { }
        ];
        this.setState({
            campaignList: [first_array_record].concat(response.data)
        });
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

    this.getAllCampaigns();
    this.getAllRecipients();

    this.retrieveAllMakersCheckersApprovers();

  }

  showModal_Leave = () => {
    this.displayModal("You have made changes. Are you sure you want to leave this page without submitting?", 
                  "Yes, leave", null, null, "Cancel");
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
    const { campaignList, recipientList, checkerList, approverList } = this.state;
    console.log("Render campaignList:", campaignList);
    console.log("Render recipientList:", recipientList);

    return (
      <div className="container">
      {(this.state.userReady) ?
        <div>
        <header className="jumbotron col-md-8">
          <h3>
            <strong>Transfer tokens from Campaign wallet ({ (this.state.isMaker? "Maker" : (this.state.isChecker? "Checker": (this.state.isApprover? "Approver":null)) )})</strong>
          </h3>
        </header>

        </div>: null}

          <div className="submit-form">

            <div className="col-md-8">
              <div className="form-group">
                  <label htmlFor="campaign">Campaign *</label>
                  <select
                        onChange={this.onChangeCampaign}                         
                        className="form-control"
                        id="campaignid"
                        name="campaignid"
                      >
                        {
                          Array.isArray(campaignList) ?
                            campaignList.map( (d) => {
                              return <option value={d.id}>{d.name}</option>
                            })
                          : null
                        }
                      </select>
                </div>

                <div className="form-group">
                  <label htmlFor="name">Name of Token</label>
                  <input
                    type="text"
                    className="form-control"
                    id="tokenname"
                    required
                    value={this.state.tokenname}
                    onChange={this.onChangeTokenName}
                    name="tokenname"
                    autoComplete="off"
                    disabled="true"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="blockchain">Blockchain</label>
                  <input
                    type="text"
                    className="form-control"
                    id="blockchain"
                    required
                    value={
                      (() => {
                        switch (this.state.blockchain) {
                          case 80001:
                            return 'Polygon Testnet Mumbai (Deprecated)'
                          case 80002:
                            return 'Polygon Testnet Amoy'
                          case 11155111:
                            return 'Ethereum Testnet Sepolia'
                          case 43113:
                            return 'Avalanche Testnet Fuji'
                          case 137:
                            return 'Polygon Mainnet'
                          case 1:
                            return 'Ethereum  Mainnet'
                          case 43114:
                            return 'Avalanche Mainnet'
                          default:
                            return null
                        }
                      }
                      )()
                    }
                    onChange={this.onChangeBlockchain}
                    autoComplete="off"
                    disabled={true}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Campaign Smart Contract</label>
                  <input
                    type="text"
                    className="form-control"
                    id="tokenname"
                    required
                    value={this.state.smartcontractaddress}
                    name="tokenname"
                    autoComplete="off"
                    disabled="true"
                  />
                </div>
                <div className="form-group">
                    <label htmlFor="recipient">Recipient *</label>
                    <select
                        onChange={this.onChangeRecipient}                         
                        className="form-control"
                        id="recipient"
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

                <div className="form-group">
                  <label htmlFor="recipientwallet">Recipient Wallet</label>
                  <input
                    type="text"
                    className="form-control"
                    id="recipientwallet"
                    required
                    value={this.state.recipientwallet}
                    name="recipientwallet"
                    autoComplete="off"
                    disabled="true"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="transferAmount">Transfer Amount { ( (this.state.inwallet !== undefined && this.state.inwallet != null && this.state.inwallet !=="" ) ? `(${ (parseFloat(this.state.inwallet)).toLocaleString() } currently in Campaign Wallet) *` : null)}</label>
                  <input
                    type="number"
                    className="form-control"
                    id="transferAmount"
                    min="0"
                    max={this.state.inwallet}
                    step="1"
                    required
                    onChange={this.onChangeTransferAmount}
                    name="transferAmount"
                    autoComplete="off"
                    disabled = {(this.state.campaignid)? "" : "disabled"}
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
                {
                  (this.state.isMaker)?
                    <button onClick={this.saveTransfer} className="btn btn-primary">
                      Submit Transfer Request
                    </button>
                    :null
                }

                { 
                  (this.state.isMaker)? (
                    (this.state.datachanged) ? 
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
                    Back
                  </button>
                  </Link>
                }
                  {this.state.isLoading ? <LoadingSpinner /> : null}

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/transfer'} handleProceed2={null} handleProceed3={null} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                    {this.state.modalmsg}
                  </Modal>

                  <p>{this.state.message}</p>

              </div>
          </div>
      </div>
    );
  }
}
