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
    };
  }

  componentDidMount() {
    const id = this.props.router.params.id;
    if (id) {
      CrossChainDvPDataService.findOne(id)
        .then(response => this.setState({ trade: response.data[0] }))
        .catch(e => console.log(e));
    }
  }

  show_loading() { this.setState({ isLoading: true }); }
  hide_loading() { this.setState({ isLoading: false }); }

  displayModal(msg) {
    this.setState({ showm: true, modalmsg: msg });
  }

  hideModal = () => {
    this.setState({ showm: false });
  };

  triggerStartLeg = async () => {
    this.show_loading();
    await CrossChainDvPDataService.executeStartLegById(this.state.trade.id, {})
      .then(response => {
        this.hide_loading();
        this.displayModal(response.data.message);
        CrossChainDvPDataService.findOne(this.state.trade.id).then(r => this.setState({ trade: r.data[0] }));
      })
      .catch(e => {
        this.hide_loading();
        const msg = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
        this.displayModal("Error triggering start leg: " + msg);
      });
  };

  triggerMaturityLeg = async () => {
    this.show_loading();
    await CrossChainDvPDataService.executeMaturityLegById(this.state.trade.id, {})
      .then(response => {
        this.hide_loading();
        this.displayModal(response.data.message);
        CrossChainDvPDataService.findOne(this.state.trade.id).then(r => this.setState({ trade: r.data[0] }));
      })
      .catch(e => {
        this.hide_loading();
        const msg = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
        this.displayModal("Error triggering maturity leg: " + msg);
      });
  };

  refundLeg = async (legType, blockchain) => {
    this.show_loading();
    await CrossChainDvPDataService.refundLegById(this.state.trade.id, { legType, blockchain })
      .then(response => {
        this.hide_loading();
        this.displayModal(response.data.message);
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

            <h5>Start Leg — {LEG_STATUS_LABELS[trade.startlegstatus] || "Not locked"}</h5>
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

            <h5>Maturity Leg — {LEG_STATUS_LABELS[trade.maturitylegstatus] || "Not locked"}</h5>
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
            <Modal showm={this.state.showm} handleCancel={this.hideModal} button0text="OK">
              {this.state.modalmsg}
            </Modal>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(CrossChainDvPTransact);
