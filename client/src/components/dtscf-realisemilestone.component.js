import React, { Component } from "react";
import CampaignDataService from "../services/campaign.service.js";
import DtscfDataService from "../services/dtscf.service.js";
import RecipientDataService from "../services/recipient.service.js";
import UserOpsRoleDataService from "../services/user_opsrole.service.js";
import { withRouter } from '../common/with-router.js';
import AuthService from "../services/auth.service.js";
import { Link, Navigate } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";
import moment from 'moment';
//import { recipients } from "../../../server/app/models/index.js";
// Requires js-sha3 library: npm install js-sha3
import { keccak256 } from 'js-sha3';

(function disableMetaMask() {
  if (typeof document !== 'undefined') {
    const meta = document.createElement('meta');
    meta.name = "ethereum-protocol";
    meta.content = "disabled";
    document.head.appendChild(meta);
  }
})();

function isChecksumAddress(address) {
  address = address.replace('0x', '');
  const addressHash = keccak256(address.toLowerCase());
  
  for (let i = 0; i < 40; i++) {
    // Check if the nth letter should be uppercase
    if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) ||
        (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
      return false;
    }
  }
  return true;
}

function isValidAddress(address) {
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) return false;
  if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) return true;
  return isChecksumAddress(address);
}

function getToday() {
  const today = new Date();
  return moment(today).format('YYYY-MM-DD')
}

class DTSCFProjectCreation extends Component {
  constructor(props) {
    super(props);
/*
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeTotalBudget = this.onChangeTotalBudget.bind(this);
    this.onChangeUnderlying = this.onChangeUnderlying.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.addMilestone = this.addMilestone.bind(this);
    this.onChangeMilestone = this.onChangeMilestone.bind(this);
    this.removeMilestone = this.removeMilestone.bind(this);
    this.addContractor = this.addContractor.bind(this);
    this.onChangeContractor = this.onChangeContractor.bind(this);
    this.removeContractor = this.removeContractor.bind(this);
    this.addPurchase = this.addPurchase.bind(this);
    this.onChangePurchase = this.onChangePurchase.bind(this);
    this.onChangePurchaseAmount = this.onChangePurchaseAmount.bind(this);
    this.onChangePurchaseMilestone = this.onChangePurchaseMilestone.bind(this);
    this.removePurchase = this.removePurchase.bind(this);
    this.handleInvoiceUpload = this.handleInvoiceUpload.bind(this);
    //this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    //this.onChangeCheckerComments = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
*/
    this.handleMilestoneChange = this.handleMilestoneChange.bind(this); 

/*
    this.createProject = this.createProject.bind(this);
    this.updateProject = this.updateProject.bind(this);
    this.submitDtscf = this.submitDtscf.bind(this);
    this.acceptDtscf = this.acceptDtscf.bind(this);
    this.rejectDtscf = this.rejectDtscf.bind(this);
    this.deleteDtscf = this.deleteDtscf.bind(this);
    this.dropRequest = this.dropRequest.bind(this);
*/
    this.approveMilestoneCompleted = this.approveMilestoneCompleted.bind(this);

    this.showModal_Leave = this.showModal_Leave.bind(this);
    this.hideModal = this.hideModal.bind(this);
    
    this.state = {
      redirect : null,
      currentUser: { id: null, username: "" },
      recipients: { id: null, name: null },
      currentProject: {
        id: 0,
        name: "ppp",
        description: "pppp",
        totalBudget: 11110,
        anchor_id: 16,
        underlyingTokenID: 0,
        underlyingDSGDsmartcontractaddress: "",
        smartcontractaddress: "",
        blockchain: 0,
        campaign: null,
        campaign_id: 0,
        startdate: getToday(),
        enddate: getToday(),
        selectedMilestone: "", // Track selected milestone name
        selectedMilestoneId: null, // Track selected milestone ID
        milestones: [{id: 0, name: "mmm", budget: 222, startdate: getToday(), enddate: getToday()}],
        contractors: [{name: "ccc", budget: 3333, walletaddress: "", purchases: [{description: "ppp", amount: 4444}],  invoices: []}], // invoices as File objects
      },
      underlyingDSGDList: [],
      checkerList: {
        id: null,
        username: "",
      },
      approverList: {
        id: null,
        username: "",
      },

      isNewProject: true,
      datachanged: false,
      message: "",
      isLoading: false,
      logs: [], // New state for streaming logs
      modal: {
        showm: false,
        modalmsg: "",
        button1text: null,
        button0text: null,
      }
    };
  }

  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("dtscf")
      .then(response => {
        console.log("Data received by getAllCheckerApprovers:", response.data);
//        let chkList = response.data.find(element => element.name.toUpperCase() === "CHECKER");
        let apprList = response.data.find(element => element.name.toUpperCase() === "APPROVER");

        this.setState({
//          checkerList: (chkList.user || []), // Fallback to empty array
          approverList: (apprList.user || []) // Fallback to empty array
        });
//        console.log("checkerList: ", chkList.user);
        console.log("approverList: ", apprList.user);      
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }

  componentDidMount() {
    // Tell MetaMask this page is not for them
    if (window.ethereum) {
      window.ethereum.autoRefreshOnNetworkChange = false; // Prevents some auto-connect errors
    }
    
    const user = AuthService.getCurrentUser();
    this.setState({ currentUser: user });
    console.log("Current user:", user); 

    console.log("user.roles[0]:", user.roles[0].toUpperCase());

    //let is_anchor= (user.roles[0].toUpperCase() === "ROLE_ANCHOR");
    console.log("isAnchor:", (user.roles[0].toUpperCase() === "ROLE_ANCHOR"));
    this.setState({ isAnchor: (user.roles[0].toUpperCase() === "ROLE_ANCHOR") });

    //let is_contractor= (user.roles[0].toUpperCase() === "ROLE_CONTRACTOR");
    console.log("isContractor:", (user.roles[0].toUpperCase() === "ROLE_CONTRACTOR"));
    this.setState({ isContractor: (user.roles[0].toUpperCase() === "ROLE_CONTRACTOR") });

    if (!user) {
      this.setState({ redirect: "/login" });
    } else {
      this.setState({ currentUser: user, actionby:user.username, userReady: true })

      let ismaker= user.opsrole.find((el) => 
        el.opsrole.name.toUpperCase() === "MAKER"
      );
      console.log("isMaker:", (ismaker === undefined? false: true));
      this.setState({ isMaker: (ismaker === undefined? false: true),});

      let isapprover= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "APPROVER"
      );
      console.log("isApprover:", (isapprover === undefined? false: true));
      this.setState({ isApprover: (isapprover === undefined? false: true),});

      this.getAllUnderlyingAssets();
      this.getProject(user, typeof this.props.router.params.id === "string" ? parseInt(this.props.router.params.id) : this.props.router.params.id);
      this.retrieveAllMakersCheckersApprovers();
    }
  }

  componentWillUnmount() {
    // Remove the tag when leaving this page so MetaMask works on other pages
    const meta = document.getElementById('disable-metamask-meta');
    if (meta) {
      meta.parentNode.removeChild(meta);
    }
  }

  async getProject(user, id) {
    console.log("+++ id:'"+id+"' +++");
    console.log("typeof id:'"+typeof id+"' +++");

    this.setState({ isLoading: true });
    if (id !== undefined && id !== 0) {
      console.log("Calling getAllByDtscfId... ");

      await DtscfDataService.getAllByDtscfId(id)
      .then(response => {
        if (response && response.data) {
          console.log("Response from getAllByDtscfId(id):", response.data);

          const data = response.data;
          this.setState({
            currentProject: {
              id: data.id,
              name: data.name,
              description: data.description,
              totalBudget: data.totalBudget,
              anchor_id: data.anchor_id,
              underlyingTokenID: parseInt(data.underlyingTokenID) || "",
              underlyingDSGDsmartcontractaddress: data.underlyingDSGDsmartcontractaddress,
              smartcontractaddress: data.smartcontractaddress,
              blockchain: data.blockchain,
              campaign_id: data.campaign_id,
              startdate: moment(data.startdate).format('YYYY-MM-DD'),
              enddate: moment(data.enddate).format('YYYY-MM-DD'),
              actionby: data.actionby,
              status: data.status,
              txntype: data.txntype,
              actiontimedate: data.actiontimedate,
              maker: data.maker,
              approver: data.approver,
              approverComments: data.approverComments,
              milestones: (data.dtscf_milestones || []).map(ms => ({
                ...ms,
                id: ms.id,
                description: ms.description || "",
                budget: ms.budget || 0,
                startdate: moment(ms.startdate).format('YYYY-MM-DD'),
                enddate: moment(ms.enddate).format('YYYY-MM-DD'),
              })),
              contractors: (data.dtscf_contractors || []).map(con => ({
                ...con,
                id: con.id,
                name: con.name || "",
                budget: con.budget || 0,
                walletaddress: con.walletaddress || "",
                purchases: (con.dtscf_purchases || []).map(pur => {
                  const matchedMilestone = (data.dtscf_milestones || []).find(m => m.id === pur.dtscf_milestone_id);
                  return {
                    ...pur,
                    id: pur.id,
                    description: pur.description || "",
                    amount: pur.amount || 0,
                    milestone: matchedMilestone ? matchedMilestone.name : (pur.milestone || ""),
                    invoices: [] // Initialize as empty array for new uploads
                  };
                }),
                subcontractors: con.subcontractors || []
              }))            
            },
            isLoading: false
          });

          RecipientDataService.findOne(data.anchor_id)
          .then(response => {
            this.setState({
              recipients: response.data
            });
            console.log("Organisation:",response.data);
          })
          .catch(e => {
            console.log(e);
          });

        } else {
          console.log("Invalid response from getAllDraftsByDtscfId(id)!");
          this.setState({
            message: "Invalid response data",
            isLoading: false
          });
        }
      })
      .catch(e => {
        console.log(e);
        this.setState({ isLoading: false, message: "Error fetching project data: " + e.message });
      });
    } else { // id == 0, new project
      console.log("Organisation id = ", user.organisation_id);
      RecipientDataService.findOne(user.organisation_id)
        .then(response => {
          this.setState({
            recipients: response.data
          });
          console.log("Organisation:",response.data);
        })
        .catch(e => {
          console.log(e);
        });
    }
    this.setState({ isLoading: false });
  }

  getAllUnderlyingAssets() {
    CampaignDataService.getAll()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            underlyingDSGDList: [ { id:-1, name:"No campaign available, please create a campaign first."}],
          });
        } else {        
          console.log("UnderlyingDSGDList:, ", response.data);  
          this.setState({
            underlyingDSGDList: response.data,
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }
 
  handleMilestoneChange(e) {
    this.setState({
      datachanged: true
    });

    const [selectedMilestoneId, selectedMilestone] = e.target.value.split('|'); // Assuming value is in format "id|name"
    console.log("Selected Milestone ID:", selectedMilestoneId);
    console.log("Selected Milestone Name:", selectedMilestone);
    console.log("value:'"+e.target.value+"'");

    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        selectedMilestone: selectedMilestone,
        selectedMilestoneId: selectedMilestoneId
      }
    }));
  }
  //////////////////////////////////////////////////////////////////////

  async approveMilestoneCompleted() {
    this.setState({ // show loading modal with logs
      isLoading: true,
      logs: [] ,
      message: "",
      showm: true,
      modalmsg: "Processing...\n",
      button1text: null,
      button2text: null,
      button3text: null,
      button0text: null,
      afterModalClose: null,
    });
    
    console.log("IsLoad=true");
    this.show_loading();

    const selectedMilestone_id = this.state.currentProject.milestones.find((mm) => mm.name === this.state.selectedMilestone);

    console.log("Approving selectedMilestone:", this.state.selectedMilestone);
    console.log("Approving selectedMilestone ID:", selectedMilestone_id?.id);

    //await DtscfDataService.getAllByDtscfId(id)

    await DtscfDataService.approveMilestoneCompletedById(
        this.state.currentUser.walletaddress,
        this.state.currentProject
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("Milestone has been set to completed.", "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log(">>>> "+e);
      console.log(e.message);
      this.displayModal("Milestone update failed.", null, null, null, "OK");
    });
      
    this.hide_loading();
  } // approveMilestoneCompleted()

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
    this.displayModal("Are you sure you want to Delete this Dtscf?", null, "Yes, delete", null, "Cancel");
  };

  hideModal() {
    this.setState({
      showm: false,
      modalmsg: "",
      button1text: null,
      button2text: null,
      button3text: null,
      button0text: null,
    }, () => {
      if (this.state.afterModalClose) {
        this.state.afterModalClose();
      }
      this.setState({ afterModalClose: null });
    });
  }

  displayModal(msg, ...rest) {
    let options = {};
    if (rest.length === 1 && rest[0] && typeof rest[0] === 'object') {
      options = rest[0];
    } else {
      const [button1text, button2text, button3text, button0text] = rest;
      options = { button1text, button2text, button3text, button0text };
    }
    const {
      button1text = null,
      button2text = null,
      button3text = null,
      button0text = "OK",
      afterClose = null
    } = options;
    this.setState({
      showm: true,
      modalmsg: msg,
      button1text,
      button2text,
      button3text,
      button0text,
      afterModalClose: afterClose,
    });
  }
  // Modal functions similar to dtscf

  renderContractor(contractor, tier = 1) {
    return (
      <div key={contractor.id} style={{ marginLeft: `${tier * 20}px` }}>
        <h5>Tier-{tier} Contractor: {contractor.name} (Budget: {contractor.budget}) (Wallet Address: {contractor.walletaddress})</h5>
        <h6>Purchases</h6>
        {contractor.purchases.map((purchase, purIndex) => (
          <div key={purIndex}>
            <p>Description: {purchase.description}</p>
            <p>Amount: {purchase.amount}</p>
            <p>Invoice: {purchase.invoice_blob ? "Uploaded" : "None"}</p> {/* Placeholder; add download if needed */}
          </div>
        ))}
        {contractor.subcontractors && contractor.subcontractors.length > 0 && (
          <div>
            <h6>Subcontractors</h6>
            {contractor.subcontractors.map(sub => this.renderContractor(sub, tier + 1))}
          </div>
        )}
      </div>
    );
  }

  render() {

    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} replace />;
    }

    const { underlyingDSGDList, currentProject, selectedMilestone, approverList } = this.state;
    console.log("currentProject: ", currentProject);

    // Filter logic: Find contractors who have at least one purchase in the selected milestone
    const filteredDisplay = currentProject.contractors.map(con => {
      const relevantPurchases = con.purchases.filter(pur => pur.milestone === selectedMilestone);
      if (relevantPurchases.length > 0) {
        return { ...con, relevantPurchases };
      }
      return null;
    }).filter(con => con !== null);
    
    return (
        <div className="container">
          { 
            (this.state.userReady) ?
            <div>
            <header className="jumbotron col-md-8">
              <h3>
                <strong>
                  {this.state.currentProject.txntype===0?"Create ":
                    (this.state.currentProject.txntype===1?"Update ":
                      (this.state.currentProject.txntype===2?"Delete ":null))
                  }DTSCF Project 
                  { this.state.isMaker? "(Maker)": 
                    (
                //      this.state.isChecker? "(Checker)": 
                      (this.state.isApprover? "(Approver)":null) 
                    )
                  }</strong>
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
            { this.state.recipients.id !== null && 
            <>
              <label htmlFor="description">Organisation</label>
              <input 
                type="text" 
                className="form-control" 
                id="id" 
                value={this.state.recipients.name} 
                disabled="true"
              />
            </>
            }
            { currentProject.id !== 0 && 
            <>
              <label htmlFor="description">Project ID</label>
              <input 
                type="text" 
                className="form-control" 
                id="id" 
                value={currentProject.id} 
                disabled="true"
              />
            </>
            }
            <label htmlFor="description">Project Name</label>
            <input 
              type="text" 
              className="form-control" 
              id="name" 
              maxlength="50"
              value={currentProject.name} 
              onChange={this.onChangeName} 
              disabled="true"
            />
            <label htmlFor="description">Project Description</label>
            <input 
              type="text" 
              className="form-control" 
              id="description" 
              maxlength="255"
              value={currentProject.description} 
              onChange={this.onChangeDescription} 
              disabled="true"
            />
          </div>
          <div className="form-group">
            <label htmlFor="totalBudget">Total Budget</label>
            <input 
              type="number" 
              className="form-control" 
              id="totalBudget" 
              max="1000000000000"
              value={currentProject.totalBudget} 
              onChange={this.onChangeTotalBudget} 
              disabled="true"
            />
          </div>
          { (currentProject && currentProject.smartcontractaddress !== "" && currentProject.smartcontractaddress !== null && currentProject.smartcontractaddress !=='undefined') && 
          <div className="form-group">
            <label htmlFor="smartcontractaddress">Tokenised Payable Address</label>
            <input 
              type="text" 
              className="form-control" 
              id="name" 
              maxlength="50"
              value={currentProject.smartcontractaddress} 
              disabled="true"
            />
          </div>
          }
          <div className="form-group">
            <label htmlFor="name">Underlying Digital Money *</label>
            <select
                  onChange={this.onChangeUnderlying}                         
                  className="form-control"
                  id="underlyingTokenID"
                  required
                  disabled="true"
            >
                  <option value=""> </option>
                  {
                    Array.isArray(underlyingDSGDList) ?
                    underlyingDSGDList.map( (d) => {
                      if (typeof d.id === "number")
                      // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                        return <option value={d.id} selected={d.id === (currentProject.campaign ? currentProject.campaign.underlyingTokenID : this.state.currentProject.underlyingTokenID)}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
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
                  <option value="80002"  selected={currentProject.campaign ? currentProject.campaign.blockchain === 80002 : this.state.currentProject.blockchain === 80002}>Polygon   Testnet Amoy</option>
                  <option value="11155111" selected={currentProject.campaign ? currentProject.campaign.blockchain === 11155111 : this.state.currentProject.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                  <option value="80001"  selected={currentProject.campaign ? currentProject.campaign.blockchain === 80001 : this.state.currentProject.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
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
              value={currentProject.startdate}
              onChange={this.onChangeStartDate}
              disabled="true"
            />
          </div>
          <div className="form-group">
            <label htmlFor="enddate">End Date</label>
            <input
              type="date"
              className="form-control"
              id="enddate"
              value={currentProject.enddate}
              onChange={this.onChangeEndDate}
              disabled="true"
            />
          </div>
          <br />

      <div className="mt-4 card p-3">
        <h5>Set Milestone Completion</h5>
        <div className="form-group">
          <label htmlFor="milestoneSelect">Select Milestone:</label>
          <select 
            id="milestoneSelect"
            className="form-control" 
            value={selectedMilestone} 
            onChange={this.handleMilestoneChange}
            disabled={!(this.state.isAnchor && this.state.isMaker && currentProject.status === null) }
          >
            <option value="">-- Select a Milestone --</option>
            {currentProject.milestones.map((ms, index) => (
              <option key={index} value={ms.id + "|" + ms.name} disabled={ms.milestone_completed}>{ms.name} (Completion Date: {ms.enddate})</option>
            ))}
          </select>
        </div>

        {selectedMilestone && (
          <div className="mt-3">
            <h6>Contractors & Purchases for: {selectedMilestone}</h6>
            {filteredDisplay.length > 0 ? (
              filteredDisplay.map((con, cIdx) => (
                <div key={cIdx} className="border p-2 mb-2">
                  <strong>Contractor: {con.name}</strong> 
                  {/*
                  (Wallet: {con.walletaddress})
                  */}
                  <ul>
                    {con.relevantPurchases.map((pur, pIdx) => (
                      <li key={pIdx}>
                        Purchase: {pur.description} - Amount: {pur.amount}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-muted">No associated contractors or purchases found for this milestone.</p>
            )}
          </div>
        )}
      </div>

{/*}
          <div className="form-group">
            <label htmlFor="approver">Approver *</label>
            <select
                value={currentProject.approver}
                onChange={this.onChangeApprover}                         
                className="form-control"
                id="approver"
                disabled={!(this.state.isAnchor && this.state.isMaker && currentProject.status === null) }
                >
                <option></option>
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
          (currentProject.id !== 0 ? // add new project
          <div className="form-group">
            <label htmlFor="approverComments">Approver Comments</label>
            <input
              type="text"
              maxLength="255"
              className="form-control"
              id="approverComments"
              required
              value={currentProject.approverComments}
              onChange={this.onChangeApproverComments}
              name="approverComments"
              autoComplete="off"
              disabled={this.state.currentUser.id !== currentProject.approver || currentProject.status!==2}
              />
          </div>
          : null
          )
          }
*/}
          </form>


              {  //// buttons!
/*

                  this.state.isMaker && currentProject.id === 0 &&  // creating new draft
                        <button 
                        onClick={this.createProject} 
                        type="submit"
                        className="m-3 btn btn-sm btn-primary"
                        >
                          Submit Request
                        </button>
*/
              }

              { 
                  this.state.isMaker && currentProject.status !== null && currentProject.status <= 0 &&  // creating draft or amending draft
                        <>
                            <button
                            type="submit"
                            className="m-3 btn btn-sm btn-primary"
                            onClick={this.submitDtscf}
                            >
                              Submit&nbsp;
                              {
                                (currentProject.txntype===0? " Creation ":
                                (currentProject.txntype===1? " Updation ":
                                (currentProject.txntype===2? " Deletion ":null)))
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
/*
                this.state.isChecker && currentProject.status === 1 && 
                    <button
                      type="submit"
                      className="m-3 btn btn-sm btn-primary"
                      onClick={this.acceptDtscf}
                    >
                      Endorse&nbsp;
                      {
                        (currentProject.txntype===0? " Creation ":
                        (currentProject.txntype===1? " Updation ":
                        (currentProject.txntype===2? " Deletion ":null)))
                      }
                      Request
                    </button> 
*/
              }
              {
                    this.state.isAnchor && this.state.isMaker && currentProject.status === null &&
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={this.approveMilestoneCompleted}
                    >
                      Set Milestone Completed
                    </button> 
                
              }
&nbsp;
              {
                currentProject.id !== 0 && (
//                  this.state.isChecker || 
                  this.state.isApprover) && 
                currentProject.status <= 2 &&  currentProject.status >= 1 && // status < 2 still in draft and not deployed yet
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-danger"
                    onClick={this.rejectDtscf}
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
                  <Link to="/dtscf">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Cancel
                  </button>
                  </Link>
                )
              : 
                <Link to="/dtscf">
                <button className="m-3 btn btn-sm btn-secondary">
                  Cancel
                </button>
                </Link>
              }  

              {this.state.isLoading ? <LoadingSpinner /> : null}

              <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/dtscf'} handleProceed2={this.deleteDtscf} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                {this.state.modalmsg}
              </Modal>
              {this.state.logs.length > 0 && (
                <div className="progress-logs">
                  <h5>Processing Logs:</h5>
                  <ul>
                    {this.state.logs.map((log, index) => (
                      <li key={index}>{log}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
    );
  }
}

export default withRouter(DTSCFProjectCreation);