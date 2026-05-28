import React, { Component } from "react";
import { flushSync } from 'react-dom';
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
import Web3 from 'web3';

const UNWRAP_READ_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "milestoneId", "type": "uint256"}],
    "name": "getTokensForMilestone",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "payables",
    "outputs": [
      {"internalType": "bytes32",  "name": "escrowCommitment", "type": "bytes32"},
      {"internalType": "uint256",  "name": "maturityDate",     "type": "uint256"},
      {"internalType": "bool",     "name": "realized",         "type": "bool"},
      {"internalType": "address",  "name": "issuer",           "type": "address"},
      {"internalType": "uint256",  "name": "milestoneId",      "type": "uint256"}
    ],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "account", "type": "address"},
      {"internalType": "uint256", "name": "id", "type": "uint256"}
    ],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view", "type": "function"
  }
];

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
    this.handleMilestoneChange = this.handleMilestoneChange.bind(this); 


    this.createUnwrapDraft = this.createUnwrapDraft.bind(this);
    this.updateProject = this.updateProject.bind(this);
    this.submitUnwrapDtscf = this.submitUnwrapDtscf.bind(this);
    this.approveUnwrap = this.approveUnwrap.bind(this);
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
        milestones: [{name: "mmm", budget: 222, startdate: getToday(), enddate: getToday()}],
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
      logs: [],
      txHashUrl: null,
      milestonesWithUserTokens: null, // Set of milestone IDs where user holds ≥1 NFT; null = not yet checked
      milestoneRealisedStatuses: {}, // milestoneId → 'realised'|'partial'|'not_realised'|'no_tokens'|'error'
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

      let isanchor = user.opsrole.find((el) =>
        el.opsrole.name.toUpperCase() === "ANCHOR"
      );
      console.log("isAnchor:", (isanchor === undefined? false: true));
      this.setState({ isAnchor: (isanchor === undefined? false: true),});

      const isContractor = user.roles && user.roles[0] && user.roles[0].toUpperCase() === "ROLE_CONTRACTOR";
      console.log("isContractor:", isContractor);
      this.setState({ isContractor });

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
              contractors: (() => {
                const mapContractorTree = (con) => ({
                  ...con,
                  id: con.id,
                  name: con.name || "",
                  budget: con.budget || 0,
                  walletaddress: con.walletaddress || "",
                  purchases: (con.dtscf_purchases || con.purchases || []).map(pur => {
                    const matchedMilestone = (data.dtscf_milestones || []).find(m => m.id === pur.dtscf_milestone_id);
                    return {
                      ...pur,
                      id: pur.id,
                      description: pur.description || "",
                      amount: pur.amount || 0,
                      milestone: matchedMilestone ? matchedMilestone.name : (pur.milestone || ""),
                      invoices: []
                    };
                  }),
                  subcontractors: (con.subcontractors || []).map(sub => mapContractorTree(sub))
                });
                return (data.dtscf_contractors || []).map(con => mapContractorTree(con));
              })()
            },
            isLoading: false
          }, () => {
            this.loadAllMilestoneRealisedStatuses();
            this.loadUserTokenMilestones();
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
        contractors: [...prevState.currentProject.contractors, { name: "", budget: 0, walletaddress: "", purchases: [], invoices: [] }]
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
    contractors[conIndex].purchases.push({ description: "", amount: 0, milestone: "", invoices: [] });
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

  handleMilestoneChange(e) {
    const value = e.target.value;
    if (!value) {
      this.setState(prevState => ({
        currentProject: { ...prevState.currentProject, selectedMilestone: "", selectedMilestoneId: null },
        datachanged: true
      }));
      return;
    }
    const [selectedMilestoneId, selectedMilestone] = value.split('|');
    console.log("Selected Milestone ID:", selectedMilestoneId, "Name:", selectedMilestone);
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        selectedMilestone: selectedMilestone,
        selectedMilestoneId: selectedMilestoneId
      },
      datachanged: true
    }));
  }

  getRpcUrl(chainId) {
    const rpcMap = {
      80002:    'https://rpc-amoy.polygon.technology',
      11155111: 'https://rpc2.sepolia.org',
      80001:    'https://rpc-mumbai.maticvigil.com',
    };
    return rpcMap[parseInt(chainId)] || null;
  }

  async loadUserTokenMilestones() {
    const { currentProject, currentUser } = this.state;
    if (!currentProject.smartcontractaddress || !currentProject.blockchain) return;
    const walletAddress = currentUser && currentUser.walletaddress;
    if (!walletAddress || !window.ethereum) return;

    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(UNWRAP_READ_ABI, currentProject.smartcontractaddress);
      const milestoneIds = new Set();

      await Promise.all((currentProject.milestones || []).map(async ms => {
        try {
          const tokenIds = await contract.methods.getTokensForMilestone(ms.id).call();
          if (!tokenIds || tokenIds.length === 0) return;
          const balances = await Promise.all(
            tokenIds.map(id => contract.methods.balanceOf(walletAddress, id).call())
          );
          if (balances.some(b => parseInt(b) > 0)) {
            milestoneIds.add(parseInt(ms.id));
          }
        } catch (e) {
          console.error("Balance check failed for milestone", ms.id, e);
          milestoneIds.add(parseInt(ms.id)); // fail-open: include if check errors
        }
      }));

      this.setState({ milestonesWithUserTokens: milestoneIds });
    } catch (e) {
      console.error("loadUserTokenMilestones failed:", e);
      // fail-open: leave null so all milestones remain visible
    }
  }

  async loadAllMilestoneRealisedStatuses() {
    const { currentProject } = this.state;
    if (!currentProject.smartcontractaddress || !currentProject.blockchain) return;

    const today = moment();
    const statuses = {};
    const needsChainCheck = [];

    // If maturity date is reached, it is automatically realised — no blockchain call needed.
    // Only milestones whose maturity date is still in the future may have been force-realised
    // by the Anchor via forceRealizeMilestone(), so those need a blockchain query.
    (currentProject.milestones || []).forEach(ms => {
      if (today.isSameOrAfter(moment(ms.enddate), 'day')) {
        statuses[ms.id] = 'realised';
      } else {
        needsChainCheck.push(ms);
      }
    });

    if (needsChainCheck.length > 0) {
      const queryViaMetaMask = async () => {
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(UNWRAP_READ_ABI, currentProject.smartcontractaddress);
        await Promise.all(needsChainCheck.map(async ms => {
          try {
            const tokenIds = await contract.methods.getTokensForMilestone(ms.id).call();
            if (!tokenIds || tokenIds.length === 0) { statuses[ms.id] = 'no_tokens'; return; }
            const results = await Promise.all(tokenIds.map(id => contract.methods.payables(id).call()));
            const realizedCount = results.filter(p => p.realized).length;
            if (realizedCount === 0)                    statuses[ms.id] = 'not_realised';
            else if (realizedCount === tokenIds.length) statuses[ms.id] = 'realised';
            else                                        statuses[ms.id] = 'partial';
          } catch (e) {
            console.error("MetaMask chain query failed for milestone", ms.id, e);
            statuses[ms.id] = 'not_realised';
          }
        }));
      };

      const queryViaServer = async () => {
        const ids = needsChainCheck.map(ms => ms.id);
        const response = await DtscfDataService.getMilestoneRealisedStatus(
          currentProject.smartcontractaddress,
          currentProject.blockchain,
          ids
        );
        const serverStatuses = response.data.statuses || {};
        needsChainCheck.forEach(ms => {
          statuses[ms.id] = serverStatuses[ms.id] || 'not_realised';
        });
      };

      try {
        if (window.ethereum) {
          await queryViaMetaMask();
        } else {
          await queryViaServer();
        }
      } catch (error) {
        console.error("Blockchain query failed, falling back to server:", error);
        try {
          await queryViaServer();
        } catch (serverError) {
          console.error("Server fallback also failed:", serverError);
          needsChainCheck.forEach(ms => { if (!statuses[ms.id]) statuses[ms.id] = 'not_realised'; });
        }
      }
    }

    this.setState({ milestoneRealisedStatuses: statuses });
  }

  async validateForm() {    
    var err = "";

    console.log("Validating form with currentProject:", this.state.currentProject);
    console.log("Selected Milestone for Purchase:", this.state.currentProject.selectedMilestone);

    if (this.state.currentProject.selectedMilestone === "" || this.state.currentProject.selectedMilestone === null || this.state.currentProject.selectedMilestone === undefined) {
      err += "- Please select a Milestone for the Purchase\n";
    }

    if (!(typeof this.state.currentProject.name ==='string' || this.state.currentProject.name instanceof String) || (this.state.currentProject.name.trim() === "" || this.state.currentProject.name === null || this.state.currentProject.name === undefined)) {
      err += "- Name cannot be empty\n";
    } 

    this.state.currentProject.contractors.forEach(con => {
      if (!(typeof con.name ==='string' || con.name instanceof String) || (con.name.trim() === "" || con.name === null || con.name === undefined)) {
        err += "- Contractor's Name cannot be empty\n"; 
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

    //console.log("Approver:'"+this.state.currentProject.approver+"'");

    //if (this.state.currentProject.approver === "" || this.state.currentProject.approver === null || this.state.currentProject.approver === undefined) err += "- Approver cannot be empty\n";
    //if (
    //    this.state.currentProject.approver === this.state.currentUser.id.toString()) {
    //  err += "- Maker and Approver cannot be the same person\n";
    //} else {
    //  if (this.state.currentProject.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
    //}

    if (err !=="" ) {
      err = "Form validation issues found:\n"+err;
      this.displayModal(err, null, null, null, "OK");
      err = ""; // clear var
      return false;
    }
    return true;
  }  // validateForm()
  

  //////////////////////////////////////////////////////////////////////
  
  async submitUnwrapDtscf() {
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
          budget: con.budget,
          walletaddress: con.walletaddress,
          purchases: con.purchases.map(pur => ({
            id: pur.id,
            description: pur.description,
            milestone: pur.milestone, 
            amount: pur.amount
            // invoices: pur.invoices  // Omit files since no upload in submit; already handled in create/update
          })),
          subcontractors: con.subcontractors || []  // If applicable
        }))
      };

      console.log('Full submitData being sent:', JSON.stringify(submitData));  // This should now show all data

      this.setState({ isLoading: true });

      DtscfDataService.submitDraftById(this.state.currentProject.id, submitData, (log1) => {
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
  } // submitUnwrapDtscf()

  async createUnwrapDraft() {
    console.log("IsLoad=true");
    this.show_loading();

    if (await this.validateForm() === true) {   

      await DtscfDataService.createUnwrapDraft(
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
        this.displayModal("Sending Unwrap Request for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Unwrap request failed: "+e.response.data.message, null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The Unwrap request failed. The Unwrap name is already used, please use another name.", null, null, null, "OK");
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
    }
    this.hide_loading();
  } //  createUnwrapDraft()

  getExplorerUrl(chainId, hash) {
    const explorers = {
      1: 'https://etherscan.io/tx/',
      11155111: 'https://sepolia.etherscan.io/tx/',
      80002: 'https://amoy.polygonscan.com/tx/',
      137: 'https://polygonscan.com/tx/',
    };
    const base = explorers[parseInt(chainId)] || 'https://etherscan.io/tx/';
    return base + hash;
  }

  async approveUnwrap() {
    const abiFile = [
      {
        "inputs": [{ "internalType": "uint256", "name": "milestoneId", "type": "uint256" }],
        "name": "getTokensForMilestone",
        "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "uint256[]", "name": "ids",     "type": "uint256[]" },
          { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" },
          { "internalType": "bytes32[]", "name": "salts",   "type": "bytes32[]" }
        ],
        "name": "batchUnwrapToDeposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "payables",
        "outputs": [
          { "internalType": "bytes32",  "name": "escrowCommitment", "type": "bytes32" },
          { "internalType": "uint256",  "name": "maturityDate",     "type": "uint256" },
          { "internalType": "bool",     "name": "realized",         "type": "bool" },
          { "internalType": "address",  "name": "issuer",           "type": "address" },
          { "internalType": "uint256",  "name": "milestoneId",      "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "address", "name": "account", "type": "address" },
          { "internalType": "uint256", "name": "id",      "type": "uint256" }
        ],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    // 1. Validate form fields before proceeding

    
    if (!(await this.validateForm())) return;

    const { currentProject, currentUser, milestoneRealisedStatuses } = this.state;
    
    // 2. Check for MetaMask/Web3 provider
    if (!window.ethereum) {
      this.displayModal("MetaMask is not detected. Please install the extension to proceed.", null, null, null, "OK");
      return;
    }

    flushSync(() => {
      this.setState({
        isLoading: true,
        modalmsg: "Connecting to MetaMask...\n",
        showm: true,
        button0text: null,
        txHashUrl: null,
      });
    });

    try {
      // 3. Initialize Web3 and request account access
      const web3 = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // DEBUG LOGS
      console.log("Active Account:", accounts[0]);
      console.log("Contract Address:", currentProject.smartcontractaddress);
      console.log("Raw Milestone ID from State:", currentProject.selectedMilestoneId);

      // Validate the connected wallet matches the logged-in contractor's wallet
      if (currentUser.walletaddress &&
          accounts[0].toLowerCase() !== currentUser.walletaddress.toLowerCase()) {
        throw new Error(
          `Wrong wallet connected. MetaMask is using ${accounts[0]}, ` +
          `but your account wallet is ${currentUser.walletaddress}. ` +
          `Please switch to the correct wallet in MetaMask and try again.`
        );
      }

      // 1. Check the Connected Blockchain ID
      const connectedChainId = await web3.eth.getChainId();
      const expectedChainId = parseInt(currentProject.blockchain);

      console.log("Connected Chain ID:", connectedChainId);
      console.log("Expected Chain ID from Project:", expectedChainId);

      this.setState(prevState => ({ 
        modalmsg: prevState.modalmsg + `Connected to Chain ID: ${connectedChainId}\n` 
      }));

      // 2. Validate Network Match
      if (connectedChainId !== expectedChainId) {
        throw new Error(`Network Mismatch! MetaMask is on Chain ${connectedChainId}, but project is on Chain ${expectedChainId}. Please switch networks in MetaMask.`);
      }

      const contract = new web3.eth.Contract(
        abiFile, 
        currentProject.smartcontractaddress
      );

      // 4. Retrieve token IDs for the selected milestone, then filter to only those in this user's wallet
      const mId = parseInt(currentProject.selectedMilestoneId);
      this.setState(prevState => ({ modalmsg: prevState.modalmsg + "Querying blockchain for tokens...\n" }));
      const allMilestoneTokenIds = await contract.methods.getTokensForMilestone(mId).call();
      console.log("Blockchain Response (Token IDs):", allMilestoneTokenIds);

      if (!allMilestoneTokenIds || allMilestoneTokenIds.length === 0) {
        throw new Error(`Contract returned 0 tokens for Milestone ID: ${mId}. Check if MetaMask is on the correct network.`);
      }

      // Filter to tokens owned by the current wallet — only unwrap tokens that belong to this user
      const balances = await Promise.all(
        allMilestoneTokenIds.map(id => contract.methods.balanceOf(accounts[0], id).call())
      );
      const tokenIds = allMilestoneTokenIds.filter((_, i) => balances[i] === '1' || balances[i] === 1);

      if (tokenIds.length === 0) {
        throw new Error(
          `None of the ${allMilestoneTokenIds.length} token(s) in this milestone are in your wallet (${accounts[0]}). ` +
          `Unwrap can only be done by the token holder.`
        );
      }

      this.setState(prevState => ({ modalmsg: prevState.modalmsg + `Found ${tokenIds.length} token(s) in your wallet for this milestone. Checking realisation status...\n` }));

      // Pre-flight: block unwrap only if the milestone is definitely not yet realised.
      // Use milestoneRealisedStatuses (day-level local-time comparison) as the primary gate to
      // avoid false blocks caused by timezone offsets between client clock and on-chain maturity timestamp.
      const milestoneStatus = milestoneRealisedStatuses && milestoneRealisedStatuses[mId];
      if (milestoneStatus !== 'realised') {
        const tokenData = await Promise.all(tokenIds.map(id => contract.methods.payables(id).call()));
        const nowSec = Math.floor(Date.now() / 1000);
        const unrealizedCount = tokenData.filter(p => !p.realized && Number(p.maturityDate) > nowSec).length;
        if (unrealizedCount > 0) {
          throw new Error(
            `${unrealizedCount} of ${tokenIds.length} token(s) in this milestone are not yet realised. ` +
            `Unwrap is only allowed if all your tokens for this milestone are realised or their maturity date has passed.`
          );
        }
      }

      this.setState(prevState => ({
        modalmsg: prevState.modalmsg + `All ${tokenIds.length} token(s) are realised. Fetching unwrap parameters...\n`
      }));

      // 5. Fetch amounts + salts from server for only the user's tokens
      const unwrapParamsRes = await DtscfDataService.getUnwrapParams(
        currentProject.smartcontractaddress,
        mId,
        currentProject.blockchain,
        tokenIds,
        currentProject.id
      );
      const { amounts, salts } = unwrapParamsRes.data;

      this.setState(prevState => ({
        modalmsg: prevState.modalmsg + `Got unwrap parameters. Please sign the transaction in MetaMask...\n`
      }));

      // 6. Execute batchUnwrapToDeposit with only this user's tokens
      await contract.methods.batchUnwrapToDeposit(tokenIds, amounts, salts)
        .send({ from: accounts[0] })
        .on('transactionHash', (hash) => {
          this.setState({
            txHashUrl: this.getExplorerUrl(connectedChainId, hash),
          });
        });
/*
      // 6. Record the request in the backend once the blockchain transaction is confirmed
      await DtscfDataService.approveUnwrapDraftById(
        currentUser.walletaddress,
        currentProject
      );
*/
      this.setState(prevState => ({
        modalmsg: prevState.modalmsg +
          "Success! Tokens unwrapped and deposit released.\n\n" +
          "Please verify in your wallet:\n" +
          "  • The NFT token(s) should no longer appear in your wallet.\n" +
          `  • The underlying cash token (${currentProject.underlyingDSGDsmartcontractaddress}) should have been credited to your wallet.\n`,
        button0text: "Close",
        datachanged: false,
        afterModalClose: () => this.props.router.navigate("/dtscf")
      }));

      // Refresh milestone dropdown — NFTs are gone, remove this milestone from the list
      this.loadUserTokenMilestones();

    } catch (error) {
      console.error("Unwrap Error:", error);
      let errorMsg = error.message || "Transaction failed or was rejected by user.";
      // Strip any trailing JSON object that MetaMask appends to the message
      errorMsg = errorMsg.replace(/\s*[\n\r]+\s*\{[\s\S]*\}\s*$/, '').trim();

      this.setState(prevState => ({
        modalmsg: prevState.modalmsg + "Error: " + errorMsg + "\n",
        button0text: "Close",
        isLoading: false
      }));
    } finally {
      this.setState({ isLoading: false });
    }
  }
/*
  async approveUnwrap() {
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

    console.log("Approving Unwrap ID:", this.state.currentProject.id);
    console.log("Approving Unwrap:", this.state.currentProject);

    await DtscfDataService.approveUnwrapDraftById(this.state.currentProject.id, this.state.currentProject, (log1) => {
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

  } // approveUnwrap()
*/
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
      txHashUrl: null,
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

    if ((this.state.isLoading || !this.state.userReady) && !this.state.showm) {
      return (
        <div className="container mt-4">
          <div className="d-flex align-items-center gap-2">
            <div className="spinner-border spinner-border-sm text-secondary" role="status" />
            &nbsp;<span>Loading ...</span>
          </div>
        </div>
      );
    }

    const { underlyingDSGDList, currentProject, approverList, milestoneRealisedStatuses } = this.state;
    console.log("currentProject: ", currentProject);

    // Recursively filter a contractor tree to entries that have purchases in the selected milestone
    const filterContractorTree = (contractors, selectedMilestone) =>
      contractors.map(con => {
        const relevantPurchases = (con.purchases || []).filter(pur => pur.milestone === selectedMilestone);
        const filteredSubs = filterContractorTree(con.subcontractors || [], selectedMilestone);
        if (relevantPurchases.length > 0 || filteredSubs.length > 0) {
          return { ...con, relevantPurchases, filteredSubcontractors: filteredSubs };
        }
        return null;
      }).filter(c => c !== null);

    // Role-based visibility:
    //  Anchor org / Approver → all tier-1 contractors + their purchases, no sub-contractors shown
    //  Contractor (Maker)    → only their own contractor entry + their sub-tree
    const userOrgId = this.state.currentUser && parseInt(this.state.currentUser.organisation_id);
    const anchorOrgId = parseInt(currentProject.anchor_id);
    const isAnchorOrg = userOrgId && anchorOrgId && userOrgId === anchorOrgId;

    const findInTree = (contractors) => {
      for (const con of contractors) {
        if (parseInt(con.organisation_id) === userOrgId) return true;
        if (findInTree(con.subcontractors || [])) return true;
      }
      return false;
    };
    const isContractorInProject = !this.state.isContractor || findInTree(currentProject.contractors);

    let filteredDisplay = [];
    if (currentProject.selectedMilestone) {
      if (isAnchorOrg || this.state.isApprover) {
        // Anchor sees all tier-1 contractors, purchases only — no sub-contractors
        filteredDisplay = currentProject.contractors
          .map(con => {
            const relevantPurchases = (con.purchases || []).filter(pur => pur.milestone === currentProject.selectedMilestone);
            return relevantPurchases.length > 0
              ? { ...con, relevantPurchases, filteredSubcontractors: [] }
              : null;
          })
          .filter(c => c !== null);
      } else {
        // Contractor: find their own entry anywhere in the tree by organisation_id, show their sub-tree
        const findUserEntry = (contractors) => {
          for (const con of contractors) {
            if (parseInt(con.organisation_id) === userOrgId) return con;
            const found = findUserEntry(con.subcontractors || []);
            if (found) return found;
          }
          return null;
        };
        const userCon = userOrgId ? findUserEntry(currentProject.contractors) : null;
        filteredDisplay = userCon ? filterContractorTree([userCon], currentProject.selectedMilestone) : [];
      }
    }

    // For contractors, limit the dropdown to milestones they have purchases in.
    // Anchor org and Approvers see all milestones.
    const milestonesForUser = (() => {
      let result;
      if (isAnchorOrg || this.state.isApprover || !this.state.isContractor) {
        result = currentProject.milestones;
      } else {
        const userMilestoneIds = new Set();
        const collectFromNode = (con) => {
          (con.purchases || []).forEach(p => {
            if (p.dtscf_milestone_id != null) userMilestoneIds.add(parseInt(p.dtscf_milestone_id));
          });
          (con.subcontractors || []).forEach(sub => collectFromNode(sub));
        };
        const findAndCollect = (contractors) => {
          for (const con of contractors) {
            if (parseInt(con.organisation_id) === userOrgId) { collectFromNode(con); return; }
            findAndCollect(con.subcontractors || []);
          }
        };
        if (userOrgId) findAndCollect(currentProject.contractors);
        result = currentProject.milestones.filter(ms => userMilestoneIds.has(parseInt(ms.id)));
      }
      // Further filter to only milestones where the user currently holds NFTs in their wallet
      if (this.state.milestonesWithUserTokens !== null) {
        result = result.filter(ms => this.state.milestonesWithUserTokens.has(parseInt(ms.id)));
      }
      return result;
    })();

    // Helper to render realised status badge
    const realisedBadge = (milestoneId) => {
      const s = milestoneRealisedStatuses[milestoneId];
      const config = {
        realised:     { bg: '#28a745', color: 'white',  label: 'Realised' },
        partial:      { bg: '#fd7e14', color: 'white',  label: 'Partially Realised' },
        not_realised: { bg: '#ffc107', color: '#333',   label: 'Not Yet Realised' },
        no_tokens:    { bg: '#6c757d', color: 'white',  label: 'No Tokens' },
        error:        { bg: '#dc3545', color: 'white',  label: 'Query Error' },
      };
      if (!s) return null;
      const { bg, color, label } = config[s] || {};
      if (!label) return null;
      return (
        <span style={{ backgroundColor: bg, color, padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', marginLeft: '6px' }}>
          {label}
        </span>
      );
    };

    // Recursively render a contractor row with its purchases and sub-contractors
    const renderContractorRow = (con, tier = 1) => (
      <div key={con.id || con.name} style={{ marginLeft: tier > 1 ? `${(tier - 1) * 20}px` : '0', marginBottom: '6px' }}>
        <strong>{tier > 1 ? `Tier-${tier} Sub-Contractor` : 'Contractor'}: {con.name}</strong>
        <div style={{ fontSize: '0.85rem', color: '#555' }}>Wallet: {con.walletaddress}</div>
        {(con.relevantPurchases || []).length > 0 && (
          <ul style={{ paddingLeft: '0', listStylePosition: 'inside' }}>
            {con.relevantPurchases.map((pur, pIdx) => (
              <li key={pIdx}>Purchase: {pur.description} - Amount: {pur.amount}</li>
            ))}
          </ul>
        )}
        {(con.filteredSubcontractors || []).map(sub => renderContractorRow(sub, tier + 1))}
      </div>
    );
    
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
            { !isContractorInProject ? (
              <div className="col-md-8">
                <p className="text-danger">You do not have access to this project.</p>
                <a href="/dashboard"><button type="button" className="btn btn-sm btn-secondary">Back to Dashboard</button></a>
              </div>
            ) :
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
                  disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
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

      <div className="mt-4 card p-3" style={{ border: '2px solid green' }}>
        {this.state.milestonesWithUserTokens !== null && milestonesForUser.length === 0 ? (
          <p className="text-muted mb-0">You do not have tokens in this project to unwrap.</p>
        ) : (
        <>
          <h5>Select Milestone to unwrap all Tokenised Payables in your wallet for that milestone</h5>
          <div className="form-group">
            <select
              id="milestoneSelect"
              className="form-control"
              value={currentProject.selectedMilestoneId && currentProject.selectedMilestone ? currentProject.selectedMilestoneId + "|" + currentProject.selectedMilestone : ""}
              onChange={this.handleMilestoneChange}
            >
              <option value="">-- Select a Milestone --</option>
              {milestonesForUser.map((ms, index) => {
                const s = milestoneRealisedStatuses[ms.id];
                const statusLabel = s === 'realised' ? ' [Realised]' : s === 'partial' ? ' [Partially Realised]' : s === 'not_realised' ? ' [Not Yet Realised]' : s === 'no_tokens' ? ' [No Tokens]' : '';
                return (
                  <option key={index} value={ms.id + "|" + ms.name}>
                    {ms.name} (Maturity: {moment(ms.enddate).format('DD MMM YYYY')}){statusLabel}
                  </option>
                );
              })}
            </select>
          </div>
        </>
        )}

        {currentProject.selectedMilestone && (() => {
          const selectedMilestoneObj = currentProject.milestones.find(ms => String(ms.id) === String(currentProject.selectedMilestoneId));
          return (
            <div className="mt-3">
              <h6>Contractors & Purchases for: {currentProject.selectedMilestone}</h6>
              {selectedMilestoneObj && (
                <div style={{ color: '#555', marginBottom: '8px', fontSize: '0.9rem' }}>
                  Maturity Date: {moment(selectedMilestoneObj.enddate).format('DD MMM YYYY')}
                  {realisedBadge(selectedMilestoneObj.id)}
                </div>
              )}
              <table className="table table-bordered">
                <tr><td>
                  {filteredDisplay.length > 0 ? (
                    filteredDisplay.map((con, cIdx) => renderContractorRow(con, 1))
                  ) : (
                    <p className="text-muted">No associated contractors or purchases found for this milestone.</p>
                  )}
                </td></tr>
              </table>
            </div>
          );
        })()}
      </div>
{/*
          <div className="form-group">
            <label htmlFor="approver">Approver *</label>
            <select
                value={currentProject.approver}
                onChange={this.onChangeApprover}                         
                className="form-control"
                id="approver"
                disabled={!(this.state.isMaker && (currentProject.status === null || currentProject.status <= 0))}
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

                  this.state.milestonesWithUserTokens !== null && milestonesForUser.length !== 0 &&
                  this.state.isMaker && (currentProject.status === null || currentProject.status <= 0) &&  // creating new draft
                        <button
                        onClick={this.approveUnwrap}
                        type="submit"
                        className="m-3 btn btn-sm btn-primary"
                        disabled={!currentProject.selectedMilestone}
                        >
                          Unwrap Tokens for Selected Milestone
                        </button>
              }

              { 
                  this.state.isMaker && (currentProject.status > 0) &&  // creating draft or amending draft
                        <>
                            <button
                            type="submit"
                            className="m-3 btn btn-sm btn-primary"
                            onClick={this.submitUnwrapDtscf}
                            >
                              Resubmit Unwrap Request
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
                    onClick={currentProject.txntype===2? this.deleteDraft: this.approveUnwrap}
                    >
                      Approve Unwrap Request
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
              <br />
              <br />

              {this.state.isLoading ? <LoadingSpinner /> : null}

              <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/dtscf'} handleProceed2={this.deleteDtscf} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                {this.state.txHashUrl ? (
                  <>
                    {this.state.modalmsg.split('\n').filter(line => line.trim()).map((line, i) => (
                      <p key={i} style={{ fontSize: '1rem', marginBottom: '4px' }}>{line}</p>
                    ))}
                    <p style={{ fontSize: '1rem', marginBottom: '4px' }}>
                      Transaction submitted:{' '}
                      <a href={this.state.txHashUrl} target="_blank" rel="noopener noreferrer">
                        View on Blockchain Explorer ↗
                      </a>
                    </p>
                  </>
                ) : this.state.modalmsg}
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
            }
          </div>
        </div>
    );
  }
}

export default withRouter(DTSCFProjectCreation);