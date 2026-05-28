import React, { Component } from "react";
import CampaignDataService from "../services/campaign.service";
import DtscfDataService from "../services/dtscf.service.js";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
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
    this.onChangeContractorOrg = this.onChangeContractorOrg.bind(this);
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

    this.createProject = this.createProject.bind(this);
    this.updateProject = this.updateProject.bind(this);
    this.submitDtscf = this.submitDtscf.bind(this);
    this.acceptDtscf = this.acceptDtscf.bind(this);
    this.approveDtscf = this.approveDtscf.bind(this);
    this.rejectDtscf = this.rejectDtscf.bind(this);
    this.deleteDtscf = this.deleteDtscf.bind(this);
    this.dropRequest = this.dropRequest.bind(this);

    this.showModal_Leave = this.showModal_Leave.bind(this);
    this.hideModal = this.hideModal.bind(this);
    
    this.state = {
      redirect : null,
      currentUser: { id: null, username: "" },
      recipients: { id: null, name: null },
      currentProject: {
        id: 0,
        name: "New project",
        description: "Project description",
        totalBudget: 100000,
        anchor_id: null,
        underlyingTokenID: 0,
        underlyingDSGDsmartcontractaddress: "",
        smartcontractaddress: "",
        blockchain: 0,
        campaign: null,
        campaign_id: 0,
        startdate: getToday(),
        enddate: getToday(),
        milestones: [{name: "M1 - milestone one", budget: 0, startdate: getToday(), enddate: getToday()}],
        contractors: [{name: "", budget: 0, walletaddress: "", purchases: [{description: "New purchase", amount: 0}],  invoices: []}], // invoices as File objects
      },
      underlyingDSGDList: [],
      contractorOrgList: [],
      checkerList: {
        id: null,
        username: "",
      },
      approverList: {
        id: null,
        username: "",
      },

      isNewProject: true,
      isAnchor: false,
      isContractor: false,
      datachanged: false,
      message: "",
      isLoading: false,
      logs: [], // New state for streaming logs
      explorerUrl: "",
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
    const user = AuthService.getCurrentUser();
    this.setState({ currentUser: user });
    console.log("Current user:", user);

    if (!user) {
      this.setState({ redirect: "/login" });
    } else {
      this.setState({ currentUser: user, actionby:user.username, userReady: true })

      let ismaker= user.opsrole.find((el) => 
        el.opsrole.name.toUpperCase() === "MAKER"
      );
      console.log("isMaker:", (ismaker === undefined? false: true));
      this.setState({ isMaker: (ismaker === undefined? false: true),});

//      let ischecker= user.opsrole.find((el) => 
//        el.opsrole.name.toUpperCase() === "CHECKER"
//      );
//      console.log("isChecker:", (ischecker === undefined? false: true));
//      this.setState({ isChecker: (ischecker === undefined? false: true),});

      let isapprover= user.opsrole.find((el) =>
      el.opsrole.name.toUpperCase() === "APPROVER"
      );
      console.log("isApprover:", (isapprover === undefined? false: true));
      this.setState({ isApprover: (isapprover === undefined? false: true),});

      let isanchor = user.roles && user.roles.find((el) =>
        el.toUpperCase() === "ROLE_ANCHOR"
      );
      this.setState({ isAnchor: (isanchor === undefined ? false : true) });

      let iscontractor = user.roles && user.roles.find((el) =>
        el.toUpperCase() === "ROLE_CONTRACTOR"
      );
      this.setState({ isContractor: (iscontractor === undefined ? false : true) });

      this.getAllUnderlyingAssets();
      this.getContractorOrganisations();
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

    this.setState({ isLoading: true });
    if (id !== undefined && id !== 0) {
      console.log("Calling getAllDraftsByDtscfId... ");

      await DtscfDataService.getAllDraftsByDtscfId(id)
      .then(response => {
        if (response && response.data) {
          console.log("Response from getAllDraftsByDtscfId(id):", response.data);

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
//              checker: data.checker,
              approver: data.approver,
//              checkerComments: data.checkerComments,
              approverComments: data.approverComments,
              milestones: (data.dtscf_milestones_drafts || []).map(ms => ({
                ...ms,
                id: ms.id,
                description: ms.description || "",
                budget: ms.budget || 0,
                startdate: moment(ms.startdate).format('YYYY-MM-DD'),
                enddate: moment(ms.enddate).format('YYYY-MM-DD'),
              })),
              contractors: (() => {
                const resolvePurchases = (node) =>
                  (node.dtscf_purchases_drafts || node.purchases || []).map(pur => {
                    const matchedMs = (data.dtscf_milestones_drafts || []).find(m => m.id === pur.dtscf_milestone_id);
                    return {
                      ...pur,
                      description: pur.description || '',
                      amount: pur.amount || 0,
                      milestone: matchedMs ? matchedMs.name : (pur.milestone || ''),
                      invoices: pur.invoices || []
                    };
                  });
                const mapNode = (node) => ({
                  ...node,
                  purchases: resolvePurchases(node),
                  subcontractors: (node.subcontractors || []).map(mapNode)
                });
                return (data.dtscf_contractors_drafts || []).map(con => mapNode({
                  ...con,
                  id: con.id,
                  name: con.name || '',
                  budget: con.budget || 0,
                  walletaddress: con.walletaddress || ''
                }));
              })()
            },
            isLoading: false
          }, () => {
            this.reconcileContractorOrgs();
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
          this.setState(prevState => ({
            recipients: response.data,
            currentProject: {
              ...prevState.currentProject,
              anchor_id: user.organisation_id
            }
          }));
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
  
  getContractorOrganisations() {
    DtscfDataService.getContractorOrganisations()
      .then(response => {
        console.log("ContractorOrgList:", response.data);
        this.setState({ contractorOrgList: response.data || [] }, () => {
          this.reconcileContractorOrgs();
        });
      })
      .catch(e => {
        console.log("getContractorOrganisations error:", e);
      });
  }

  reconcileContractorOrgs() {
    const { contractorOrgList, currentProject } = this.state;
    if (!contractorOrgList.length || !currentProject || !currentProject.contractors || !currentProject.contractors.length) return;

    let changed = false;
    const updated = currentProject.contractors.map(con => {
      // Already has a valid organisation_id — ensure it's an integer for consistent comparison
      if (con.organisation_id) {
        const asInt = parseInt(con.organisation_id, 10);
        if (asInt !== con.organisation_id) { changed = true; return { ...con, organisation_id: asInt }; }
        return con;
      }
      // Try to match by name first
      if (con.name) {
        const org = contractorOrgList.find(
          o => o.name.toLowerCase() === con.name.toLowerCase()
        );
        if (org) {
          changed = true;
          return { ...con, organisation_id: org.id, walletaddress: con.walletaddress || org.walletaddress || '' };
        }
      }
      // Fall back to wallet address match
      if (con.walletaddress) {
        const org = contractorOrgList.find(
          o => o.walletaddress && o.walletaddress.toLowerCase() === con.walletaddress.toLowerCase()
        );
        if (org) {
          changed = true;
          return { ...con, organisation_id: org.id, name: con.name || org.name };
        }
      }
      return con;
    });

    if (changed) {
      this.setState(prevState => ({
        currentProject: { ...prevState.currentProject, contractors: updated }
      }));
      console.log("reconcileContractorOrgs: updated contractors with organisation_id");
    }
  }

  onChangeName(e) {
    const name = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentProject: {
          ...prevState.currentProject,
          name: name
        }
      };
    });
  }

  onChangeDescription(e) {
    const description = e.target.value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, description },
      datachanged: true
    }));
  }

  onChangeTotalBudget(e) {
    const totalBudget = parseFloat(e.target.value);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, totalBudget },
      datachanged: true
    }));
  }

  onChangeUnderlying(e) {
    const underlyingTokenID = parseInt(e.target.value);
    console.log("New underlyingTokenID=", underlyingTokenID);
    const newBlockchain = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
    console.log("New blockchain=", newBlockchain);
    const newUnderlyingDSGDsmartcontractaddress = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).smartcontractaddress
    console.log("New UnderlyingDSGDsmartcontractaddress=", newUnderlyingDSGDsmartcontractaddress);
    const newCampaign = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID));
    console.log("New Campaign=", newCampaign);

    // when underlying changes, blockchain might change also bccos underlying could be in different blockchain
    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentProject: {
          ...prevState.currentProject,
          underlyingTokenID: underlyingTokenID,
          blockchain: newBlockchain,
          underlyingDSGDsmartcontractaddress: newUnderlyingDSGDsmartcontractaddress,
          campaign: newCampaign,  // updating this will change the blockchain field also
        }
      };
    });
    console.log("New currentProject=", this.state.currentProject);

  }

  onChangeStartDate(e) {
    const startdate = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
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
      currentProject: {
        ...prevState.currentProject,
        enddate: enddate
      }
    }));
  }

  addMilestone() {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        milestones: [...prevState.currentProject.milestones, { name: "", budget: 0, startdate: getToday(), enddate: getToday() }]
      },
      datachanged: true
    }));
  }

  onChangeMilestone(index, field, value) {
    const milestones = [...this.state.currentProject.milestones];
    const oldName = milestones[index].name;
    milestones[index][field] = field === 'budget' ? parseFloat(value) : value;

    // Update purchases if the milestone name changes
    let contractors = [...this.state.currentProject.contractors];
    if (field === 'name') {
      contractors.forEach(con => {
        con.purchases.forEach(pur => {
          if (pur.milestone === oldName) {
            pur.milestone = value; // update to new name dynamically
          }
        });
      });
    }

    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, milestones, contractors },
      datachanged: true
    }));
  }

  removeMilestone(index) {
    const milestones = [...this.state.currentProject.milestones];
    milestones.splice(index, 1);
    
    // Reset purchase dropdown to blank if its tagged milestone is deleted
    const contractors = [...this.state.currentProject.contractors];
    const validMilestoneNames = milestones.map(m => m.name);
    
    contractors.forEach(con => {
      con.purchases.forEach(pur => {
        if (!validMilestoneNames.includes(pur.milestone)) {
          pur.milestone = ""; 
        }
      });
    });

    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, milestones, contractors },
      datachanged: true
    }));
  }

  addContractor() {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: [...prevState.currentProject.contractors, { name: "", organisation_id: null, budget: 0, walletaddress: "", purchases: [], invoices: [] }]
      },
      datachanged: true
    }));
  }

  onChangeContractor(index, field, value) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[index][field] = field === 'budget' ? parseFloat(value) : value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  // Called when the org dropdown changes — sets organisation_id, name, and walletaddress together
  onChangeContractorOrg(index, orgId) {
    const contractors = [...this.state.currentProject.contractors];
    const org = this.state.contractorOrgList.find(o => o.id === parseInt(orgId));
    if (org) {
      contractors[index].organisation_id = org.id;
      contractors[index].name = org.name;
      contractors[index].walletaddress = org.walletaddress || '';
    } else {
      contractors[index].organisation_id = null;
      contractors[index].name = '';
      contractors[index].walletaddress = '';
    }
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  removeContractor(index) {
    const contractors = [...this.state.currentProject.contractors];
    contractors.splice(index, 1);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  addPurchase(conIndex) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases.push({ description: "", dtscf_contractor_id: this.state.currentProject.contractors[conIndex].id, amount: 0, milestone: "", invoices: [] });
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  onChangePurchase(conIndex, purIndex, value) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases[purIndex].description = value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  onChangePurchaseAmount(conIndex, purIndex, value) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases[purIndex].amount = parseFloat(value);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }
  
  onChangePurchaseMilestone(conIndex, purIndex, value) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases[purIndex].milestone = value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  removePurchase(conIndex, purIndex) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases.splice(purIndex, 1);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  handleInvoiceUpload(conIndex, purIndex, e) {
    const file = e.target.files[0];
    if (!file) return;

    const contractors = [...this.state.currentProject.contractors];
    const purchase = contractors[conIndex].purchases[purIndex];

    // FIX: Ensure the invoices array exists before pushing
    if (!purchase.invoices) {
      purchase.invoices = [];
    }

    purchase.invoices.push(file);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }
/*
  onChangeChecker(e) {
    const checker = e.target.value;
    
    //this.setState({
    //  datachanged: true
    //});
    
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
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
        currentProject: {
          ...prevState.currentProject,
          checkerComments: checkerComments
        }
      };
    });
  }
*/
  onChangeApprover(e) {
    const approver = e.target.value;
    /*
    this.setState({
      datachanged: true
    });
  */
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
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
        currentProject: {
          ...prevState.currentProject,
          approverComments: approverComments
        }
      };
    });
  }

  async validateForm() {    
    var err = "";

    if (!(typeof this.state.currentProject.name ==='string' || this.state.currentProject.name instanceof String) || (this.state.currentProject.name.trim() === "" || this.state.currentProject.name === null || this.state.currentProject.name === undefined)) {
      err += "- Name cannot be empty\n";
    } 
    if (this.state.currentProject.totalBudget && (isNaN(this.state.currentProject.totalBudget) || this.state.currentProject.totalBudget <= 0)) err += "- Total Budget is invalid\n";

    this.state.currentProject.contractors.forEach(con => {
      if (!(typeof con.name ==='string' || con.name instanceof String) || (con.name.trim() === "" || con.name === null || con.name === undefined)) {
        err += "- Contractor's Name cannot be empty\n"; 
      } 
      if (con.budget && (isNaN(con.budget) || con.budget <= 0)) {
        err += "- Contractor '" + con.name + "' Budget is invalid\n";
      } else {
        if (con.budget > this.state.currentProject.totalBudget) {
          err += `- Contractor '${con.name}' budget cannot be more than Total Budget\n`;
        }
      }
      if (!(typeof con.walletaddress ==='string' || con.walletaddress instanceof String) || (con.walletaddress.trim() === "" || con.walletaddress === null || con.walletaddress === undefined)) {
        err += "- Contractor's Wallet Address cannot be empty\n"; 
      } else if (!isValidAddress(con.walletaddress)) {
        err += `- Contractor ${con.name}'s Wallet Address is invalid\n`;
      }
    });

    this.state.currentProject.milestones.forEach(ms => {
      if (! validator.isDate(ms.startdate)) err += "- Milestone '" + ms.name + "' Start Date is invalid\n";
      if (! validator.isDate(ms.enddate)) err += "- Milestone '" + ms.name + "' End Date is invalid\n";
      if (validator.isDate(ms.startdate) && validator.isDate(ms.enddate)) {
        if (moment(ms.startdate).isAfter(moment(ms.enddate))) err += "- Milestone '" + ms.name + "' Start date cannot be later than End date\n";
        if (! moment(ms.enddate).isAfter(moment(ms.startdate))) err += "- Milestone '" + ms.name + "' End date must be after Start date\n";
      }
      if (isNaN(ms.budget) || ms.budget <= 0) {
        err += "- Milestone '" + ms.name + "' Budget is invalid\n";
      } 
      if (ms.budget > this.state.currentProject.totalBudget) {
        err += `- Milestone '${ms.name}' budget cannot be more than Total Budget\n`;
      }
    });

      // dont need t check description, it can be empty
    if (! validator.isDate(this.state.currentProject.startdate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.currentProject.enddate)) err += "- End Date is invalid\n";
    if (validator.isDate(this.state.currentProject.startdate) && validator.isDate(this.state.currentProject.enddate)) {
      if (moment(this.state.currentProject.startdate).isAfter(moment(this.state.currentProject.enddate))) err += "- Project Start date cannot be later than End date\n";
      if (! moment(this.state.currentProject.enddate).isAfter(moment(this.state.currentProject.startdate))) err += "- Project End date must be after Start date\n";
    }
    if (this.state.currentProject.underlyingTokenID === 0 || this.state.currentProject.underlyingTokenID === "" || this.state.currentProject.underlyingTokenID === null || this.state.currentProject.underlyingTokenID === undefined) err += "- Underlying Digital Money cannot be empty\n";
    if (this.state.currentProject.totalBudget === "" || this.state.currentProject.totalBudget === null || this.state.currentProject.totalBudget === undefined) 
    {
        err += "- Budget cannot be empty\n";
    } else
        if (parseInt(this.state.currentProject.totalBudget) <=  0) err += "- Budget must be more than zero\n";
    if (this.state.currentProject.startdate!== "" && this.state.currentProject.enddate !== "" && this.state.currentProject.startdate > this.state.currentProject.enddate) err += "- Start date cannot be later than End date\n";    

    console.log("start date:'"+this.state.currentProject.startdate+"'");
    console.log("end date:'"+this.state.currentProject.enddate+"'");
    console.log("Start > End? "+ (this.state.currentProject.startdate > this.state.currentProject.enddate));

//    console.log("Checker:'"+this.state.currentProject.checker+"'");
    console.log("Approver:'"+this.state.currentProject.approver+"'");

//    if (this.state.currentProject.checker === "" || this.state.currentProject.checker === null || this.state.currentProject.checker === undefined) err += "- Checker cannot be empty\n";
    if (this.state.currentProject.approver === "" || this.state.currentProject.approver === null || this.state.currentProject.approver === undefined) err += "- Approver cannot be empty\n";
    if (
      //this.state.currentProject.checker === this.state.currentUser.id.toString() && 
        this.state.currentProject.approver === this.state.currentUser.id.toString()) {
      err += "- Maker and Approver cannot be the same person\n";
    } else {
//      if (this.state.currentProject.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.currentProject.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
//      if (this.state.currentProject.checker!==null && this.state.currentProject.checker!=="" && this.state.currentProject.checker !== undefined
//            && this.state.currentProject.checker === this.state.currentProject.approver) err += "- Checker and Approver cannot be the same person\n";
    }

    if (err !=="" ) {
      err = "Form validation issues found:\n"+err;
      //alert(err);
      this.displayModal(err, null, null, null, "OK");
      err = ""; // clear var
      return false;
    }
    return true;
  }  // validateForm()

  //////////////////////////////////////////////////////////////////////

  async createProject(){
    this.setState({
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

    console.log('[CLIENT] createProject called with data:', this.state.currentProject);

    this.setState({ isLoading: true, logs: [], message: '' });

    if (await this.validateForm() === true) {   
      const draftData = {
          name: this.state.currentProject.name,
          description: this.state.currentProject.description,
          totalBudget: this.state.currentProject.totalBudget,
          underlyingDSGDsmartcontractaddress: this.state.currentProject.underlyingDSGDsmartcontractaddress,
          underlyingTokenID: this.state.currentProject.underlyingTokenID,
          campaign_id: this.state.currentProject.campaign_id,
          blockchain: this.state.currentProject.blockchain,
          startdate: this.state.currentProject.startdate,
          enddate: this.state.currentProject.enddate,
          txntype: this.state.currentProject.txntype || 0,  // Fallback only if truly missing, but ensure set
          anchor_id: this.state.currentProject.anchor_id,  // From state, even if undefined
          maker: this.state.currentProject.maker || this.state.currentUser.id,
          approver: this.state.currentProject.approver,
          actionby: this.state.currentUser.username,  // Use username for consistency
          approveddtscfid: this.state.currentProject.approveddtscfid || -1,
          milestones: this.state.currentProject.milestones.map(ms => ({
            id: ms.id,
            name: ms.name,
            budget: ms.budget,
            startdate: ms.startdate,
            enddate: ms.enddate,
            description: ms.description || ''  // Include if needed
          })),
          contractors: this.state.currentProject.contractors.map(con => ({
            id: con.id,
            name: con.name,
            organisation_id: con.organisation_id || null,
            budget: con.budget,
            walletaddress: con.walletaddress,
            purchases: con.purchases.map(pur => ({
              id: pur.id,
              description: pur.description,
              amount: pur.amount,
              milestone: pur.milestone,
              invoices: pur.invoices
            })),
            subcontractors: con.subcontractors || []
          }))
      };

      console.log('Full draftData being sent:', JSON.stringify(draftData));  // This should now show all data

      this.setState({ isLoading: true });

      DtscfDataService.draftCreate(draftData, (log1) => {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + log1 + "\n"
        }));
        console.log('[CLIENT UI] Received log:', log1); // NEW: Confirm onLog calls
        this.setState({ logs: [...this.state.logs, log1] });
      })
      .then(response => {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + response.message + "\n",
          button0text: "Close",
          isLoading: false,
          afterModalClose: () => this.props.router.navigate("/dtscf")
        }));
        console.log('[CLIENT UI] draftCreate success:', response); // NEW: Confirm resolve
        //this.setState({ logs: [...this.state.logs, log1] });

        this.setState({
/*          currentProject: {
            ...this.state.currentProject,
            id: response.data.id || response.message?.match(/id=(\d+)/)?.[1] || this.state.currentProject.id,  // Parse id if in message
            maker: this.state.currentUser.id,
            txntype: 0  // For new creation requests
          },
*/
          message: response.message,
          isLoading: false
        });
      })
      .catch(e => {
        const errMsg = (e.response && e.response.data && e.response.data.message) || e.message || e.toString();
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + "Error: " + errMsg + "\n",
          button0text: "Close",
          isLoading: false,
        }));
        console.error('[CLIENT UI] draftCreate error:', errMsg); // NEW: Confirm reject
        //this.setState({ logs: [...this.state.logs, log1] });
      });
    } // await this.validateForm()
    this.hide_loading();

  }
  
  async submitDtscf() {
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

    if (await this.validateForm() === true) {   
      const submitData = {
        name: this.state.currentProject.name,
        description: this.state.currentProject.description,
        totalBudget: this.state.currentProject.totalBudget,
        underlyingDSGDsmartcontractaddress: this.state.currentProject.underlyingDSGDsmartcontractaddress,
        underlyingTokenID: this.state.currentProject.underlyingTokenID,
        campaign_id: this.state.currentProject.campaign_id,
        blockchain: this.state.currentProject.blockchain,
        startdate: this.state.currentProject.startdate,
        enddate: this.state.currentProject.enddate,
        txntype: this.state.currentProject.txntype || 0,  // Fallback only if truly missing, but ensure set
        anchor_id: this.state.currentProject.anchor_id,  // From state, even if undefined
        maker: this.state.currentProject.maker || this.state.currentUser.id,
        approver: this.state.currentProject.approver,
        actionby: this.state.currentUser.username,  // Use username for consistency
        approveddtscfid: this.state.currentProject.approveddtscfid || -1,
        milestones: this.state.currentProject.milestones.map(ms => ({
          id: ms.id,
          name: ms.name,
          budget: ms.budget,
          startdate: ms.startdate,
          enddate: ms.enddate,
          description: ms.description || ''  // Include if needed
        })),
        contractors: this.state.currentProject.contractors.map(con => ({
          id: con.id,
          name: con.name,
          organisation_id: con.organisation_id || null,
          budget: con.budget,
          walletaddress: con.walletaddress,
          purchases: con.purchases.map(pur => ({
            id: pur.id,
            description: pur.description,
            milestone: pur.milestone,
            amount: pur.amount
          })),
          subcontractors: con.subcontractors || []
        }))
      };

      console.log('Full submitData being sent:', JSON.stringify(submitData));  // This should now show all data

      this.setState({ isLoading: true });

//      DtscfDataService.submitDraftById(this.state.currentProject.id, submitData, (log1) => {
      DtscfDataService.submitDraftById(this.state.currentProject.id, this.state.currentProject, (log1) => {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + log1 + "\n"
        }));
        //this.setState({ logs: [...this.state.logs, log1] });
      })
      .then(response => {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + response.message + "\n",
          button0text: "Close",
          isLoading: false,
          afterModalClose: () => this.props.router.navigate("/dtscf")
        }));
        //this.setState({ logs: [...this.state.logs, log1] });

        this.setState({
/*          currentProject: {
            ...this.state.currentProject,
            id: response.data.id || response.message?.match(/id=(\d+)/)?.[1] || this.state.currentProject.id,  // Parse id if in message
            maker: this.state.currentUser.id,
            txntype: 0  // For new creation requests
          },
*/
          message: response.message,
          isLoading: false
        });
      })
      .catch(e => {
        const errMsg = (e.response && e.response.data && e.response.data.message) || e.message || e.toString();
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + "Error: " + errMsg + "\n",
          button0text: "Close",
          isLoading: false,
        }));
        //this.setState({ logs: [...this.state.logs, log1] });
      });
    }
    this.setState({ isLoading: false });
  } // submitDtscf()

  async acceptDtscf() {
      console.log("IsLoad=true");
      this.show_loading();

      await DtscfDataService.acceptDraftById(
        this.state.currentProject.id,
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
        this.displayModal("Dtscf request checked, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Dtscf accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The Dtscf accept failed. The Dtscf name is already used, please use another name.", null, null, null, "OK");
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
    this.hide_loading();
  } //  acceptDtscf()

  async approveDtscf() {
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

    console.log("Approving Dtscf ID:", this.state.currentProject.id);
    console.log("Approving Dtscf:", this.state.currentProject);

    await DtscfDataService.approveDraftById(this.state.currentProject.id, this.state.currentProject, (log1) => {
      if (log1.startsWith('EXPLORER:')) {
        this.setState({ explorerUrl: log1.substring(9) });
      } else {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + log1 + "\n"
        }));
      }
    })
    .then(response => {
      this.setState(prevState => ({
        modalmsg: prevState.modalmsg + response.message + "\n",
        button0text: "Close",
        isLoading: false,
        afterModalClose: () => this.props.router.navigate("/dtscf")
      }));
      //this.setState({ logs: [...this.state.logs, log1] });

      this.setState({
/*          currentProject: {
          ...this.state.currentProject,
          id: response.data.id || response.message?.match(/id=(\d+)/)?.[1] || this.state.currentProject.id,  // Parse id if in message
          maker: this.state.currentUser.id,
          txntype: 0  // For new creation requests
        },
*/
        message: response.message,
        isLoading: false
      });
    })
    .catch(e => {
      const errMsg = (e.response && e.response.data && e.response.data.message) || e.message || e.toString();
      this.setState(prevState => ({
        modalmsg: prevState.modalmsg + "Error: " + errMsg + "\n",
        button0text: "Close",
        isLoading: false,
      }));
      //this.setState({ logs: [...this.state.logs, log1] });
    });

  } // approveDtscf()

  async updateProject() {
    this.setState({ isLoading: true });
    const formData = new FormData();
    formData.append('id', this.state.currentProject.id);
    formData.append('name', this.state.currentProject.name);
    formData.append('description', this.state.currentProject.description);
    formData.append('totalBudget', this.state.currentProject.totalBudget);
    formData.append('startdate', this.state.currentProject.startdate);
    formData.append('enddate', this.state.currentProject.enddate);
    formData.append('milestones', JSON.stringify(this.state.currentProject.milestones));
    formData.append('contractors', JSON.stringify(this.state.currentProject.contractors.map(c => (
      {...c, purchases: c.purchases.map(p => (
        { ...p, 
          milestone: p.milestone || "", 
          invoices: []
        }
      ))}
    )))); // Send metadata

    this.state.currentProject.contractors.forEach((con, conIndex) => {
      con.purchases.forEach((pur, purIndex) => {
        if (pur.invoices.length > 0) {
          formData.append(`contractor_${conIndex}_purchase_${purIndex}_invoice`, pur.invoices[0]);
        }
      });
    });

    await DtscfDataService.update(this.state.currentProject.id, formData)
      .then(response => {
        //this.setState({ message: "Project updated successfully!", isLoading: false });
        this.displayModal("Dtscf project update request submitted for review.", "OK", null, null, null);
      })
      .catch(e => {
        console.log(e);
        this.setState({ isLoading: false });
      });
  }

  async rejectDtscf() {

//    console.log("isChecker? ", this.state.isChecker);
//    console.log("this.state.currentProject.checkerComments: ", this.state.currentProject.checkerComments);
    console.log("isApprover? ", this.state.isApprover);
    console.log("this.state.currentProject.approverComments: ", this.state.currentProject.approverComments);

//    if ( this.state.isChecker && (typeof this.state.currentProject.checkerComments==="undefined" || this.state.currentProject.checkerComments==="" || this.state.currentProject.checkerComments===null)) { 
//      this.displayModal("Please enter the reason for rejection in the Checker Comments.", null, null, null, "OK");
//    } else 
    if (this.state.isApprover && (typeof this.state.currentProject.approverComments==="undefined" || this.state.currentProject.approverComments==="" || this.state.currentProject.approverComments===null)) {
      this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
    } else {
      //console.log("Form Validation passed");
    
      console.log("IsLoad=true");
      this.show_loading();

      await DtscfDataService.rejectDraftById(
        this.state.currentProject.id,
        this.state.currentProject,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();

        this.setState({  
          datachanged: false,
        });
        this.displayModal("This Dtscf request is rejected. Routing back to maker.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Dtscf rejection failed.", null, null, null, "OK");
      });
    }
    this.hide_loading();
  }
    
  async deleteDtscf() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await DtscfDataService.approveDeleteDraftById(
      this.state.currentProject.id,
      this.state.currentProject,
    )
    .then(response => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress

      this.displayModal("Dtscf is deleted.", "OK", null, null, null);
      console.log(response.data);
      //this.props.router.navigate('/inbox');
    })
    .catch(e => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      console.log(e);
    });
  } // deleteDtscf()

  async dropRequest() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await DtscfDataService.dropRequestById(
      this.state.currentProject.id,
      this.state.currentProject,
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
    this.displayModal("Are you sure you want to Delete this Dtscf?", null, "Yes, delete", null, "Cancel");
  };

  hideModal() {
    this.setState({
      showm: false,
      modalmsg: "",
      explorerUrl: "",
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
        <h5>Tier-{tier} Contractor: {contractor.name} (Wallet Address: {contractor.walletaddress})</h5>
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

  
  renderProjectDiagram() {
    const { currentProject } = this.state;
    if (!currentProject) return null;

    const projectName = currentProject.name || "Untitled Project";

    return (
      <div className="project-diagram mt-5 mb-4" style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '30px 20px',
        border: '1px solid #334155',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        width: '100%'
      }}>
        <div style={{ maxWidth: '360px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            display: 'block',
            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
            color: 'white',
            padding: '14px 32px',
            borderRadius: '9px',
            fontSize: '18px',
            fontWeight: '700',
            boxShadow: '0 4px 6px -1px rgb(59 130 246 / 0.3)',
            border: '2px solid #60a5fa',
            textAlign: 'center'
          }}>
            Project: <span style={{ fontSize: '20px' }}>{projectName}</span>
          </div>
          {this.state.isAnchor && currentProject.totalBudget && (
            <div style={{
              marginTop: '12px',
              fontSize: '15px',
              color: '#94a3b8'
            }}>
              Total Budget: <strong style={{ color: '#22c55e' }}>
                ${parseFloat(currentProject.totalBudget).toLocaleString()}
              </strong>
            </div>
          )}
        </div>

        {/* Main connector line from project to milestones */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
          margin: '20px 0 40px 0'
        }}>
          <div style={{
            position: 'absolute',
            width: '4px',
            height: '60px',
            background: '#64748b',
            top: '-30px',
            zIndex: 1
          }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {currentProject.milestones && currentProject.milestones.map((milestone, msIndex) => {
            // Group contractors that have purchases tagged to this milestone
            const milestoneContractors = currentProject.contractors ?
              currentProject.contractors.filter(con =>
                con.purchases && con.purchases.some(p => p.milestone === milestone.name)
              ) : [];

            return (
              <div key={msIndex} style={{
                width: '100%',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                border: '2px solid #3b82f6',
                position: 'relative',
                boxSizing: 'border-box'
              }}>
                {/* Milestone Box */}
                <div style={{
                  background: '#1e40af',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontWeight: '600',
                  marginBottom: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ fontSize: '13px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    MILESTONE #{msIndex + 1}
                  </div>
                  <div style={{ fontSize: '15px', marginTop: '4px' }}>
                    {milestone.name || `Milestone ${msIndex + 1}`}
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '6px', opacity: 0.85 }}>
                    Budget: ${parseFloat(milestone.budget || 0).toLocaleString()}
                  </div>
                </div>

                {/* Contractors & Purchases under this milestone */}
                <div style={{ marginTop: '12px' }}>
                  {milestoneContractors.length > 0 ? (
                    milestoneContractors.map((contractor, conIndex) => (
                      <div key={conIndex} style={{
                        background: '#334155',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px',
                        borderLeft: '4px solid #22c55e'
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#86efac' }}>
                          {contractor.name || `Contractor ${conIndex + 1}`}
                        </div>
{/*  
                        <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                          Budget: ${parseFloat(contractor.budget || 0).toLocaleString()}
                        </div>
*/}
                        {/* Purchases tagged to this milestone */}
                        <div style={{ marginTop: '10px' }}>
                          {contractor.purchases && contractor.purchases
                            .filter(p => p.milestone === milestone.name)
                            .map((purchase, purIndex) => (
                            <div key={purIndex} style={{
                              background: '#1e2937',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              marginTop: '6px',
                              fontSize: '13px',
                              border: '1px solid #475569'
                            }}>
                              <div style={{ fontWeight: '500' }}>{purchase.description || `Purchase ${purIndex + 1}`}</div>
                              <div style={{ color: '#a3e635', fontSize: '12px', marginTop: '2px' }}>
                                ${parseFloat(purchase.amount || 0).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Sub-contractors with purchases in this milestone — hidden from Anchor */}
                        {!this.state.isAnchor && (contractor.subcontractors || [])
                          .filter(sub => (sub.purchases || []).some(p => p.milestone === milestone.name))
                          .map((sub, subIdx) => (
                            <div key={subIdx} style={{ marginLeft: '12px', marginTop: '8px', background: '#1a3040', borderRadius: '6px', padding: '10px 12px', borderLeft: '3px solid #06b6d4' }}>
                              <div style={{ fontWeight: '600', fontSize: '13px', color: '#67e8f9' }}>{sub.name}</div>
                              {(sub.purchases || []).filter(p => p.milestone === milestone.name).map((p, pi) => (
                                <div key={pi} style={{ background: '#0f2132', borderRadius: '4px', padding: '6px 10px', marginTop: '4px', fontSize: '12px', border: '1px solid #164e63' }}>
                                  <div style={{ fontWeight: '500' }}>{p.description}</div>
                                  <div style={{ color: '#a3e635', marginTop: '2px' }}>${parseFloat(p.amount || 0).toLocaleString()}</div>
                                </div>
                              ))}
                            </div>
                          ))
                        }
                      </div>
                    ))
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: '#64748b',
                      fontStyle: 'italic',
                      fontSize: '13px',
                      padding: '20px 10px',
                      border: '2px dashed #475569',
                      borderRadius: '8px'
                    }}>
                      No purchases tagged to this milestone yet
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(!currentProject.milestones || currentProject.milestones.length === 0) && (
          <div style={{
            textAlign: 'center',
            color: '#64748b',
            padding: '40px 20px',
            fontStyle: 'italic',
            border: '2px dashed #475569',
            borderRadius: '12px',
            background: '#1e2937'
          }}>
            Add at least one Milestone and tag Purchases to Milestones (via the "Tag to Milestone" dropdown) to build the full project hierarchy diagram.
          </div>
        )}

        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          fontSize: '12px',
          color: '#64748b',
          fontStyle: 'italic'
        }}>
{/*
          Live Project Hierarchy Diagram • Updates instantly as you edit the form
 */}
        </div>
        </div>
      </div>
    );
  }


  render() {

    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} replace />;
    }

    const { underlyingDSGDList, currentProject, isNewProject, isLoading,
//      checkerList,
      approverList } = this.state;
    console.log("currentProject: ", currentProject);

    if (isLoading && !this.state.showm) {
      return (
        <div className="container mt-4">
          <div className="d-flex align-items-center gap-2">
            <div className="spinner-border spinner-border-sm text-secondary" role="status" />
            &nbsp;<span>Loading ...</span>
          </div>
        </div>
      );
    }

    const userOrgId = this.state.currentUser && parseInt(this.state.currentUser.organisation_id);
    const findInTree = (contractors) => {
      for (const con of contractors) {
        if (parseInt(con.organisation_id) === userOrgId) return true;
        if (findInTree(con.subcontractors || [])) return true;
      }
      return false;
    };
    const isContractorInProject = !this.state.isContractor || findInTree(currentProject.contractors);

    if (!isContractorInProject) {
      return (
        <div className="container mt-4">
          <p className="text-danger">You do not have access to this project.</p>
          <a href="/dashboard"><button type="button" className="btn btn-sm btn-secondary">Back to Dashboard</button></a>
        </div>
      );
    }

    return (
        <div className="container">
          { 
            (this.state.userReady) ?
            <div>
            <header className="jumbotron col-md-8"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
              color: 'white',
              padding: '20px 30px',
              borderRadius: '12px',
              marginBottom: '25px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
              border: '2px solid #60a5fa'
            }}
            >
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
<div className="row gx-4">

            {/* ==================== LEFT COLUMN: FORM ==================== */}
            <div className="col-lg-7 col-md-12">
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
                disabled={true}
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
                disabled={true}
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
              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
            />
            <label htmlFor="description">Project Description</label>
            <input 
              type="text" 
              className="form-control" 
              id="description" 
              maxlength="255"
              value={currentProject.description} 
              onChange={this.onChangeDescription} 
              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
            />
          </div>
          {this.state.isAnchor && (
          <div className="form-group">
            <label htmlFor="totalBudget">Total Budget</label>
            <input
              type="number"
              className="form-control"
              id="totalBudget"
              max="1000000000000"
              value={currentProject.totalBudget}
              onChange={this.onChangeTotalBudget}
              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
            />
          </div>
          )}
          { (currentProject && currentProject.smartcontractaddress !== "" && currentProject.smartcontractaddress !== null && currentProject.smartcontractaddress !=='undefined') && 
          <div className="form-group">
            <label htmlFor="smartcontractaddress">Tokenised Payable Address</label>
            <input 
              type="text" 
              className="form-control" 
              id="name" 
              maxlength="50"
              value={currentProject.smartcontractaddress} 
              disabled={true}
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
                  value={currentProject.campaign ? currentProject.campaign.underlyingTokenID : (this.state.currentProject.underlyingTokenID || "")}
                  disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
            >
                  <option value=""> </option>
                  {
                    Array.isArray(underlyingDSGDList) ?
                    underlyingDSGDList.map( (d) => {
                      if (typeof d.id === "number")
                        return <option key={d.id} value={d.id}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
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
                  value={currentProject.campaign ? currentProject.campaign.blockchain : (this.state.currentProject.blockchain || "")}
                  disabled={true}
                  >
                  <option value="">   </option>
                  <option value="80002">Polygon   Testnet Amoy</option>
                  <option value="11155111">Ethereum  Testnet Sepolia</option>
                  <option value="80001" disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                  <option value="43113" disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                  <option value="137" disabled>Polygon   Mainnet (not in use at the moment)</option>
                  <option value="1" disabled>Ethereum  Mainnet (not in use at the moment)</option>
                  <option value="43114" disabled>Avalanche Mainnet (not in use at the moment)</option>
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
              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
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
              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
            />
          </div>
          <br />
          <label htmlFor="milestone">Milestones</label>
          <table style={{border : '1px solid blue', width: '100%'}}>
          <tbody><tr>
            <td style={{border : '1px solid blue', width: '100%'}}>
              {currentProject.milestones.map((milestone, index) => (
                <div key={index}>
                  <label htmlFor="milestone.name">Milestone #{index+1} Name</label>
                  <div>
                    <input 
                      type="text" 
                      className="form-control" 
                      maxlength="50" 
                      value={milestone.name} 
                      onChange={(e) => this.onChangeMilestone(index, 'name', e.target.value)} 
                      placeholder="Milestone Name" 
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    />
                  </div>
                  <label htmlFor="milestone.budget">Budget</label>
                  <div>
                    <input 
                      type="number" 
                      className="form-control"
                      max="1000000000000" 
                      value={milestone.budget} 
                      onChange={(e) => this.onChangeMilestone(index, 'budget', e.target.value)} 
                      placeholder="Milestone Budget" 
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    />
                  </div>
                  <label htmlFor="milestone.startdate">Start Date</label>
                  <div>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={milestone.startdate} 
                      onChange={(e) => this.onChangeMilestone(index, 'startdate', e.target.value)} 
                      placeholder="Start Date" 
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    />
                  </div>
                  <label htmlFor="milestone.endDate">End Date</label>
                  <div>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={milestone.enddate} 
                      onChange={(e) => this.onChangeMilestone(index, 'enddate', e.target.value)} 
                      placeholder="End Date" 
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    />
                  </div>

                  <div>
                    { (currentProject.status<=0 || this.state.currentProject.id===0) &&
                    <button type="button" className="m-3 btn btn-sm btn-danger" onClick={() => this.removeMilestone(index)} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}>Remove</button>
                    }
                    <br/>
                  </div>
                </div>
              ))}
                { (currentProject.status<=0 || this.state.currentProject.id===0) &&
                <button type="button" className="m-3 btn btn-sm btn-primary" onClick={this.addMilestone} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}>Add Milestone</button>
              }
            </td>
          </tr></tbody>
          </table>

          <br />
          <label htmlFor="contractors">Contractors</label>
          <table style={{border : '1px solid blue', width: '100%'}}>
          <tbody><tr>
            <td style={{border : '1px solid blue', width: '100%'}}>
              {currentProject.contractors && currentProject.contractors.map((contractor, conIndex) => (
                <div key={conIndex}>
                  <label htmlFor="contractor.organisation_id">Contractor #{conIndex+1} Organisation</label>
                  <div>
                    <select
                      className="form-control"
                      value={contractor.organisation_id ? parseInt(contractor.organisation_id, 10) : ""}
                      onChange={(e) => this.onChangeContractorOrg(conIndex, e.target.value)}
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    >
                      <option value="">-- Select Contractor Organisation --</option>
                      {this.state.contractorOrgList.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                  <label htmlFor="contractor.walletaddress">Contractor's Wallet Address</label>
                  <div>
                    <input
                      type="text"
                      className="form-control"
                      value={contractor.walletaddress}
                      onChange={(e) => this.onChangeContractor(conIndex, 'walletaddress', e.target.value)}
                      placeholder="Auto-filled from organisation selection"
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    />
                  </div>

                  <br />
                  <label htmlFor="contractor.name">Purchases</label>
                  <table style={{border : '2px solid lightblue', width: '100%'}}>
                  <tbody><tr>
                    <td style={{border : '2px solid lightblue', width: '100%'}}>
                      {contractor.purchases && contractor.purchases.map((purchase, purIndex) => (
                      <div key={purIndex}>
                        <label htmlFor="purchase.description">Purchase #{purIndex+1}</label>
                        <div>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={purchase.description} 
                            onChange={(e) => this.onChangePurchase(conIndex, purIndex, e.target.value)} 
                            placeholder="Purchase Description"
                            disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                          />
                        </div>
                        <label htmlFor="purchase.milestone">Tag to Milestone</label>
                        <div>
                          <select 
                            className="form-control" 
                            value={purchase.milestone || ""}
                            onChange={(e) => this.onChangePurchaseMilestone(conIndex, purIndex, e.target.value)}
                            disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                          >
                            <option value="">-- Select a Milestone --</option>
                            {this.state.currentProject.milestones.map((ms, msIndex) => (
                              <option key={msIndex} value={ms.name}>
                                {ms.name || `Unnamed Milestone ${msIndex + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        <label htmlFor="purchase.amount">Invoice(s) Amount</label>
                        <div>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={purchase.amount} 
                            onChange={(e) => this.onChangePurchaseAmount(conIndex, purIndex, e.target.value)} 
                            placeholder="Invoice Amount" 
                            disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                          />
                        </div>
                        <label htmlFor="contractor.name">Invoice(s)</label>
                        {purchase.invoices && purchase.invoices.map((inv, invIndex) => (
                          <div key={invIndex}>{inv.name}</div>
                        ))}
                        <div>
                          <input 
                            type="file" 
                            onChange={(e) => this.handleInvoiceUpload(conIndex, purIndex, e)} 
                            disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                          /> <i style={{fontSize: 'small'}}>combine multiple invoices into one zip file if needed</i>
                        </div>
                        {(currentProject.status<=0 || this.state.currentProject.id===0) &&
                        <button type="button" className="m-3 btn btn-sm btn-danger" onClick={() => this.removePurchase(conIndex, purIndex)} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}>Remove</button>
                        }
                        <br/>
                      </div>
                      ))}
                      {(currentProject.status<=0 || this.state.currentProject.id===0) &&
                      <button type="button" className="m-3 btn btn-sm btn-primary" onClick={() => this.addPurchase(conIndex)} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}>Add Purchase</button>
                      }
                    </td>
                  </tr></tbody>
                  </table>
                  {/* Sub-contractors hidden from Anchor — only visible to non-anchor roles */}
                  {!this.state.isAnchor && contractor.subcontractors && contractor.subcontractors.length > 0 && (
                    <div style={{ marginTop: '12px', paddingLeft: '16px', borderLeft: '3px solid #93c5fd' }}>
                      <label style={{ fontWeight: 600, color: '#1e40af' }}>Sub-Contractors</label>
                      {contractor.subcontractors.map((sub, subIdx) => (
                        <div key={subIdx} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px 14px', marginTop: '8px' }}>
                          <div><strong>Sub-Contractor #{subIdx + 1}:</strong> {sub.name}</div>
                          {sub.walletaddress && <div style={{ fontSize: '12px', color: '#64748b' }}>Wallet: {sub.walletaddress}</div>}
                          {sub.purchases && sub.purchases.length > 0 && (
                            <table style={{ border: '1px solid #bfdbfe', width: '100%', marginTop: '6px', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ background: '#dbeafe' }}>
                                  <th style={{ padding: '4px 8px', border: '1px solid #bfdbfe' }}>Purchase</th>
                                  <th style={{ padding: '4px 8px', border: '1px solid #bfdbfe' }}>Milestone</th>
                                  <th style={{ padding: '4px 8px', border: '1px solid #bfdbfe' }}>Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sub.purchases.map((p, pIdx) => (
                                  <tr key={pIdx}>
                                    <td style={{ padding: '4px 8px', border: '1px solid #bfdbfe' }}>{p.description}</td>
                                    <td style={{ padding: '4px 8px', border: '1px solid #bfdbfe' }}>{p.milestone || p.dtscf_milestone_id || '—'}</td>
                                    <td style={{ padding: '4px 8px', border: '1px solid #bfdbfe' }}>{p.amount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {(currentProject.status<=0 || this.state.currentProject.id===0) &&
                  <button type="button" className="m-3 btn btn-sm btn-danger" onClick={() => this.removeContractor(conIndex)} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}>Remove Contractor</button>
                  }
                  <br/>
                </div>
              ))}
              {(currentProject.status<=0 || this.state.currentProject.id===0) &&
              <button type="button" className="m-3 btn btn-sm btn-primary" onClick={this.addContractor} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}>Add Contractor</button>
              }
            </td>
          </tr></tbody>
          </table>
          <br />
{ 
/*
          <div className="form-group">
            <label htmlFor="checker">Checker *</label>
            <select
                  value={currentProject.checker}
                  onChange={this.onChangeChecker}                         
                  className="form-control"
                  id="checker"
                  disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                  >
                  <option></option>
                  {
                    Array.isArray(checkerList) ?
                      checkerList.map( (d) => {
                        return <option key={d.id} value={d.id}>{d.username}</option>
                      })
                    : null
                  }
                </select>
          </div>
          {
          (currentProject.id !== 0 ? // add new project
          <div className="form-group">
            <label htmlFor="checkerComments">Checker Comments</label>
            <input
              type="text"
              maxLength="255"
              className="form-control"
              id="checkerComments"
              required
              value={currentProject.checkerComments}
              onChange={this.onChangeCheckerComments}
              name="checkerComments"
              autoComplete="off"
              disabled={this.state.currentUser.id !== currentProject.checker || currentProject.status!==1}
              />
          </div>
          :
          null
          )
          }
*/
}
          <div className="form-group">
            <label htmlFor="approver">Approver *</label>
            <select
                value={currentProject.approver || ""}
                onChange={this.onChangeApprover}                         
                className="form-control"
                id="approver"
                disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                >
                <option></option>
              {
                Array.isArray(approverList) ?
                approverList
                  .filter(d => d.organisation_id === this.state.currentUser.organisation_id)
                  .map( (d) => {
                    return <option key={d.id} value={d.id}>{d.username}</option>
                  })
                : null
              }
            </select>
          </div>
          { currentProject.id !== 0 && (
          <div className="form-group">
            <label htmlFor="approverComments">Approver Comments</label>
            <input
              type="text"
              maxLength="255"
              className="form-control"
              id="approverComments"
              required
              value={currentProject.approverComments || ""}
              onChange={this.onChangeApproverComments}
              name="approverComments"
              autoComplete="off"
              disabled={this.state.currentUser.id !== currentProject.approver || currentProject.status!==2}
              />
          </div>
          )}

          </form>

              {  //// buttons!


                  this.state.isMaker && currentProject.id === 0 &&  // creating new draft
                        <button 
                        onClick={this.createProject} 
                        type="submit"
                        className="m-3 btn btn-sm btn-primary"
                        >
                          Submit Request
                        </button>
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
                    this.state.isApprover && currentProject.status === 2 &&
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={currentProject.txntype===2? this.deleteDraft: this.approveDtscf}
                    >
                      Approve & Deploy
                      {
                        (currentProject.txntype===0? " Creation ":
                        (currentProject.txntype===1? " Updation ":
                        (currentProject.txntype===2? " Deletion ":null)))
                      }
                      Request

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
            </div>

            {/* ==================== RIGHT COLUMN: DIAGRAM (now on the right + vertically centered) ==================== */}
            <div className="col-lg-5 col-md-12 d-flex align-items-center" style={{ minHeight: '100%' }}>
              <div style={{ width: '100%', position: 'sticky', top: '30px' }}>
                {this.renderProjectDiagram()}
              </div>
            </div>

          </div>
        </div>

              {this.state.isLoading ? <LoadingSpinner /> : null}

              <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/dtscf'} handleProceed2={this.deleteDtscf} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                <>
                  {(this.state.modalmsg || '').split('\n').map((line, i) => (
                    <p key={i} style={{ fontSize: '1rem', marginBottom: '4px' }}>{line}</p>
                  ))}
                  {this.state.explorerUrl && (
                    <p style={{ marginTop: '8px' }}>
                      <a href={this.state.explorerUrl} target="_blank" rel="noreferrer" style={{ color: '#4a90e2' }}>
                        View contract on blockchain explorer ↗
                      </a>
                    </p>
                  )}
                </>
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
    );
  }
}

export default withRouter(DTSCFProjectCreation);