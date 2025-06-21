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
    this.onChangeName = this.onChangeName.bind(this);
//    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeUnderlying1 = this.onChangeUnderlying1.bind(this);
    this.onChangeUnderlying2 = this.onChangeUnderlying2.bind(this);
    this.onChangeCounterpartyName = this.onChangeCounterpartyName.bind(this);
    this.onChangeCounterParty1 = this.onChangeCounterParty1.bind(this);
    this.onChangeCounterParty2 = this.onChangeCounterParty2.bind(this);
    this.onChangeAmount1 = this.onChangeAmount1.bind(this);
    this.onChangeAmount2 = this.onChangeAmount2.bind(this);
    this.onChangeTradeDate = this.onChangeTradeDate.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.onChangeStartTime = this.onChangeStartTime.bind(this);
    this.onChangeEndTime = this.onChangeEndTime.bind(this);

    this.onChangeBondISIN = this.onChangeBondISIN.bind(this);
    this.onChangeSecurityLB = this.onChangeSecurityLB.bind(this);
    this.onChangeNominal = this.onChangeNominal.bind(this);
    this.onChangeCleanPrice = this.onChangeCleanPrice.bind(this);
    this.onChangeDirtyPrice = this.onChangeDirtyPrice.bind(this);
    this.onChangeHairCut = this.onChangeHairCut.bind(this);
    this.onChangeRepoRate = this.onChangeRepoRate.bind(this);
    this.onChangeCurrency = this.onChangeCurrency.bind(this);
    this.onChangeDayCountConvention = this.onChangeDayCountConvention.bind(this);

    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.onChangeCheckerComments = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
    this.getRepo = this.getRepo.bind(this);
    this.createRepoDraft = this.createRepoDraft.bind(this);
    this.submitRepo = this.submitRepo.bind(this);
    this.acceptRepo = this.acceptRepo.bind(this);
    this.approveRepo = this.approveRepo.bind(this);
    this.rejectRepo = this.rejectRepo.bind(this);
    this.deleteRepo = this.deleteRepo.bind(this);
    this.dropRequest = this.dropRequest.bind(this);
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

    this.getRepo(user, this.props.router.params.id);
    this.getAllUnderlyingAssets();
    this.getAllCounterpartys();
    this.retrieveAllMakersCheckersApprovers();
/*
    const newBlockchain = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(this.state.underlying)).blockchain;
    this.setState({
      blockchain: newBlockchain
    });
*/
  }

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
/*
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
    let newBlockchain = null;
    try {
      newBlockchain = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
    } catch (e) {
      console.log("Error finding underlyingTokenID in underlyingDSGDList:", e);
      try {
        newBlockchain = this.state.BondList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
      } catch (e) {
        console.log("Error finding underlyingTokenID in BondList:", e);
      }
    }
    console.log("New blockchain=", newBlockchain);
    let newSmartContractAddress = null;
    try {
      newSmartContractAddress = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).smartcontractaddress
    } catch (e) {
      console.log("Error finding underlyingTokenID in underlyingDSGDList:", e);
      try {
        newSmartContractAddress = this.state.BondList.find((ee) => ee.id === parseInt(underlyingTokenID)).smartcontractaddress
      } catch (e) {
        console.log("Error finding underlyingTokenID in BondList:", e);
      }
    }
    console.log("New smart contract address=", newSmartContractAddress);
    let newUnderlyingDSGDsmartcontractaddress = null
    try {
      newUnderlyingDSGDsmartcontractaddress = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
    } catch (e) {
      console.log("Error finding underlyingTokenID in underlyingDSGDList:", e);
      try {
        newUnderlyingDSGDsmartcontractaddress = this.state.BondList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
      } catch (e) {
        console.log("Error finding underlyingTokenID in BondList:", e);
      }
    }
    console.log("New underlyingDSGDsmartcontractaddress=", newUnderlyingDSGDsmartcontractaddress);
    let newCampaign = 0;
    try {
      newCampaign = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).campaign;
    } catch (e) {
      console.log("Error finding underlyingTokenID in underlyingDSGDList:", e);
      try {
        newCampaign = this.state.BondList.find((ee) => ee.id === parseInt(underlyingTokenID)).campaign;
      } catch (e) {
        console.log("Error finding underlyingTokenID in BondList:", e);
      }
    }
    console.log("New campaign=", newCampaign);
    
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
*/
  onChangeUnderlying1(e) {
    const underlyingTokenID = e.target.value;
    console.log("New underlying1=", underlyingTokenID);
    let newBlockchain = null;
    if (this.state.currentRepo.securityLB === "B") {
      try {
        newBlockchain = this.state.BondList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
      } catch (e) {
        console.log("Error finding underlyingTokenID in BondList:", e);
      }
    } else {
      newBlockchain = this.state.currentRepo.blockchain; // no change
    }
    console.log("New blockchain=", newBlockchain);
    let newSmartContractAddress = null;
    try {
      newSmartContractAddress = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).smartcontractaddress
    } catch (e) {
      console.log("Error finding underlyingTokenID in underlyingDSGDList:", e);
      try {
        newSmartContractAddress = this.state.BondList.find((ee) => ee.id === parseInt(underlyingTokenID)).smartcontractaddress
      } catch (e) {
        console.log("Error finding underlyingTokenID in BondList:", e);
      }
    }
    console.log("New smart contract address=", newSmartContractAddress);
    let newUnderlyingDSGDsmartcontractaddress = null
    try {
      newUnderlyingDSGDsmartcontractaddress = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
    } catch (e) {
      console.log("Error finding underlyingTokenID in underlyingDSGDList:", e);
      try {
        newUnderlyingDSGDsmartcontractaddress = this.state.BondList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
      } catch (e) {
        console.log("Error finding underlyingTokenID in BondList:", e);
      }
    }
    console.log("New underlyingDSGDsmartcontractaddress=", newUnderlyingDSGDsmartcontractaddress);
    let newCampaign = 0;
    try {
      newCampaign = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).campaign;
    } catch (e) {
      console.log("Error finding underlyingTokenID in underlyingDSGDList:", e);
      try {
        newCampaign = this.state.BondList.find((ee) => ee.id === parseInt(underlyingTokenID)).campaign;
      } catch (e) {
        console.log("Error finding underlyingTokenID in BondList:", e);
      }
    }
    console.log("New campaign=", newCampaign);
    
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
    console.log("New underlying2=", underlyingTokenID);
    let newBlockchain = null;
    if (this.state.currentRepo.securityLB === "L") {
      try {
        newBlockchain = this.state.BondList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
      } catch (e) {
        console.log("Error finding underlyingTokenID in BondList:", e);
      }
    } else {
      newBlockchain = this.state.currentRepo.blockchain; // no change
    }
    console.log("New blockchain=", newBlockchain);
    let newSmartContractAddress = null;
    try {
      newSmartContractAddress = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).smartcontractaddress
    } catch (e) {
      console.log("Error finding underlyingTokenID in underlyingDSGDList:", e);
      try {
        newSmartContractAddress = this.state.BondList.find((ee) => ee.id === parseInt(underlyingTokenID)).smartcontractaddress
      } catch (e) {
        console.log("Error finding underlyingTokenID in BondList:", e);
      }
    }
    console.log("New smart contract address=", newSmartContractAddress);
    let newUnderlyingDSGDsmartcontractaddress = null
    try {
      newUnderlyingDSGDsmartcontractaddress = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
    } catch (e) {
      console.log("Error finding underlyingTokenID in underlyingDSGDList:", e);
      try {
        newUnderlyingDSGDsmartcontractaddress = this.state.BondList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
      } catch (e) {
        console.log("Error finding underlyingTokenID in BondList:", e);
      }
    }
    console.log("New underlyingDSGDsmartcontractaddress=", newUnderlyingDSGDsmartcontractaddress);
    let newCampaign = 0;
    try {
      newCampaign = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).campaign;
    } catch (e) {
      console.log("Error finding underlyingTokenID in underlyingDSGDList:", e);
      try {
        newCampaign = this.state.BondList.find((ee) => ee.id === parseInt(underlyingTokenID)).campaign;
      } catch (e) {
        console.log("Error finding underlyingTokenID in BondList:", e);
      }
    }
    console.log("New campaign=", newCampaign);
    
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

  onChangeCounterpartyName(e) {
    const counterpartyname = e.target.value;

    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        counterpartyname: counterpartyname
      }
    }));
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

  onChangeTradeDate(e) {
    const tradedate = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        tradedate: tradedate,
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
        startdate: startdate,
      }
    }));
  }

  onChangeStartTime(e) {
    const starttime = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        starttime: starttime,
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
        enddate: enddate,
      }
    }));
  }

  onChangeEndTime(e) {
    const endtime = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        endtime: endtime,
      }
    }));
  }

  onChangeBondISIN(e) {
    const bondisin = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        bondisin: bondisin
      }
    }));
  }

  onChangeSecurityLB(e) {
    const securityLB = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        securityLB: securityLB,
        repotype: (securityLB === "B" ? "repo" : (securityLB === "L" ? "reverserepo" : "")),
      }
    }));
  }

  onChangeNominal(e) {
    const nominal = e.target.value;
    
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        nominal: nominal,
      }
    }));
  }

  onChangeCleanPrice(e) {
    const cleanprice = e.target.value;

    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        cleanprice: cleanprice,
      }
    }));
  }

  onChangeDirtyPrice(e) {
    const dirtyprice = e.target.value;

    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        dirtyprice: dirtyprice,
      }
    }));
  }

  onChangeHairCut(e) {
    const haircut = e.target.value;

    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        haircut: haircut,
      }
    }));
  }

  onChangeCurrency(e) {
    const currency = e.target.value;
    this.setState({
      datachanged: true
    });

    const daycountconvention = (() => {
      switch (currency) {
        case "SGD": return 365
        case "AUD": return 365
        case "USD": return 360
        case "CNY": return 360
        case "JPY": return 360
        case "EUR": return 360
        case "GBP": return 360
        case "CHF": return 360
        case "CAD": return 360
        case "NZD": return 360
        default   : return null
      }
    })(); 

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        currency: currency,
        daycountconvention: daycountconvention,
      }
    }));
  }

  onChangeRepoRate(e) {
    const reporate = e.target.value;

    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        reporate: reporate,
      }
    }));
  }

  onChangeDayCountConvention(e) {
    const daycountconvention = e.target.value;

    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentRepo: {
        ...prevState.currentRepo,
        daycountconvention: daycountconvention
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
    /*
    this.setState({
      datachanged: true
    });
  */
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

  async validateForm() {    
      var err = "";

      if (!(typeof this.state.currentRepo.name ==='string' || this.state.currentRepo.name instanceof String)) {
        err += "- Name cannot be empty\n";
      } else if ((this.state.currentRepo.name.trim() === "")) {
        err += "- Name cannot be empty\n"; 
      } else if (this.state.isNewRepo) { // only check if new repo, dont need to check if it is existing repo because surely will have name alrdy
        await RepoDataService.findByNameExact(this.state.currentRepo.name.trim())
        .then(response => {
          console.log("Find duplicate name:",response.data);

          if (response.data.length > 0) {
            err += "- Name of repo is already present (duplicate name)\n";
            console.log("Found repo name (duplicate!):"+this.state.currentRepo.name);
          } else {
            console.log("Didnt find repo name1 (ok no duplicate):"+this.state.currentRepo.name);
          }
        })
        .catch(e => {
          console.log("Didnt find repo name2 (ok no duplicate):"+this.state.currentRepo.name);
          // ok to proceed
        });
      }

          if (! validator.isDate(this.state.currentRepo.tradedate)) {
        err += "- Trade Date is invalid\n";
        console.log("tradedate is invalid");
        console.log("this.state.currentRepo.tradedate:", this.state.currentRepo.tradedate);
      }    
      if (! validator.isDate(this.state.currentRepo.startdate)) {
        err += "- Start Date is invalid\n";
        console.log("start date is invalid");
        console.log("this.state.currentRepo.startdate:", this.state.currentRepo.startdate);
      }
      if (! validator.isDate(this.state.currentRepo.enddate)) {
        err += "- Maturity Date is invalid\n";
        console.log("end date is invalid");
        console.log("this.state.currentRepo.enddate:", this.state.currentRepo.enddate);
      }
      
      if (validator.isDate(this.state.currentRepo.startdate) && validator.isDate(this.state.currentRepo.enddate) && this.state.currentRepo.startdate > this.state.currentRepo.enddate) err += "- Start date cannot be later than End date\n";

      if (!this.isTime(this.state.currentRepo.starttime)) {
        err += "- Start Time is invalid\n";
        console.log("start time is invalid: ", this.state.currentRepo.starttime);
      }
      if (!this.isTime(this.state.currentRepo.endtime)) {
        err += "- Maturity Time is invalid\n";
        console.log("maturity time is invalid: ", this.state.currentRepo.endtime);
      }
      const startDateTime = new Date(`${this.state.currentRepo.startdate}T${this.state.currentRepo.starttime}`);
      const endDateTime = new Date(`${this.state.currentRepo.enddate}T${this.state.currentRepo.endtime}`);
      if (startDateTime > endDateTime) {
        console.log("Start date and time is later than Maurity date and time");
        err += "- Start date and time cannot be later than Maurity date and time\n";
      }
      console.log("start date:'"+this.state.currentRepo.startdate+"'");
      console.log("end date:'"+this.state.currentRepo.enddate+"'");
      console.log("Start > End? "+ (this.state.currentRepo.startdate > this.state.currentRepo.enddate));
          
      // dont need t check description, it can be empty
      if (this.state.currentRepo.counterpartyname === "") err += "- Counterparty name cannot be empty\n";
      if (this.state.currentRepo.underlyingTokenID1 === "") err += "- Our "+ (this.state.currentRepo.securityLB !== "" && this.state.currentRepo.securityLB === 'B'?'Bond ' : this.state.currentRepo.securityLB === 'L'?'Cash ' : " ") +"token cannot be empty\n";
      if (this.state.currentRepo.underlyingTokenID2 === "") err += "- Counterparty "+ (this.state.currentRepo.securityLB !== "" && this.state.currentRepo.securityLB === 'B'?'Cash ' : this.state.currentRepo.securityLB === 'L'?'Bond ' : " ") + "token cannot be empty\n";

      if (parseInt(this.state.currentRepo.nominal) <=  0) err += "- Nominal must be more than zero\n";
      if (parseInt(this.state.currentRepo.cleanprice) <=  0) err += "- Clean Price must be more than zero\n";
      if (parseInt(this.state.currentRepo.dirtyprice) <=  0) err += "- Dirty Price must be more than zero\n";
      if (this.state.currentRepo.currency === "") err += "- Currency cannot be empty\n";
      if (this.state.currentRepo.daycountconvention === "") err += "- Day Count Convention cannot be empty\n";
      if (this.state.currentRepo.counterparty1 === "") err += "- Our Wallet Address cannot be empty\n";
      if (this.state.currentRepo.counterparty2 === "") err += "- Counterparty Wallet Address cannot be empty\n";

      if (this.state.currentRepo.amount1 === "") err += "- Amount 1 cannot be empty\n";
      if (this.state.currentRepo.amount2 === "") err += "- Amount 2 cannot be empty\n";
      if (parseInt(this.state.currentRepo.amount1) <=  0) err += "- Amount 1 must be more than zero\n";
      if (parseInt(this.state.currentRepo.amount2) <=  0) err += "- Amount 2 must be more than zero\n";

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

      if (err !=="" ) {
        err = "Form validation issues found:\n"+err;
        //alert(err);
        this.displayModal(err, null, null, null, "OK");
        err = ""; // clear var
        return false;
      }
      return true;
  }

  async createRepoDraft() {  // for Maker

    // Trade date   : 20250514
    // Start date   : 20250516
    // Maturity date: 20250523 
    // Bond ISIN    : SGXF1234567
    // Security L/B : Borrow / Lend
    // Report Type  : Repo / Reverse Repo
    // Nominal      : $100,000,000
    // Clean Price  : $101.97
    // Dirty Price  : $102.5229891
    // Haircut      : 5%
    // Start Amount : $97,396,839.65
    // Currency     : SGD
    // REPO rate    : 3%
    // Interest amount : 56036.53788
    // Counterparty : OCBC
    // Day count convention: 365

    if (this.state.isMaker) {  // only for Makers
      
        if (await this.validateForm() === true) { 

        console.log("Creating Repo draft this.state.underlyingDSGDList= ", this.state.underlyingDSGDList);
        if (this.state.currentRepo.underlyingTokenID1 < 1000000000) { // DSGD 1 ~ 1000000000,   Bond > 1000000000
          console.log("Creating Repo draft underlyingDSGDsmartcontractaddress1= ", this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.currentRepo.underlyingTokenID1)).smartcontractaddress);
        } else {
          console.log("Creating Repo draft underlyingBondsmartcontractaddress1= ", this.state.BondList.find((e) => e.id === parseInt(this.state.currentRepo.underlyingTokenID1)).smartcontractaddress);
        }

        if (this.state.currentRepo.underlyingTokenID2 < 1000000000) { // DSGD 1 ~ 1000000000,   Bond > 1000000000
          console.log("Creating Repo draft underlyingDSGDsmartcontractaddress2= ", this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.currentRepo.underlyingTokenID2)).smartcontractaddress);
        } else {
          console.log("Creating Repo draft underlyingBondsmartcontractaddress2= ", this.state.BondList.find((e) => e.id === parseInt(this.state.currentRepo.underlyingTokenID2)).smartcontractaddress);
        }

        var data = {

          tradedate          : this.state.currentRepo.tradedate,
          startdatetime      : this.state.currentRepo.startdate+"T"+this.state.currentRepo.starttime,
          enddatetime        : this.state.currentRepo.enddate+"T"+this.state.currentRepo.endtime,
          bondisin           : this.state.currentRepo.bondisin,
          securityLB         : this.state.currentRepo.securityLB,
          nominal            : this.state.currentRepo.nominal,
          cleanprice         : this.state.currentRepo.cleanprice,
          dirtyprice         : this.state.currentRepo.dirtyprice,
          haircut            : this.state.currentRepo.haircut,
          startamount        : this.state.currentRepo.startamount,
          currency           : this.state.currentRepo.currency,
          reporate           : this.state.currentRepo.reporate,
          interestamount     : this.state.currentRepo.interestamount,
          counterpartyname   : this.state.currentRepo.counterpartyname,
          daycountconvention : this.state.currentRepo.daycountconvention,

          name               : this.state.currentRepo.name,
  //        description        : this.state.currentRepo.description,
          counterparty1      : this.state.currentRepo.counterparty1,
          counterparty2      : this.state.currentRepo.counterparty2,
          underlyingTokenID1 : this.state.currentRepo.underlyingTokenID1,
          underlyingTokenID2 : this.state.currentRepo.underlyingTokenID2,
          smartcontractaddress1  : (this.state.currentRepo.underlyingTokenID1 < 1000000000 ? this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.currentRepo.underlyingTokenID1)).smartcontractaddress : this.state.BondList.find((e) => e.id === parseInt(this.state.currentRepo.underlyingTokenID1)).smartcontractaddress),
          smartcontractaddress2  : (this.state.currentRepo.underlyingTokenID2 < 1000000000 ? this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.currentRepo.underlyingTokenID2)).smartcontractaddress : this.state.BondList.find((e) => e.id === parseInt(this.state.currentRepo.underlyingTokenID2)).smartcontractaddress),
          blockchain         : this.state.currentRepo.blockchain,

          amount1            : this.state.currentRepo.amount1,
          amount2            : this.state.currentRepo.amount2,

          txntype            : 0,    // create
          maker              : this.state.currentUser.id,
          checker            : this.state.currentRepo.checker,
          approver           : this.state.currentRepo.approver,
          actionby           : this.state.currentUser.username,
          approvedrepoid      : -1,
        };
    
        console.log("Form Validation passed! creating repo smart contract...");
        //alert("Form validation passed! creating repo...");

        console.log("IsLoad=true");
        this.show_loading();  // show progress

        await RepoDataService.draftCreate(data)
        .then(response => {
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();  // hide progress
    
          this.setState({
            id                  : response.data.id,

            tradedate           : response.data.tradedate,
            startdate           : response.data.startdatetime.split("T")[0],  // YYYY-MM-DD
            enddate             : response.data.enddatetime.split("T")[0],    // YYYY-MM-DD
            starttime           : response.data.startdatetime.split("T")[1].split(".")[0], // HH:mm:ss
            endtime             : response.data.enddatetime.split("T")[1].split(".")[0],   // HH:mm:ss
            bondisin            : response.data.bondisin,
            securityLB          : response.data.securityLB,
            nominal             : response.data.nominal,
            cleanprice          : response.data.cleanprice,
            dirtyprice          : response.data.dirtyprice,
            haircut             : response.data.haircut,
            startamount         : response.data.startamount,
            currency            : response.data.currency,
            reporate            : response.data.reporate,
            interestamount      : response.data.interestamount,
            counterpartyname    : response.data.counterpartyname,
            daycountconvention  : response.data.daycountconvention,

            name                : response.data.name,
  //          description         : response.data.description,
            underlyingTokenID1  : response.data.underlyingTokenID1,
            underlyingTokenID2  : response.data.underlyingTokenID2,
            smartcontractaddress1: response.data.smartcontractaddress1,
            smartcontractaddress2: response.data.smartcontractaddress2,
            counterparty1       : response.data.counterparty1,
            counterparty2       : response.data.counterparty2,
            amount1             : response.data.amount1,
            amount2             : response.data.amount2,

            submitted: true,

          });
  //          this.displayModal("Repo draft submitted for review" + (response.data.smartcontractaddress !==""? " with smart contract deployed at "+response.data.smartcontractaddress + ". You can start minting now.": "." ) ,
  //                              "OK", null, null);
          this.displayModal("Repo smart contract creation request submitted for review.", "OK", null, null, null);

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

  }

  async submitRepo() {
    
    if (await this.validateForm()) { 
          console.log("Form Validation passed");
    
          console.log("IsLoad=true");
          this.show_loading();
    
          await RepoDataService.submitDraftById(
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
            this.displayModal("Repo submitted. Routing to checker.", "OK", null, null, null);
          })
          .catch(e => {
            this.hide_loading();
    
            console.log(e);
            console.log(e.message);
            this.displayModal("Repo submit failed.", null, null, null, "OK");
    
            try {
              console.log(e.response.data.message);
              // Need to check draft and approved repo names
              if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
                this.displayModal("The Repo submit failed. The new repo name is already used, please use another name.", null, null, null, "OK");
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
              <strong>{currentRepo.txntype===0?"Create ":(currentRepo.txntype===1?"Update ":(currentRepo.txntype===2?"Delete ":null))}Repo { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
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
                        onChange={this.onChangeName}
                        disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        />
                    </div>
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
                      onChange={this.onChangeDescription}
                      name="description"
                      autoComplete="off"
                      disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                      />
                  </div>
*/}
                    <div className="form-group">
                      <label htmlFor="tradedate">Trade Date*</label>
                      <input
                        type="date"
                        className="form-control"
                        id="tradedate"
                        required
                        value={currentRepo.tradedate}
                        onChange={this.onChangeTradeDate}
                        name="tradedate"
                        autoComplete="off"
                        disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        />
                    </div>
                    <table style={{border : '0px solid blue', width: '100%'}}>
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
                            onChange={this.onChangeStartDate}
                            name="startdate"
                            autoComplete="off"
                            disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                            />
                        </div>
                      </td>
                      <td style={{border : '0'}}>
                        <div className="form-group">
                          <label htmlFor="starttime">Start Time*</label>
                          <input
                            type="time"
                            className="form-control"
                            id="starttime"
                            required
                            value={currentRepo.starttime}
                            onChange={this.onChangeStartTime}
                            name="starttime"
                            autoComplete="off"
                            disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                            />
                        </div>
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
                            onChange={this.onChangeEndDate}
                            name="enddate"
                            autoComplete="off"
                            disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                            />
                        </div>
                      </td>
                      <td style={{border : '0', backgroundColor: 'white'}}>
                        <div className="form-group">
                          <label htmlFor="endtime">Maturity Time*</label>
                          <input
                            type="time"
                            className="form-control"
                            id="endtime"
                            required
                            value={currentRepo.endtime}
                            onChange={this.onChangeEndTime}
                            name="endtime"
                            autoComplete="off"
                            disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                            />
                        </div>
                      </td>
                      </tr>
                    </table>

                  <div className="form-group">
                    <label htmlFor="bondisin">Bond ISIN*</label>
                    <input
                      type="text"
                      className="form-control"
                      id="bondisin"
                      required
                      value={currentRepo.bondisin}
                      onChange={this.onChangeBondISIN}
                      name="bondisin"
                      autoComplete="off"
                      disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                      />
                  </div>
                  <div className="form-group">
                    <label htmlFor="securityLB">Security L/B*</label>
                    <select
                          onChange={this.onChangeSecurityLB}                         
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
                          onChange={this.onChangeRepoType}                         
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
                        onChange={this.onChangeNominal}
                        name="nominal"
                        autoComplete="off"
                        disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cleanprice">Clean Price*</label>
                      <input
                        type="number"
                        className="form-control"
                        id="cleanprice"
                        required
                        min="0"
                        value={currentRepo.cleanprice}
                        onChange={this.onChangeCleanPrice}
                        name="cleanprice"
                        autoComplete="off"
                        disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dirtyprice">Dirty Price*</label>
                      <input
                        type="number"
                        className="form-control"
                        id="dirtyprice"
                        required
                        min="0"
                        value={currentRepo.dirtyprice}
                        onChange={this.onChangeDirtyPrice}
                        name="dirtyprice"
                        autoComplete="off"
                        disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="haircut">Hair Cut %*</label>
                      <input
                        type="number"
                        className="form-control"
                        id="haircut"
                        required
                        min="0"
                        value={currentRepo.haircut}
                        onChange={this.onChangeHairCut}
                        name="haircut"
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
                            onChange={this.onChangeCurrency}                         
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
                      <label htmlFor="daycountconvention">Day Count Convention*</label>
                      <select
                            onChange={this.onChangeDayCountConvention}                         
                            className="form-control"
                            id="daycountconvention"
                            name="daycountconvention"
                            disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                          >
                            <option >   </option>
                            <option value="360" selected={currentRepo.daycountconvention === 360}>360</option>
                            <option value="365" selected={currentRepo.daycountconvention === 365}>365</option>
                          </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="reporate">Repo Rate %*</label>
                      <input
                        type="number"
                        className="form-control"
                        id="reporate"
                        required
                        min="0"
                        value={currentRepo.reporate}
                        onChange={this.onChangeRepoRate}
                        name="reporate"
                        autoComplete="off"
                        disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        />
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
                    <div className="form-group">
                      <label htmlFor="counterpartyname">Counterparty Name*</label>
                      <input
                        type="text"
                        className="form-control"
                        id="counterpartyname"
                        required
                        value={currentRepo.counterpartyname}
                        onChange={this.onChangeCounterpartyName}
                        name="counterpartyname"
                        autoComplete="off"
                        disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
                        />
                    </div>

{/*  Block chain portion */}

                    <div className="form-group">
                    <label htmlFor="counterparty1">Our Wallet Addr *</label>
                    <select
                          onChange={this.onChangeCounterParty1}                         
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
                    <label htmlFor="counterparty2">Counterparty Wallet Addr *</label>
                    <select
                          onChange={this.onChangeCounterParty2}                         
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
                    <label htmlFor="name">Our {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B'?'Bond' : currentRepo.securityLB === 'L'?'Cash' : null)} Token*</label>
                    <select
                          onChange={this.onChangeUnderlying1}                         
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
                    <label htmlFor="name">Counterparty {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B'?'Cash' : currentRepo.securityLB === 'L'?'Bond' : null)} Token*</label>
                    <select
                          onChange={this.onChangeUnderlying2}                         
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
                          onChange={this.onChangeBlockchain}                         
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
                  <label htmlFor="datafield1_name">Exchange Rate between Tokens</label>
                  <table style={{border : '1px solid blue', width: '100%'}}>
                  <tr>
                    <td style={{border : '0'}}>
                      <div className="form-group">
                        <label htmlFor="amount1">Our {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B'?'Bond Lot' : currentRepo.securityLB === 'L'?'Cash' : null)} amount</label>
                        <input
                          type="number"
                          className="form-control"
                          id="amount1"
                          min="0"
                          step="1"
                          required
                          value={currentRepo.amount1}
                          onChange={this.onChangeAmount1}
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
                        <label htmlFor="amount2">Counterparty {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B'?'Cash' : currentRepo.securityLB === 'L'?'Bond Lot' : null)} amount</label>
                        <input
                          type="number"
                          className="form-control"
                          id="amount2"
                          min="0"
                          step="1"
                          required
                          value={currentRepo.amount2}
                          onChange={this.onChangeAmount2}
                          name="amount2"
                          autoComplete="off"
                          disabled={true}
                        />
                      </div>
                    </td>
                    </tr>
                    </table>
                    <br/>

                    <div className="form-group">
                      <label htmlFor="checker">Checker *</label>
                      <select
                            value={currentRepo.checker}
                            onChange={this.onChangeChecker}                         
                            className="form-control"
                            id="checker"
                            disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
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
                        disabled={!this.state.isChecker || currentRepo.id === 0 || currentRepo.status !== 1 }
                        />
                    </div>
                    <div className="form-group">
                      <label htmlFor="approver">Approver *</label>
                      <select
                          value={currentRepo.approver}
                          onChange={this.onChangeApprover}                         
                          className="form-control"
                          id="approver"
                          disabled={!this.state.isMaker || currentRepo.txntype===2 || currentRepo.status > 0}
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
                        disabled={!this.state.isApprover || currentRepo.id === 0 || currentRepo.status !== 2 }
                        />
                    </div>
                  </form>


              {  //// buttons!


                  this.state.isMaker && currentRepo.id === 0 &&  // creating new draft
                        <button 
                        onClick={this.createRepoDraft} 
                        type="submit"
                        className="m-3 btn btn-sm btn-primary"
                        >
                          Submit Request
                        </button>
              }
                    
              { 
                  this.state.isMaker && currentRepo.status <= 0 &&  // creating draft or amending draft
                        <>
                            <button
                            type="submit"
                            className="m-3 btn btn-sm btn-primary"
                            onClick={this.submitRepo}
                            >
                              Submit 
                              {
                                (currentRepo.txntype===0? " Create ":
                                (currentRepo.txntype===1? " Update ":
                                (currentRepo.txntype===2? " Delete ":null)))
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
                this.state.isChecker && currentRepo.status === 1 && 
                    <button
                      type="submit"
                      className="m-3 btn btn-sm btn-primary"
                      onClick={this.acceptRepo}
                    >
                      Endorse
                      {
                        (currentRepo.txntype===0? " Create ":
                        (currentRepo.txntype===1? " Update ":
                        (currentRepo.txntype===2? " Delete ":null)))
                      }
                      Request
                    </button> 
              }
              
              {
                    this.state.isApprover && currentRepo.status === 2 &&
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={currentRepo.txntype===2? this.deleteDraft: this.approveRepo}
                    >
                      Approve
                      {
                        (currentRepo.txntype===0? " Create ":
                        (currentRepo.txntype===1? " Update ":
                        (currentRepo.txntype===2? " Delete ":null)))
                      }
                      Request

                    </button> 
                
              }
&nbsp;
              {
                currentRepo.id !== 0 && (this.state.isChecker || this.state.isApprover) && 
                (currentRepo.status === 1 || currentRepo.status === 2) &&   // status <= 2 still in draft and not deployed yet
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-danger"
                    onClick={this.rejectRepo}
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
                  <Link to="/repo">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Cancel
                  </button>
                  </Link>
                )
              : 
                <Link to="/repo">
                <button className="m-3 btn btn-sm btn-secondary">
                  Cancel
                </button>
                </Link>
              }  


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