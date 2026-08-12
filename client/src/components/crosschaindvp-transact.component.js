import React, { Component } from "react";
import { withRouter } from '../common/with-router.js';
import CrossChainDvPDataService from "../services/crosschaindvp.service.js";
import { Link } from "react-router-dom";
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";
import { blockchainName, LEG_STATUS_LABELS } from "../common/crosschaindvp-constants";

// Post-approval trigger page. Unlike repo-transact.component.js, there is no
// per-trade contract to connect a wallet to and read from — triggering a leg means
// asking the backend to submit lock() on both of the trade's chains (using the
// backend signer key, same as approveDraftById does for Repo today). The relayer
// quorum (see server/app/relayer/crossChainRepoRelayer.js) then releases funds once
// it independently confirms both locks.
class CrossChainDvPTransact extends Component {
  constructor(props) {
    super(props);
    this.state = {
      trade: null,
      isLoading: false,
      showm: false,
      modalmsg: "",
      logs: [],
      lockResults: null,
      button0text: "OK",
    };
  }

  componentDidMount() {
    const id = this.props.router.params.id;
    if (id) {
      CrossChainDvPDataService.findOne(id)
        .then(response => {
          this.setState({ trade: response.data[0] });
          this.maybeStartPolling();
        })
        .catch(e => console.log(e));
    }
  }

  componentWillUnmount() {
    this.stopPolling();
  }

  // A locked leg is released asynchronously by the relayer quorum (see
  // crossChainRepoRelayer.js), which notifies the backend via a webhook - nothing pushes
  // that update to an already-open tab, so without this the status only ever changes on
  // a manual refresh. Polls only while a leg is actually awaiting release, and stops
  // itself once neither leg is (including once both are released).
  maybeStartPolling = () => {
    const { trade } = this.state;
    const awaitingRelease = trade && (trade.startlegstatus === 1 || trade.maturitylegstatus === 1);
    if (awaitingRelease && !this.pollTimer) {
      this.pollTimer = setInterval(() => {
        CrossChainDvPDataService.findOne(trade.id)
          .then(response => this.setState({ trade: response.data[0] }, this.maybeStartPolling))
          .catch(e => console.log(e));
      }, 15000);
    } else if (!awaitingRelease && this.pollTimer) {
      this.stopPolling();
    }
  };

  stopPolling = () => {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  };

  show_loading() { this.setState({ isLoading: true }); }
  hide_loading() { this.setState({ isLoading: false }); }

  displayModal(msg) {
    this.setState({ showm: true, modalmsg: msg, lockResults: null, button0text: "OK" });
  }

  hideModal = () => {
    this.setState({ showm: false });
  };

  renderLockResults(locks) {
    return (
      <>
        {locks.map((lock, i) => (
          <div key={i} style={{ marginTop: '8px' }}>
            <p style={{ marginBottom: '2px' }}><strong>{blockchainName(lock.chainId)}</strong></p>
            <p style={{ marginBottom: '2px' }}>Escrow contract: {lock.escrowAddress}</p>
            <p style={{ marginBottom: '2px' }}>
              <a href={lock.url} target="_blank" rel="noreferrer" style={{ color: '#4a90e2' }}>
                View transaction on blockchain explorer ↗
              </a>
            </p>
          </div>
        ))}
      </>
    );
  }

  // Opens the modal immediately (before the first LOG: line even arrives) and appends
  // each streamed step into modalmsg live, so the user sees "Checking relayer
  // quorum...", "Validating balances...", "Pulling tokens from..." etc as they happen
  // instead of a blank modal that only appears once the request finally settles.
  runLeg = async (execute, legLabel) => {
    this.setState({ isLoading: true, logs: [], showm: true, modalmsg: "Processing...\n", lockResults: null, button0text: null });
    await execute(this.state.trade.id, {}, log => {
      this.setState(prevState => ({
        logs: [...prevState.logs, log],
        modalmsg: prevState.modalmsg + log + "\n",
      }));
    })
      .then(response => {
        this.hide_loading();
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + response.message + "\n",
          lockResults: response.locks || null,
          button0text: "Close",
        }));
        CrossChainDvPDataService.findOne(this.state.trade.id).then(r => this.setState({ trade: r.data[0] }, this.maybeStartPolling));
      })
      .catch(e => {
        this.hide_loading();
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + `Error triggering ${legLabel}: ` + e.message + "\n",
          button0text: "Close",
        }));
      });
  };

  triggerStartLeg = () => this.runLeg(
    (id, data, onLog) => CrossChainDvPDataService.executeStartLegById(id, data, onLog),
    "start leg"
  );

  triggerMaturityLeg = () => this.runLeg(
    (id, data, onLog) => CrossChainDvPDataService.executeMaturityLegById(id, data, onLog),
    "maturity leg"
  );

  refundLeg = async (legType, blockchain) => {
    this.show_loading();
    await CrossChainDvPDataService.refundLegById(this.state.trade.id, { legType, blockchain })
      .then(response => {
        this.hide_loading();
        this.displayModal(
          <>
            <p>{response.data.message}</p>
            <p style={{ marginBottom: '2px' }}>Escrow contract: {response.data.escrowAddress}</p>
            <p style={{ marginBottom: '2px' }}>
              <a href={response.data.url} target="_blank" rel="noreferrer" style={{ color: '#4a90e2' }}>
                View transaction on blockchain explorer ↗
              </a>
            </p>
          </>
        );
      })
      .catch(e => {
        this.hide_loading();
        const msg = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
        this.displayModal("Error submitting refund: " + msg);
      });
  };

  render() {
    const { trade } = this.state;

    return (
      <div className="container">
        <header className="jumbotron col-md-8">
          <h3><strong>Cross Chain DvP - Trigger Trade Legs</strong></h3>
        </header>

        {!trade ? <p>Loading trade...</p> : (
          <div className="col-md-8">
            <p><strong>Trade:</strong> {trade.name}</p>
            <p><strong>Blockchain 1:</strong> {blockchainName(trade.blockchain)} | <strong>Blockchain 2:</strong> {blockchainName(trade.blockchain2)}</p>

            <h5>Start Leg — {LEG_STATUS_LABELS[trade.startlegstatus] || "Not initiated"}</h5>
            <p>Locks Token1 (Amount {trade.amount1}) from Counterparty1 to Counterparty2 on Blockchain 1, and Token2 (Amount {trade.amount2}) from Counterparty2 to Counterparty1 on Blockchain 2. Both counterparties must have set token allowance to the escrow contract first (see "Set Allowance").</p>
            <button className="m-3 btn btn-sm btn-primary" disabled={trade.startlegstatus >= 1} onClick={this.triggerStartLeg}>
              Trigger Start Leg
            </button>
            <button className="m-3 btn btn-sm btn-outline-danger" onClick={() => this.refundLeg('start', trade.blockchain)}>
              Refund Start Leg (Blockchain 1, after deadline)
            </button>
            <button className="m-3 btn btn-sm btn-outline-danger" onClick={() => this.refundLeg('start', trade.blockchain2)}>
              Refund Start Leg (Blockchain 2, after deadline)
            </button>

            <hr />

            <h5>Maturity Leg — {LEG_STATUS_LABELS[trade.maturitylegstatus] || "Not initiated"}</h5>
            <p>Reverses the exchange at maturity: the cash side repays Start Amount + Interest, the asset side returns the original amount.</p>
            <button className="m-3 btn btn-sm btn-primary" disabled={trade.startlegstatus < 1 || trade.maturitylegstatus >= 1} onClick={this.triggerMaturityLeg}>
              Trigger Maturity Leg
            </button>
            <button className="m-3 btn btn-sm btn-outline-danger" onClick={() => this.refundLeg('maturity', trade.blockchain)}>
              Refund Maturity Leg (Blockchain 1, after deadline)
            </button>
            <button className="m-3 btn btn-sm btn-outline-danger" onClick={() => this.refundLeg('maturity', trade.blockchain2)}>
              Refund Maturity Leg (Blockchain 2, after deadline)
            </button>

            <br /><br />
            <Link to="/xchaindvp"><button className="m-3 btn btn-sm btn-secondary">Back to list</button></Link>

            {this.state.isLoading ? <LoadingSpinner /> : null}
            <Modal showm={this.state.showm} handleCancel={this.hideModal} button0text={this.state.button0text}>
              <>
                {typeof this.state.modalmsg === 'string'
                  ? this.state.modalmsg.split('\n').map((line, i) => (
                      <p key={i} style={{ fontSize: '1rem', marginBottom: '4px' }}>{line}</p>
                    ))
                  : this.state.modalmsg}
                {this.state.lockResults && this.renderLockResults(this.state.lockResults)}
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
        )}
      </div>
    );
  }
}

export default withRouter(CrossChainDvPTransact);
