import React, { Component } from "react";
import CantonDataService from "../services/canton.service";

// Party ids look like "Name::1220abcd..."; show the readable part.
const shortParty = (p) => (p || "").split("::")[0];

const errMsg = (e) => (e.response && e.response.data && e.response.data.message) || e.message;

export default class CantonBond extends Component {
  constructor(props) {
    super(props);
    this.state = {
      health: null,
      parties: [],
      newPartyHint: "",
      viewParty: "",
      holdings: [],
      issue: { issuer: "", owner: "", bondName: "", bondCode: "", faceValue: "1000", couponRate: "0.03", maturityDate: "", quantity: "" },
      transfer: { contractId: "", newOwner: "", amount: "" },
      message: "",
      busy: false,
    };
  }

  componentDidMount() {
    CantonDataService.health()
      .then((r) => this.setState({ health: r.data }))
      .catch((e) => this.setState({ health: { ready: false }, message: errMsg(e) }));
    this.retrieveParties();
  }

  retrieveParties() {
    CantonDataService.listParties()
      .then((r) => this.setState({ parties: r.data }))
      .catch((e) => this.setState({ message: errMsg(e) }));
  }

  retrieveHoldings(party) {
    if (!party) return this.setState({ holdings: [] });
    CantonDataService.listHoldings(party)
      .then((r) => this.setState({ holdings: r.data }))
      .catch((e) => this.setState({ message: errMsg(e) }));
  }

  run(promise, successMsg, after) {
    this.setState({ busy: true, message: "" });
    promise
      .then((r) => {
        this.setState({ message: successMsg(r.data) });
        after && after();
      })
      .catch((e) => this.setState({ message: "Error: " + errMsg(e) }))
      .finally(() => this.setState({ busy: false }));
  }

  allocateParty = (e) => {
    e.preventDefault();
    this.run(CantonDataService.allocateParty(this.state.newPartyHint), (d) => `Allocated party ${d.party}`, () => {
      this.setState({ newPartyHint: "" });
      this.retrieveParties();
    });
  };

  issueBond = (e) => {
    e.preventDefault();
    this.run(CantonDataService.issueBond(this.state.issue), (d) => `Bond issued (update ${d.updateId.slice(0, 16)}...)`,
      () => this.retrieveHoldings(this.state.viewParty));
  };

  transferBond = (e) => {
    e.preventDefault();
    const { transfer, viewParty } = this.state;
    this.run(CantonDataService.transferBond({ ...transfer, owner: viewParty }), (d) => `Transferred (update ${d.updateId.slice(0, 16)}...)`, () => {
      this.setState({ transfer: { contractId: "", newOwner: "", amount: "" } });
      this.retrieveHoldings(viewParty);
    });
  };

  setIssue = (field) => (e) => this.setState({ issue: { ...this.state.issue, [field]: e.target.value } });
  setTransfer = (field) => (e) => this.setState({ transfer: { ...this.state.transfer, [field]: e.target.value } });

  partySelect(value, onChange, placeholder) {
    return (
      <select className="form-control" value={value} onChange={onChange} required>
        <option value="">{placeholder}</option>
        {this.state.parties.map((p) => <option key={p} value={p}>{shortParty(p)}</option>)}
      </select>
    );
  }

  render() {
    const { health, newPartyHint, viewParty, holdings, issue, transfer, message, busy } = this.state;
    const ownedHoldings = holdings.filter((h) => h.owner === viewParty);

    return (
      <div className="container">
        <h4>Canton Bonds</h4>
        <p>
          Network: <b>Canton LocalNet (sandbox)</b>{" "}
          {health && (health.ready
            ? <span className="badge bg-success">ready · v{health.version}</span>
            : <span className="badge bg-danger">not reachable</span>)}
        </p>
        {message && <div className="alert alert-info">{message}</div>}

        <div className="row">
          <div className="col-md-6">
            <h5>Parties</h5>
            <form onSubmit={this.allocateParty} className="d-flex gap-2 mb-3">
              <input className="form-control" placeholder="New party name, e.g. Investor1" value={newPartyHint}
                onChange={(e) => this.setState({ newPartyHint: e.target.value })} required />
              <button className="btn btn-secondary" disabled={busy}>Allocate</button>
            </form>

            <h5>Issue bond</h5>
            <form onSubmit={this.issueBond}>
              <div className="mb-2">{this.partySelect(issue.issuer, this.setIssue("issuer"), "Issuer")}</div>
              <div className="mb-2">{this.partySelect(issue.owner, this.setIssue("owner"), "Investor (owner)")}</div>
              <input className="form-control mb-2" placeholder="Bond name" value={issue.bondName} onChange={this.setIssue("bondName")} required />
              <input className="form-control mb-2" placeholder="Bond code" value={issue.bondCode} onChange={this.setIssue("bondCode")} required />
              <label>Face value</label>
              <input className="form-control mb-2" type="number" min="0" step="any" value={issue.faceValue} onChange={this.setIssue("faceValue")} required />
              <label>Coupon rate (0.03 = 3%)</label>
              <input className="form-control mb-2" type="number" min="0" step="any" value={issue.couponRate} onChange={this.setIssue("couponRate")} required />
              <label>Maturity date</label>
              <input className="form-control mb-2" type="date" value={issue.maturityDate} onChange={this.setIssue("maturityDate")} required />
              <input className="form-control mb-2" type="number" min="0" step="any" placeholder="Quantity" value={issue.quantity} onChange={this.setIssue("quantity")} required />
              <button className="btn btn-primary" disabled={busy}>Issue on Canton</button>
            </form>
          </div>

          <div className="col-md-6">
            <h5>Holdings</h5>
            <div className="mb-2">
              {this.partySelect(viewParty, (e) => { this.setState({ viewParty: e.target.value }); this.retrieveHoldings(e.target.value); }, "View as party")}
            </div>
            <table className="table table-sm">
              <thead><tr><th>Bond</th><th>Owner</th><th>Qty</th><th>Coupon</th><th>Maturity</th></tr></thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.contractId}>
                    <td>{h.bondName} ({h.bondCode})</td>
                    <td>{shortParty(h.owner)}</td>
                    <td>{parseFloat(h.quantity)}</td>
                    <td>{(parseFloat(h.couponRate) * 100).toFixed(2)}%</td>
                    <td>{h.maturityDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {ownedHoldings.length > 0 && (
              <form onSubmit={this.transferBond}>
                <h5>Transfer</h5>
                <select className="form-control mb-2" value={transfer.contractId} onChange={this.setTransfer("contractId")} required>
                  <option value="">Holding</option>
                  {ownedHoldings.map((h) => (
                    <option key={h.contractId} value={h.contractId}>{h.bondCode} · {parseFloat(h.quantity)}</option>
                  ))}
                </select>
                <div className="mb-2">{this.partySelect(transfer.newOwner, this.setTransfer("newOwner"), "New owner")}</div>
                <input className="form-control mb-2" type="number" min="0" step="any" placeholder="Amount" value={transfer.amount} onChange={this.setTransfer("amount")} required />
                <button className="btn btn-primary" disabled={busy}>Transfer</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }
}
