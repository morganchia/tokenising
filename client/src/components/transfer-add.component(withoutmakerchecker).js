import React, { Component } from "react";
import { Link } from "react-router-dom";
import TransferDataService from "../services/transfer.service";
import CampaignDataService from "../services/campaign.service";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
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
    this.onChangeCheckerApprover = this.onChangeCheckerApprover.bind(this);
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

      checkerapproverlist: {
        id: null,
        name: "",
      },

      inwallet      : 0,
      minted_tokens : 0,
      totalSupply   : 0,

      id: null,
      campaignId: "",
      smartcontractaddress: "",
      recipient: "",
      recipientwallet: "",
      transferAmount: "",

      currentUser: undefined,
      actionby: undefined,
      maker: undefined,
      checked: undefined,
      approver: undefined,
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
      var el_id = element.id;             console.log("typeof(el_id)", typeof(el_id));
      var campaign_id = e.target.value;   console.log("typeof(campaign_id)", typeof(campaign_id));
      console.log("element.id:", element.id);   console.log("campaign_id:", campaign_id)
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
      campaignId: e.target.value,
      tokenname: (selectedCampaign ? selectedCampaign.tokenname : ""),
      smartcontractaddress: (selectedCampaign ? selectedCampaign.smartcontractaddress : ""),
      //recipient: (selectedCampaign ? selectedCampaign.recipient : ""), 
      totalsupply: (selectedCampaign ? selectedCampaign.amount : ""), 
      datachanged: true
    });
    console.log("CampaignId value:", e.target.value)
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

  onChangeCheckerApprover(e) {
    this.setState({
      checkerapprover: e.target.value,
      datachanged: true
    });
  }

  async validateForm() {    
    var err = "";

//    if (! validator.isDate(this.state.startdate)) err += "- Start Date is invalid\n";
//    if (! validator.isDate(this.state.enddate)) err += "- End Date is invalid\n";
    if (this.state.campaignId === "") err += "- Campaign cannot be empty\n";
    if (this.state.recipient === "") err += "- Recipient cannot be empty\n";
    if (this.state.transferAmount === "") {
      err += "- Amount cannot be empty\n";
    } else if (this.state.transferAmount <= 0) err += "- Amount must be more than zero\n";
//    if (this.state.startdate.trim() !== "" && this.state.enddate.trim() !== "" && this.state.startdate > this.state.enddate) err += "- Start date cannot be later than End date\n";    

//    console.log("start date:'"+this.state.startdate+"'");
//    console.log("end date:'"+this.state.enddate+"'");
//    console.log("Start > End? "+ (this.state.startdate > this.state.enddate));

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
      campaignId: this.state.campaignId,
      tokenname: this.state.tokenname,
      smartcontractaddress: this.state.smartcontractaddress,
      recipient: this.state.recipient,
      recipientwallet: this.state.recipientwallet,
      transferAmount: this.state.transferAmount,
      actionby: this.state.currentUser.username,
    };

    if (await this.validateForm() === true) { 
      console.log("Form Validation passed! creating transfer...");
      //alert("Form validation passed! creating transfer...");

      console.log("IsLoad=true");
      this.setState({isLoading: true}); // show progress

      await TransferDataService.create(data)
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
//          description: response.data.description,
          recipient: response.data.recipient,
          recipientwallet: response.data.recipientwallet,
          campaignId: response.data.campaign,
          transferAmount: response.data.transferAmount,
*/
          submitted: true,
        });
        this.displayModal("Transfer success", "OK", null, null, null);

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
      campaignId: "",
      tokenname: "",
      smartcontractaddress: "",
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
//    RecipientDataService.getAll()
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
    UserOpsRoleDataService.getAllMakersCheckersApprovers("campaign")
      .then(response => {
        console.log("Data received by getAllCheckerApprovers:", response.data);
        var first_array_record = [  // add 1 empty record to front of array which is the option list
          { }
        ];
        this.setState({
          checkerapproverlist: [first_array_record].concat(response.data)
        });
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
    const { campaignList, recipientList, checkerapproverlist } = this.state;
    console.log("Render campaignList:", campaignList);
    console.log("Render recipientList:", recipientList);

    return (
      <div className="container">
      {(this.state.userReady) ?
        <div>
        <header className="jumbotron col-md-8">
          <h3>
            <strong>Transfer tokens from Campaign wallet</strong>
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
                        id="campaignId"
                        name="campaignId"
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
                    disabled = {(this.state.campaignId)? "" : "disabled"}
                  />
                </div>
{
/*
                <div className="form-group">
                  <label htmlFor="checkerapprover">Checker / Approver</label>
                  <select
                        onChange={this.onChangeCheckerApprover}                         
                        className="form-control"
                        id="checkerapprover"
                      >
                        {
                          Array.isArray(checkerapproverlist) ?
                            checkerapproverlist.map( (d) => {
                              return <option value={d.id}>{d.name}</option>
                            })
                          : null
                        }
                      </select>
                </div>
*/  
}
                <button onClick={this.saveTransfer} className="btn btn-primary">
                  Submit
                </button>

                { (this.state.datachanged) ? 
                  <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>
                    Cancel
                  </button>
                  : 
                  <Link to="/dashboard">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Cancel
                  </button>
                  </Link>
                }

                  {this.state.isLoading ? <LoadingSpinner /> : null}

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/dashboard'} handleProceed2={null} handleProceed3={null} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                    {this.state.modalmsg}
                  </Modal>

                  <p>{this.state.message}</p>

              </div>
          </div>
      </div>
    );
  }
}
