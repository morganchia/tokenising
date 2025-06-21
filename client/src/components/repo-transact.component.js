import React, { Component } from "react";
import RepoDataService from "../services/repo.service.js";
import CampaignDataService from "../services/campaign.service.js";
import BondDataService from "../services/bond.service.js";
import RecipientDataService from "../services/recipient.service.js";
import UserOpsRoleDataService from "../services/user_opsrole.service.js";
import { withRouter } from '../common/with-router.js';
import AuthService from "../services/auth.service.js";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";
import moment from 'moment';
import Web3 from 'web3'
import repoContract_jsonData from '../abis/ERC20TokenRepo.abi.json';


function getToday() {
  const today = new Date();
  return moment(today).format('YYYY-MM-DD')
}

function getTodayTime() {
  const today = new Date();
  return moment(today).format('YYYY-MM-DD HH:mm:ss')
}

class Repo extends Component {
  constructor(props) {
    super(props);
    this.getRepo = this.getRepo.bind(this);
    this.approveRepo = this.approveRepo.bind(this);
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
        id: 0,    // 0 for new repo draft
        name: "",
//        description: "",
        underlyingTokenID1: "",
        underlyingTokenID2: "",
        blockchain: "",
        smartcontractaddress:"",
        smartcontractaddress1:"",
        smartcontractaddress2:"",
        counterpartyname: "",
        counterparty1: "",
        counterparty2: "",
        amount1: "",
        amount2: "",
        tradedate: getToday(),
        startdate: getToday(),
        enddate: getToday(),
        starttime: "00:00:00",
        endtime: "00:00:00",
        securityLB: "",
        reportype: "",
        nominal: "",
        cleanprice: "",
        dirtyprice: "",
        haircut: "",
        startamount: "",
        reporate: "",
        interestamount: "",
        daycountconvention: "",
        currency: "",
        bondisin: "",

        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedrepoid: null,
        actionby: "",
        name_changed: 0,
//        description_changed: 0,
        startdate_changed: 0,
        enddate_changed: 0,
        starttime_changed: 0,
        endtime_changed: 0,
        underlyingTokenID1_changed: 0,
        underlyingTokenID2_changed: 0,
        smartcontractaddress_changed: 0,
        smartcontractaddress1_changed: 0,
        smartcontractaddress2_changed: 0,
        blockchain_changed: 0,
        counterparty1_changed: 0,
        counterparty2_changed: 0,
        amount1_changed: 0,
        amount2_changed: 0,
      },

      originalRepo: {
        id: null,
        name: "",
//        description: "",
        underlyingTokenID1: "",
        underlyingTokenID2: "",
        smartcontractaddress:"",
        smartcontractaddress1:"",
        smartcontractaddress2:"",
        blockchain: "",
        securityLB: "",
        repotype: "",
        nominal: "",
        cleanprice: "",
        dirtyprice: "",
        haircut: "",
        startamount: "",
        reporate: "",
        interestamount: "",
        daycountconvention: "",
        currency: "",
        bondisin: "",
        counterpartyname: "",
        counterparty1: "",
        counterparty2: "",
        amount1: "",
        amount2: "",
        tradedate: getToday(),
        startdate: getToday(),
        enddate: getToday(),
        starttime: "00:00:00",
        endtime: "00:00:00",
  
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedrepoid: null,
        actionby: "",
        name_original: "",
//        description_original: "",
        startdate_original: "",
        enddate_original: "",
        counterparty1_original: "",
        counterparty2_original: "",
        amount1_original: "",
        amount2_original: "",
      },

      connectedAccount: "",
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

    let ismaker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "MAKER");
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "CHECKER");
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "APPROVER");
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

    this.getRepo(user, this.props.router.params.id);
    this.getAllUnderlyingAssets();
    this.getAllCounterpartys();
    this.retrieveAllMakersCheckersApprovers();

    /*
    const loadWeb3 = async () => {
      if (window.ethereum) {
        //if (window.web3 === "" || window.web3 === null || window.web3 === undefined) {
          window.web3 = new Web3(window.ethereum);
        //}

        this.refreshData();
      }
      else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider)
      }
      else {
        window.alert('Non-Ethereum browser detected. Please connect using MetaMask or EIP-1193 compatible wallet.')
        //setWalleterror( true );
        this.setState({ ...this.state, walleterror:true });
      }

      this.setupMetaMaskAccountListener();
    }
    
    const loadBlockchainData = async () => {
      const web3 = window.web3
      const networkId = await web3.eth.net.getId()
      if (networkId !== 4 && networkId !== 3 && networkId !== 80001 && networkId !== 137) {
        //setWalleterror( true );
        this.setState({ ...this.state, walleterror:true });
      }
    };
  
    const load = async () => {
      await loadWeb3()
      await loadBlockchainData()
    };
    load();
    */
  }

  refreshData = async () => {
    try {
      const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
      });

      this.setState({ ...this.state, connectedAccount: accounts[0] });

      console.log(accounts);
      console.log("ConnectedAccount:", accounts[0]);

    } catch (error) {
        console.log(error)
    }
  } // refreshData
  
  setupMetaMaskAccountListener = () => {
    const ethereum = window.ethereum;

    // Check if MetaMask is installed
    if (typeof ethereum !== 'undefined') {
      // Handler for account changes
      this.handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          // Account has been changed, you can refresh the page, or update state here
          console.log('Selected account changed:', accounts[0]);
          // Refresh the page
          this.refreshData();
          //window.location.reload();
          // Or you could update the component's state to reflect the account change
        }
      };

      ethereum.on('accountsChanged', this.handleAccountsChanged);
    }
  } // setupMetaMaskAccountListener

  componentWillUnmount() {
    if (typeof window.ethereum !== 'undefined') {
      // Remove the event listener when the component unmounts
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
    }
  } // componentWillUnmount

  formatNumber2decimals(num) {
    const trimmed = parseFloat(parseFloat(num).toFixed(10)); // remove floating point noise

    // If it's a whole number, show exactly 2 decimal places
    if (trimmed % 1 === 0) {
      return trimmed.toFixed(2);
    }

    // Otherwise, trim to meaningful decimals (up to 10), removing trailing zeros
    return trimmed.toString();
  }

  componentDidUpdate(prevProps, prevState) {
    if (! this.state.status > 0) { // if status is 0, it means the repo is a maker/draft
      const { currentRepo } = this.state;

      let new_startamount = null;

      if ( 
          currentRepo.nominal !== prevState.currentRepo.nominal ||
          currentRepo.dirtyprice !== prevState.currentRepo.dirtyprice ||
          currentRepo.haircut !== prevState.currentRepo.haircut
      ) {

        // compute new_startamount based on changes in nominal, dirtyprice and haircut
        new_startamount = (currentRepo.nominal !== undefined && currentRepo.nominal !=="" && currentRepo.nominal !== null && currentRepo.nominal > 0 ?  
          (currentRepo.haircut !== undefined && currentRepo.haircut !=="" && currentRepo.haircut !== null ?
            ( currentRepo.dirtyprice !== undefined && currentRepo.dirtyprice !=="" && currentRepo.dirtyprice !== null ?
              (Math.round((((1-(currentRepo.haircut / 100))*currentRepo.dirtyprice)* (currentRepo.nominal/100))*100)/100).toFixed(2) : null) : null) : null);

        console.log("componentDidUpdate(): new_startamount:", new_startamount);

        this.setState(prevState => ({
          currentRepo: {
            ...prevState.currentRepo,
            startamount: new_startamount
          }
        }));
      }

      if ( 
          new_startamount != null ||
          currentRepo.startamount !== prevState.currentRepo.startamount ||
          currentRepo.startdate !== prevState.currentRepo.startdate ||
          currentRepo.starttime !== prevState.currentRepo.starttime ||
          currentRepo.enddate !== prevState.currentRepo.enddate ||
          currentRepo.endtime !== prevState.currentRepo.endtime ||
          currentRepo.reporate !== prevState.currentRepo.reporate ||
          currentRepo.currency !== prevState.currentRepo.currency ||
          currentRepo.daycountconvention !== prevState.currentRepo.daycountconvention
      ) {
        // startamount takes the latest value or the one from the currentRepo(if no change)
        let startamount = (new_startamount !== undefined && new_startamount !=="" && new_startamount !== null && new_startamount > 0 ? new_startamount : currentRepo.startamount);

        const startDateTime = new Date(`${currentRepo.startdate}T${currentRepo.starttime}`);
        const endDateTime = new Date(`${currentRepo.enddate}T${currentRepo.endtime}`);

        // compute interestamount based on changes in startamount, startdate, starttime, enddate, endtime, reporate and daycountconvention
        let interestamount =
        (validator.isDate(currentRepo.startdate) && validator.isDate(currentRepo.enddate) && this.isTime(currentRepo.starttime) && this.isTime(currentRepo.endtime) ?
          (currentRepo.reporate !== undefined && currentRepo.reporate !=="" && currentRepo.reporate >= 0 ?
            (startamount !== undefined && startamount !=="" && startamount > 0 ?
              (currentRepo.daycountconvention !== undefined && currentRepo.daycountconvention !=="" && currentRepo.daycountconvention !== 0 ?
                (Math.round(((currentRepo.reporate/100)*startamount*(endDateTime - startDateTime)/(currentRepo.daycountconvention*60*60*24*1000))*100)/100).toFixed(2) : null) : null) : null) : null);

        console.log("componentDidUpdate(): currentRepo.reporate/100:", currentRepo.reporate/100);
        console.log("componentDidUpdate(): startamount:", startamount);
        console.log("componentDidUpdate(): startDateTime:", startDateTime);
        console.log("componentDidUpdate(): endDateTime:", endDateTime);
        console.log("componentDidUpdate(): endDateTime - startDateTime:", endDateTime - startDateTime);
        console.log("componentDidUpdate(): currentRepo.daycountconvention:", currentRepo.daycountconvention);

        console.log("componentDidUpdate(): interestamount:", interestamount);

        this.setState(prevState => ({
          currentRepo: {
            ...prevState.currentRepo,
            interestamount: interestamount
          }
        }));
      }

      if (
        currentRepo.currency !== prevState.currentRepo.currency ||
        currentRepo.securityLB !== prevState.currentRepo.securityLB ||
        currentRepo.nominal !== prevState.currentRepo.nominal
      )
      {
        console.log("componentDidUpdate(): currentRepo.currency:", currentRepo.currency);
        console.log("componentDidUpdate(): currentRepo.securityLB:", currentRepo.securityLB);
        console.log("componentDidUpdate(): currentRepo.nominal:", currentRepo.nominal);

        let startamount = (new_startamount !== undefined && new_startamount !=="" && new_startamount !== null && new_startamount > 0 ? new_startamount : currentRepo.startamount);
        console.log("componentDidUpdate(): startamount:", startamount);

        let lot = 0;
        if (currentRepo.currency === "SGD" || currentRepo.currency === "AUD") {
          // lot = currentRepo.nominal / 250000; // 250000 is the lot size for SGD and AUD
          lot = currentRepo.nominal;
          console.log("componentDidUpdate(): lot:", lot);

          if (currentRepo.securityLB === "B") { // we borrow SGD

            console.log("componentDidUpdate(): Action: Borrow SGD");

            this.setState(prevState => ({
              currentRepo: {
                ...prevState.currentRepo,
                amount1: lot,
                amount2: startamount
              }
            }));
          } else {

            console.log("componentDidUpdate(): Action: Lend SGD");

            this.setState(prevState => ({
              currentRepo: {
                ...prevState.currentRepo,
                amount1: startamount,
                amount2: lot
              }
            }));
          }
        } else if (currentRepo.currency !== ""){
          // lot = currentRepo.nominal / 200000;  // 200000 is the lot size for USD
          lot = currentRepo.nominal;

          if (currentRepo.securityLB === "B") { // we borrow USD

            console.log("componentDidUpdate(): Action: Borrow USD");

            this.setState(prevState => ({
              currentRepo: {
                ...prevState.currentRepo,
                amount1: lot,
                amount2: startamount
              }
            }));
          } else {

            console.log("componentDidUpdate(): Action: Lend USD");

            this.setState(prevState => ({
              currentRepo: {
                ...prevState.currentRepo,
                amount1: startamount,
                amount2: lot
              }
            }));
          }
        }
      }
    } // if maker draft
  }

  getRepo(user, id) {
    console.log(">>>>> id:", id);
    console.log("type id:", typeof id);
    (typeof id === "string" ? id = parseInt(id) : id = id); // convert to int if it is a string

    if (id !== undefined && (typeof id === "number" && id !== 0)) {
      RepoDataService.getAllDraftsByRepoId(id)
        .then(response => {
          response.data[0].actionby = user.username;
          console.log("getRepo(): startDateTime:", response.data[0].startdatetime);
          console.log("getRepo(): endDateTime:", response.data[0].enddatetime);
          console.log("getRepo(): tradedate:", response.data[0].tradedate);
          console.log("getRepo(): clean price:", response.data[0].cleanprice);
          console.log("getRepo(): dirty price:", response.data[0].dirtyprice);
          console.log("getRepo(): nominal:", response.data[0].nominal);
          console.log("getRepo(): start amount:", response.data[0].startamount);
          console.log("getRepo(): interest:", response.data[0].interestamount);

          this.setState({
            currentRepo: {
              ...response.data[0],
              startdate: (response.data[0].startdatetime !== undefined && response.data[0].startdatetime !== null ? response.data[0].startdatetime.split("T")[0]: "0000-00-00"),
              starttime: (response.data[0].startdatetime !== undefined && response.data[0].startdatetime !== null ? response.data[0].startdatetime.split("T")[1].split(".")[0]: "00:00:00"),
              enddate: (response.data[0].enddatetime !== undefined && response.data[0].enddatetime !== null ? response.data[0].enddatetime.split("T")[0]: "0000-00-00"),
              endtime: (response.data[0].enddatetime !== undefined && response.data[0].enddatetime !== null ? response.data[0].enddatetime.split("T")[1].split(".")[0]: "00:00:00"),
              tradedate: (response.data[0].tradedate !== undefined && response.data[0].tradedate !== null ? response.data[0].tradedate.split("T")[0]: "0000-00-00"),
              repotype: (response.data[0].securityLB === "B" ? "repo" : (response.data[0].securityLB === "L" ? "reverserepo" : "")),
              cleanprice: this.formatNumber2decimals(response.data[0].cleanprice),
              dirtyprice: this.formatNumber2decimals(response.data[0].dirtyprice),
            },
          });
          console.log("Response from getAllDraftsByRepoId(id):",response.data[0]);

          this.setState({ isNewRepo : (response.data[0].smartcontractaddress === "" || response.data[0].smartcontractaddress === null) });
        }) 
        .catch(e => {
          console.log("Error from getAllDraftsByRepoId(id):", e);
          alert("Error: " + e.response.data.message);
        }
      );
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

      BondDataService.getAll()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            BondList: [ { id:-1, name:""}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            BondList: [first_array_record].concat(response.data)
          });
        }
        console.log("Response data from retrieveBond() BondDataService.getAll:", response.data);
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

  isTime(time1) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    return timeRegex.test(time1);
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
        this.displayModal("The Repo smart contract is approved, executed successfully"+ (typeof(response.data.smartcontractaddress)!=="undefined" && response.data.smartcontractaddress!==null && response.data.smartcontractaddress!==""? " and deployed at "+response.data.smartcontractaddress+". \n\nYou can start transacting using the Repo smart contract now.": "."), "OK", null, null, null);
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

  triggerStartRepo = async () => {
    const web3 = window.web3;
    const repo_abi =  JSON.parse(JSON.stringify(repoContract_jsonData));
    const repoContract = new web3.eth.Contract(repo_abi, this.state.currentRepo.smartcontractaddress);
    const connectedAccount = this.state.connectedAccount;    
        
    try { // try 0

      await repoContract.methods.startTrade(1).send({  // executing via Metamask's private key hence need user to approve via Metamask
          from: connectedAccount
        },
        (err, result) => {
          if(err) {
            this.displayModal("Error encountered: "+ err.message , null, null, null, "OK");
            console.log("Error executing startTrade(1): "+ err);
            return;
          } else {
            console.log("Transaction executed! Txn hash / Account address: "+ result);
          }
        }      
      ).on('receipt', async (data1) => {
        console.log("Starting Repo trade (Leg1) - Return values from Receipt of approve(): ", data1.events.Approval.returnValues);
      });

    } // try 0
    catch(err){ // approve()
      console.log("Error executing startTrade(1) in Metamask: ", err);

      var errMsg = err.message;
      if (errMsg.includes("User denied transaction signature")) {
        errMsg = "You have denied the transaction signature in Metamask. Please try again.";
      } else if (errMsg.includes("Execution prevented because the circuit breaker is open")) {
        errMsg = "Execution prevented because Metamask internal error, please restart Metamask and try again later.";
      } else if (errMsg.includes("Insufficient token")) {
        errMsg = "You have insufficient tokens in your wallet.";
      }
      this.displayModal("Error executing startTrade(1) in Metamask: "+errMsg , null, null, null, "OK");
    } // try 0
  }

  triggerMatureRepo = () => {
    
  }
  
  render() {
    const { underlyingDSGDList, BondList, recipientList, currentRepo, checkerList, approverList } = this.state;
    console.log("Render underlyingDSGDList:", underlyingDSGDList);
    console.log("Render BondList:", BondList);
    console.log("Render recipientList:", recipientList);
    console.log("Render currentRepo:", currentRepo);

    try {
      return (
        <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>Execute Repo</strong>
            </h3>
          </header>

        </div>: null}

                <div className="edit-form list-row">
                  <h4></h4>
                  <div className="col-md-8">

                  <form autoComplete="off">
                    <div className="form-group">
                      <label htmlFor="name">Repo Smart Contract Name*</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        maxLength="45"
                        value={currentRepo.name}
                        disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        />
                    </div>
{/*
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <input
                      type="text"
                      className="form-control"
                      id="description"
                      maxLength="255"
                      required
                      value={currentRepo.description}
                      name="description"
                      autoComplete="off"
                      disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                      />
                  </div>
*/}
                    <table style={{border : '0px solid blue', width: '100%', backgroundColor: '#ffffff'}}>
                    <tr>
                      <td style={{border : '0', margin: '0px', padding: '0px'}}>
                        <div className="form-group">
                          <label htmlFor="startdate">Start Date*</label>
                          <input
                            type="date"
                            className="form-control"
                            id="startdate"
                            required
                            value={currentRepo.startdate}
                            name="startdate"
                            autoComplete="off"
                            disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                            />
                        </div>
                      </td>
                      <td style={{border : '0'}}>
                      { currentRepo.startdate === currentRepo.enddate?
                        <div className="form-group">
                          <label htmlFor="starttime">Start Time*</label>
                          <input
                            type="time"
                            className="form-control"
                            id="starttime"
                            required
                            value={currentRepo.starttime}
                            name="starttime"
                            autoComplete="off"
                            disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                            />
                        </div>
                      : null}
                      </td>
                      </tr>
                    <tr>
                      <td style={{border : '0', backgroundColor: 'white', margin: '0px', padding: '0px'}}>
                        <div className="form-group">
                          <label htmlFor="enddate">Maturity Date*</label>
                          <input
                            type="date"
                            className="form-control"
                            id="enddate"
                            required
                            value={currentRepo.enddate}
                            name="enddate"
                            autoComplete="off"
                            disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                            />
                        </div>
                      </td>
                      <td style={{border : '0', backgroundColor: 'white'}}>
                        { currentRepo.startdate === currentRepo.enddate?
                        <div className="form-group">
                          <label htmlFor="endtime">Maturity Time*</label>
                          <input
                            type="time"
                            className="form-control"
                            id="endtime"
                            required
                            value={currentRepo.endtime}
                            name="endtime"
                            autoComplete="off"
                            disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                            />
                        </div>
                        :null}
                      </td>
                      </tr>
                    </table>

                  <label htmlFor="datafield1_name">Start Repo (1st Leg)</label>
                  <table style={{border : '1px solid blue', width: '100%', backgroundColor: '#ffffff'}}>
                  <tr>
                    <td style={{border : '0'}}>
                      <div className="form-group">
                        <label htmlFor="amount1"><small>Counterparty 1 {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B'?'Bond Lot' : currentRepo.securityLB === 'L'?'Cash' : null)} amount</small></label>
                        <input
                          type="number"
                          className="form-control"
                          id="amount1"
                          min="0"
                          step="1"
                          required
                          value={currentRepo.amount1}
                          name="amount1"
                          autoComplete="off"
                          disabled={true}
                        />
                      </div>
                    </td>
                    <td style={{border : '0'}}>
                      vs
                    </td>
                    <td style={{border : '0'}}>
                    <div className="form-group">
                        <label htmlFor="amount2"><small>Counterparty 2 {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B'?'Cash' : currentRepo.securityLB === 'L'?'Bond Lot' : null)} amount</small></label>
                        <input
                          type="number"
                          className="form-control"
                          id="amount2"
                          min="0"
                          step="1"
                          required
                          value={currentRepo.amount2}
                          name="amount2"
                          autoComplete="off"
                          disabled={true}
                        />
                      </div>
                    </td>
                    </tr>
                    <tr>
                      <td style={{border : '0', backgroundColor: '#ffffff'}}>
                        <button
                          type="submit"
                          className="m-3 btn btn-sm btn-primary"
                          onClick={this.triggerStartRepo()}
                        >
                          Trigger Start Repo
                        </button> 
                      </td>
                    </tr>
                    </table>
                    <br/>


                  <label htmlFor="datafield1_name">Mature Repo (2nd Leg)</label>
                  <table style={{border : '1px solid blue', width: '100%'}}>
                  <tr>
                    <td style={{border : '0'}}>
                      <div className="form-group">
                        <label htmlFor="amount2"><small>Counterparty 1 {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B'?'Cash amount(with interest)' : (currentRepo.securityLB === 'L'?'Bond Lot amount' : null))}</small></label>
                        <input
                          type="number"
                          className="form-control"
                          id="amount2"
                          min="0"
                          step="1"
                          required
                          value={currentRepo.securityLB === 'B'? (parseFloat(currentRepo.amount2) + parseFloat(currentRepo.interestamount)).toFixed(2) : currentRepo.amount1currentRepo.amount2}
                          name="amount2_leg2"
                          autoComplete="off"
                          disabled={true}
                        />
                      </div>
                    </td>
                    <td style={{border : '0'}}>
                      vs
                    </td>
                    <td style={{border : '0'}}>
                    <div className="form-group">
                        <label htmlFor="amount1"><small>Counterparty 2 {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B'?'Bond Lot amount' : (currentRepo.securityLB === 'L'?'Cash amount(with interest)' : null))}</small></label>
                        <input
                          type="number"
                          className="form-control"
                          id="amount1"
                          min="0"
                          step="1"
                          required
                          value={currentRepo.securityLB === 'L'? (parseFloat(currentRepo.amount1) + parseFloat(currentRepo.interestamount)).toFixed(2) : currentRepo.amount1}
                          name="amount1_leg2"
                          autoComplete="off"
                          disabled={true}
                        />
                      </div>
                    </td>
                    </tr>
                    <tr>
                      <td style={{border : '0', backgroundColor: '#ffffff'}}>
                        <button
                          type="submit"
                          className="m-3 btn btn-sm btn-primary"
                          onClick={()=> {
                              this.triggerMatureRepo()
                            }
                          }
                        >
                          Trigger Mature Repo
                        </button> 
                      </td>
                    </tr>

                    </table>
                    <br/>

                    { currentRepo.smartcontractaddress !== "" && currentRepo.smartcontractaddress !== null ?
                      <div className="form-group">
                        <label htmlFor="name">Smart Contract Address</label>
                        <input
                          type="text"
                          className="form-control"
                          id="smartcontractaddress"
                          maxLength="45"
                          value={currentRepo.smartcontractaddress}
                          required
                          disabled={true}
                          />
                      </div> 
                    : null 
                    }

                    <div className="form-group">
                      <label htmlFor="tradedate">Trade Date*</label>
                      <input
                        type="date"
                        className="form-control"
                        id="tradedate"
                        required
                        value={currentRepo.tradedate}
                        name="tradedate"
                        autoComplete="off"
                        disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        />
                    </div>

                  <div className="form-group">
                    <label htmlFor="bondisin">Bond ISIN*</label>
                    <input
                      type="text"
                      className="form-control"
                      id="bondisin"
                      required
                      value={currentRepo.bondisin}
                      name="bondisin"
                      autoComplete="off"
                      disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                      />
                  </div>
                  <div className="form-group">
                    <label htmlFor="securityLB">Security L/B*</label>
                    <select
                          className="form-control"
                          id="securityLB"
                          disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        >
                          <option >   </option>
                          <option value="B"  selected={currentRepo.securityLB === "B"}>Borrow</option>
                          <option value="L" selected={currentRepo.securityLB === "L"}>Lend</option>
                        </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="repotype">Repo Type*</label>
                    <select
                          className="form-control"
                          id="repotype"
                          disabled={true}
                        >
                          <option >   </option>
                          <option value="repo"  selected={currentRepo.repotype === "repo"}>Repo</option>
                          <option value="reverserepo" selected={currentRepo.repotype === "reverserepo"}>Reverse Repo</option>
                        </select>
                  </div>
                    <div className="form-group">
                      <label htmlFor="nominal">Nominal*</label>
                      <input
                        type="number"
                        className="form-control"
                        id="nominal"
                        required
                        min="0"
                        value={currentRepo.nominal}
                        name="nominal"
                        autoComplete="off"
                        disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="startamount">Start Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        id="startamount"
                        required
                        min="0"
                        value={currentRepo.startamount}
                        name="startamount"
                        autoComplete="off"
                        disabled={true}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="currency">Currency*</label>
                      <select
                            className="form-control"
                            id="currency"
                            name="currency"
                            disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                          >
                            <option >   </option>
                            <option value="SGD" selected={currentRepo.currency === "SGD"}>SGD</option>
                            <option value="USD" selected={currentRepo.currency === "USD"}>USD</option>
                            <option value="EUR" selected={currentRepo.currency === "EUR"}>EUR</option>
                            <option value="JPY" selected={currentRepo.currency === "JPY"}>JPY</option>
                            <option value="GBP" selected={currentRepo.currency === "GBP"}>GBP</option>
                            <option value="CAD" selected={currentRepo.currency === "CAD"}>CAD</option>
                            <option value="AUD" selected={currentRepo.currency === "AUD"}>AUD</option>
                            <option value="CHF" selected={currentRepo.currency === "CHF"}>CHF</option>
                            <option value="NZD" selected={currentRepo.currency === "NZD"}>NZD</option>
                          </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="interestamount">Interest Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        id="interestamount"
                        required
                        min="0"
                        value={currentRepo.interestamount}
                        name="interestamount"
                        autoComplete="off"
                        disabled={true}
                        />
                    </div>
                    {/*
                    <div className="form-group">
                      <label htmlFor="counterpartyname">Counterparty 2 Name*</label>
                      <input
                        type="text"
                        className="form-control"
                        id="counterpartyname"
                        required
                        value={currentRepo.counterpartyname}
                        name="counterpartyname"
                        autoComplete="off"
                        disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        />
                    </div>
                    */}
{/*  Block chain portion */}

                    <div className="form-group">
                    <label htmlFor="counterparty1">Counterparty 1 Wallet Addr *</label>
                    <select
                          className="form-control"
                          id="counterparty1"
                          disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        >
                          <option value=""> </option>
                          {
                            Array.isArray(recipientList) ?
                            recipientList.map( (d) => {
                                // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                                if (typeof d.id === "number")
                                  return <option value={d.walletaddress} selected={d.walletaddress === currentRepo.counterparty1}>{d.name} ({d.walletaddress})</option>
                                else 
                                  return "";
                              })
                            : null
                          }
                        </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="counterparty2">Counterparty 2 Wallet Addr *</label>
                    <select
                          className="form-control"
                          id="counterparty2"
                          disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        >
                          <option value=""> </option>
                          {
                            Array.isArray(recipientList) ?
                            recipientList.map( (d) => {
                                // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                                if (typeof d.id === "number")
                                  return <option value={d.walletaddress} selected={d.walletaddress === currentRepo.counterparty2}>{d.name} ({d.walletaddress})</option>
                                else 
                                  return "";
                              })
                            : null
                          }
                        </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="name">Counterparty 1 {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B'?'Bond' : currentRepo.securityLB === 'L'?'Cash' : null)} Token*</label>
                    <select
                          className="form-control"
                          id="underlyingTokenID1"
                          disabled={!this.state.isMaker || currentRepo.securityLB === "" || currentRepo.status > 0 || (currentRepo.securityLB !== 'B' && currentRepo.underlyingTokenID2 === "")}
                        >
                          <option value=""> </option>
                          { currentRepo.securityLB === 'B'?
                                <option value="" disabled>--- Bond ---</option>
                          :
                                <option value="" disabled>--- Digital Cash ---</option>
                          }
                          { currentRepo.securityLB === 'B'?
                                  (Array.isArray(BondList) ?
                                  BondList.map( (d) => {
                                    // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                                      if (typeof d.id === "number")
                                        return <option value={d.id} selected={d.id === currentRepo.underlyingTokenID1}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                                      else 
                                        return "";
                                    })
                                  : null)                          
                            :
                                  (Array.isArray(underlyingDSGDList) ?
                                  underlyingDSGDList.map( (d) => {
                                    // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                                    if (typeof d.id === "number" && d.blockchain === currentRepo.blockchain)
                                        return <option value={d.id} selected={d.id === currentRepo.underlyingTokenID1}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                                      else 
                                        return "";
                                    })
                                  : null)
                          }
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="name">Counterparty 2 {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B'?'Cash' : currentRepo.securityLB === 'L'?'Bond' : null)} Token*</label>
                    <select
                          className="form-control"
                          id="underlyingTokenID2"
                          disabled={!this.state.isMaker || currentRepo.securityLB === "" || currentRepo.status > 0 || (currentRepo.securityLB !== 'L' && currentRepo.underlyingTokenID1 === "")}
                        >
                          <option value=""> </option>
                          { currentRepo.securityLB === 'L'?
                                <option value="" disabled>--- Bond ---</option>
                          :
                                <option value="" disabled>--- Digital Cash ---</option>
                          }
                          { currentRepo.securityLB === 'L'?
                                (Array.isArray(BondList) ?
                                BondList.map( (d) => {
                                  // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                                    if (typeof d.id === "number")
                                      return <option value={d.id} selected={d.id === currentRepo.underlyingTokenID2}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                                    else 
                                      return "";
                                  })
                                : null)                          
                            :
                                (Array.isArray(underlyingDSGDList) ?
                                underlyingDSGDList.map( (d) => {
                                  // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                                    if (typeof d.id === "number" && d.blockchain === currentRepo.blockchain)
                                      return <option value={d.id} selected={d.id === currentRepo.underlyingTokenID2}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                                    else 
                                      return "";
                                  })
                                : null)
                          }
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="blockchain">Repo to transact on Blockchain where Bond is Deployed</label>
                    {// use the blockchain where the underlying was deployed
                    }
                    <select
                          className="form-control"
                          id="blockchain"
                          disabled="true"
                        >
                          <option >   </option>
                          <option value="80002"  selected={currentRepo.blockchain === 80002}>Polygon   Testnet Amoy</option>
                          <option value="11155111" selected={currentRepo.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                          <option value="80001"  selected={currentRepo.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                          <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                          <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                          <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                          <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                        </select>
                  </div>

                  </form>

<br/>
                <Link to="/repo">
                <button className="m-3 btn btn-sm btn-secondary">
                  Close page
                </button>
                </Link>


                  {this.state.isLoading ? <LoadingSpinner /> : null}

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/inbox'} handleProceed2={this.deleteRepo} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
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