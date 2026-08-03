import React, { Component } from "react";
import CrossChainDvPDataService from "../services/crosschaindvp.service";
import { Link, Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';
import { blockchainName, explorerAddressUrl, LEG_STATUS_LABELS } from "../common/crosschaindvp-constants";

export default class CrossChainDvPList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchName = this.onChangeSearchName.bind(this);
    this.retrieveCrossChainDvP = this.retrieveCrossChainDvP.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveCrossChainDvP = this.setActiveCrossChainDvP.bind(this);
    this.searchName = this.searchName.bind(this);

    this.state = {
      crosschaindvp: [],
      currentCrossChainDvP: null,
      isMaker: false,
      isChecker: false,
      isApprover: false,

      currentIndex: -1,
      searchName: "",
      modal: {
        showm: false,
        modalmsg: "",
        button1text: undefined,
        button2text: undefined,
        button0text: undefined,
      }
    };
  }

  onChangeSearchName(e) {
    this.setState({ searchName: e.target.value });
  }

  retrieveCrossChainDvP() {
    CrossChainDvPDataService.getAll()
      .then(response => {
        this.setState({ crosschaindvp: response.data });
      })
      .catch(e => {
        console.log(e);
      });
  }

  refreshList() {
    this.retrieveCrossChainDvP();
    this.setState({ currentCrossChainDvP: null, currentIndex: -1 });
  }

  setActiveCrossChainDvP(crosschaindvp, index) {
    this.setState({ currentCrossChainDvP: crosschaindvp, currentIndex: index });
  }

  searchName() {
    this.setState({ currentCrossChainDvP: null, currentIndex: -1 });

    CrossChainDvPDataService.findByName(this.state.searchName)
      .then(response => {
        this.setState({ crosschaindvp: response.data });
      })
      .catch(e => {
        console.log(e);
      });
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user) this.setState({ redirect: "/login" });
    this.setState({ currentUser: user, userReady: true });

    this.retrieveCrossChainDvP();

    let ismaker = user.opsrole.find((el) =>
      el.opsrole.name.toUpperCase() === "MAKER" && el.transactionType.toUpperCase() === "CROSSCHAINDVP"
    );
    this.setState({ isMaker: (ismaker === undefined ? false : true) });

    let ischecker = user.opsrole.find((el) =>
      el.opsrole.name.toUpperCase() === "CHECKER" && el.transactionType.toUpperCase() === "CROSSCHAINDVP"
    );
    this.setState({ isChecker: (ischecker === undefined ? false : true) });

    let isapprover = user.opsrole.find((el) =>
      el.opsrole.name.toUpperCase() === "APPROVER" && el.transactionType.toUpperCase() === "CROSSCHAINDVP"
    );
    this.setState({ isApprover: (isapprover === undefined ? false : true) });
  }

  hideModal = () => {
    this.setState({ showm: false });
  };

  shorten(s) {
    return (s.substring(0, 6) + "..." + s.slice(-3));
  }

  SGTConverter = (datetime1, formatType = 'datetime') => {
    const formatter = new Intl.DateTimeFormat('en-SG', {
      timeZone: 'Asia/Singapore',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const parts = formatter.formatToParts(new Date(datetime1));
    const getPart = (type) => parts.find(p => p.type === type)?.value;
    const year = getPart('year'), month = getPart('month'), day = getPart('day'), hour = getPart('hour'), minute = getPart('minute');
    if (formatType === 'date') return `${year}-${month}-${day}`;
    if (formatType === 'time') return `${hour}:${minute}`;
    return `${year}-${month}-${day} ${hour}:${minute}`;
  };

  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { searchName, crosschaindvp } = this.state;

    return (
      <div className="container">
        {(this.state.userReady) ?
          <div>
            <header className="jumbotron col-md-8">
              <h3>
                <strong>Cross Chain DvP { (this.state.isMaker ? "(Maker)" : (this.state.isChecker ? "(Checker)" : (this.state.isApprover ? "(Approver)" : null))) }</strong>
              </h3>
            </header>
          </div> : null}

        <div className="list row">
          <div className="col-md-8">
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name"
                value={searchName}
                onChange={this.onChangeSearchName}
              />
              <div className="input-group-append">
                <button className="btn btn-outline-secondary" type="button" onClick={this.searchName}>
                  Search
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-12">
            <table style={{ border: "1px solid" }}>
              {(crosschaindvp.length > 0) ?
                <tr>
                  <th style={{ whiteSpace: "nowrap" }}>Trade Name</th>
                  <th>Counter Party 1</th>
                  <th>Counter Party 2</th>
                  <th>Amount 1</th>
                  <th>Amount 2</th>
                  <th>Blockchain 1</th>
                  <th>Blockchain 2</th>
                  <th style={{ whiteSpace: "nowrap" }}>Start Date</th>
                  <th style={{ whiteSpace: "nowrap" }}>Maturity Date</th>
                  <th>Start Leg</th>
                  <th>Maturity Leg</th>
                  <th>View Details</th>
                  <th>Set Allowance</th>
                  <th>Action</th>
                </tr>
                : null}
              {crosschaindvp && crosschaindvp.length > 0 &&
                crosschaindvp.map((trade, index) => (
                  <tr key={trade.id}>
                    <td>{trade.name}</td>
                    <td>{this.shorten(trade.counterparty1)}</td>
                    <td>{this.shorten(trade.counterparty2)}</td>
                    <td>{trade.amount1.toLocaleString("en-US")}</td>
                    <td>{trade.amount2.toLocaleString("en-US")}</td>
                    <td>{blockchainName(trade.blockchain)}</td>
                    <td>{blockchainName(trade.blockchain2)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{(trade.startdatetime.split("T")[0] !== trade.enddatetime.split("T")[0] ? this.SGTConverter(trade.startdatetime, "date") : this.SGTConverter(trade.startdatetime))}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{(trade.startdatetime.split("T")[0] !== trade.enddatetime.split("T")[0] ? this.SGTConverter(trade.enddatetime, "date") : this.SGTConverter(trade.enddatetime))}</td>
                    <td>{LEG_STATUS_LABELS[trade.startlegstatus] || "Not locked"}</td>
                    <td>{LEG_STATUS_LABELS[trade.maturitylegstatus] || "Not locked"}</td>
                    <td>
                      <Link to={"/xchaindvpcheckapprove/" + trade.draftcrosschaindvpid}>
                        <button className="m-3 btn btn-sm btn-primary">View</button>
                      </Link>
                    </td>
                    <td>
                      <a href={window.location.origin + "/xchaindvpsetallowance/" + trade.id} target="_blank" rel="noreferrer">Set Allowance <i className='bx bx-link-external'></i></a>
                    </td>
                    <td>
                      <Link to={"/xchaindvptransact/" + trade.id} className="badge badge-warning">
                        {this.state.isMaker ? "Trigger Leg" : ""}
                      </Link>
                    </td>
                  </tr>
                ))}
            </table>

            {
              this.state.isMaker ?
                <Link to={"/xchaindvpcheckapprove/0/"}>
                  <button className="m-3 btn btn-sm btn-primary">Create Cross Chain DvP</button>
                </Link>
                : null
            }
            <br /><br />

            <Modal showm={this.state.showm} handleProceed1={null} handleCancel={this.hideModal} handleProceed2={null} button1text={this.state.button1text} button2text={this.state.button2text} button0text={this.state.button0text}>
              {this.state.modalmsg}
            </Modal>
          </div>
        </div>
      </div>
    );
  }
}
