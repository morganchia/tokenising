import React, { Component } from "react";
import Web3 from 'web3';
import BN from 'bn.js';
import { withRouter } from '../common/with-router.js';
import { Link } from "react-router-dom";
import CrossChainDvPDataService from "../services/crosschaindvp.service.js";
import erc20_jsonData from '../abis/ERC20TokenDSGD.abi.json';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";
import { networkOptions, escrowAddressForChain, blockchainName } from "../common/crosschaindvp-constants";

// Unlike repo-setallowance.component.js, there is no per-trade deployed contract to
// read trade details from — the trade lives in our DB (crosschaindvps table) and the
// spender is whichever chain's long-lived CrossChainRepoEscrow the connected wallet
// is currently on.
//
// Like repo-setallowance.component.js, every approval the trade will ever need is
// shown up front (Start Leg and Maturity Leg), rather than only whichever leg happens
// to be next - the Maturity Leg's cash-side repayment is startamount + interestamount,
// not the original amount1/amount2, so it needs its own required figure surfaced
// before the counterparty gets there.
//
// Each leg has two deposits (one per chain, by different counterparties, direction
// reversing at maturity), and the wallet actually used to sign may hold several
// imported accounts covering either side - so all 4 (leg x chain) rows are shown
// regardless of which counterparty the connected account happens to be. Each row
// only offers live balance/allowance/Approve once the wallet is connected to that
// row's chain, and flags (without hiding) when the connected account doesn't match
// the depositor the trade expects for that row - approving from the wrong account
// wouldn't help, since the escrow's transferFrom targets that specific address.
function buildLegRows(trade) {
  if (!trade) return [];
  const isToken1Asset = trade.securityLB === "B"; // securityLB "B" => Token1 is the asset, Token2 is cash
  const cashIsChain1 = !isToken1Asset;
  const cashAmount = (parseFloat(trade.startamount || 0) + parseFloat(trade.interestamount || 0)).toString();

  return [
    { key: "start-1", legLabel: "Start Leg", token: trade.smartcontractaddress1, chainId: trade.blockchain, requiredAmount: trade.amount1, expectedDepositor: trade.counterparty1, depositorLabel: "Counterparty 1" },
    { key: "start-2", legLabel: "Start Leg", token: trade.smartcontractaddress2, chainId: trade.blockchain2, requiredAmount: trade.amount2, expectedDepositor: trade.counterparty2, depositorLabel: "Counterparty 2" },
    { key: "maturity-1", legLabel: "Maturity Leg", token: trade.smartcontractaddress1, chainId: trade.blockchain, requiredAmount: cashIsChain1 ? cashAmount : trade.amount1, expectedDepositor: trade.counterparty2, depositorLabel: "Counterparty 2" },
    { key: "maturity-2", legLabel: "Maturity Leg", token: trade.smartcontractaddress2, chainId: trade.blockchain2, requiredAmount: cashIsChain1 ? trade.amount2 : cashAmount, expectedDepositor: trade.counterparty1, depositorLabel: "Counterparty 1" },
  ];
}

class CrossChainDvPSetAllowance extends Component {
  constructor(props) {
    super(props);
    this.askUser2SignTxn = this.askUser2SignTxn.bind(this);

    this.state = {
      trade: null,
      connectedAccount: "",
      networkId: 0,
      selectedNetwork: "",
      // Keyed by leg label ("Start Leg" / "Maturity Leg"): symbol, balance, allowance,
      // approveAmount are only populated for whichever leg matches the current network.
      legInfo: {},
      isLoading: false,
      walleterror: false,
      showm: false,
      modalmsg: "",
    };
  }

  componentDidMount() {
    const id = this.props.router.params.id;
    if (id) {
      CrossChainDvPDataService.findOne(id)
        .then(response => {
          this.setState({ trade: response.data[0] }, () => this.refreshData());
        })
        .catch(e => console.log(e));
    }

    const loadWeb3 = async () => {
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        const networkId = await window.web3.eth.net.getId();
        const network = networkOptions.find(opt => parseInt(opt.chainId, 16) === networkId);
        this.setState({ networkId, selectedNetwork: network ? network.name : "" });
        // Read whichever account MetaMask already has permitted, without prompting -
        // the user must explicitly pick/confirm their account via "Connect / Switch Wallet"
        // below, so we never silently act on a stale previously-authorized account.
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          this.setState({ connectedAccount: accounts[0] });
        }
        this.refreshData();
      } else {
        window.alert('Non-Ethereum browser detected. Please connect using MetaMask or EIP-1193 compatible wallet.');
        this.setState({ walleterror: true });
      }
      this.setupMetaMaskAccountListener();
    };
    loadWeb3();
  }

  componentWillUnmount() {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', this.handleChainChanged);
    }
  }

  setupMetaMaskAccountListener = () => {
    const ethereum = window.ethereum;
    if (typeof ethereum !== 'undefined') {
      this.handleAccountsChanged = (accounts) => {
        this.setState({ connectedAccount: accounts[0] || "", legInfo: {} }, () => this.refreshData());
      };
      this.handleChainChanged = async (chainId) => {
        const networkId = parseInt(chainId, 16);
        const network = networkOptions.find(opt => parseInt(opt.chainId, 16) === networkId);
        this.setState({ networkId, selectedNetwork: network ? network.name : "", legInfo: {} });
        this.refreshData();
      };
      ethereum.on('accountsChanged', this.handleAccountsChanged);
      ethereum.on('chainChanged', this.handleChainChanged);
    }
  };

  // Same as repo-setallowance.component.js: just ask for whichever account MetaMask
  // already has connected (or prompt the connect dialog the first time). To use a
  // different account, switch the active account directly inside the MetaMask
  // extension - the accountsChanged listener below picks that up automatically.
  connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const connectedAccount = accounts[0] || "";
      const networkId = await window.web3.eth.net.getId();
      const network = networkOptions.find(opt => parseInt(opt.chainId, 16) === networkId);
      await new Promise(resolve => this.setState({ connectedAccount, networkId, selectedNetwork: network ? network.name : "", legInfo: {} }, resolve));
      await this.refreshData();
      return connectedAccount;
    } catch (err) {
      this.displayModal(`Please connect your Metamask wallet to continue: ${err.message}`);
      return "";
    }
  };

  // Populates live symbol/balance/allowance/approveAmount for every row on the network
  // the wallet is currently connected to (both the Start and Maturity row on that
  // chain share the same token/account/spender, so one query covers both). Rows on
  // the other chain only show their required amount until the wallet switches there.
  refreshData = async () => {
    try {
      const web3 = window.web3;
      const { connectedAccount, trade, networkId } = this.state;
      if (!web3 || !connectedAccount || !trade) return;

      const rows = buildLegRows(trade).filter(r => parseInt(r.chainId, 10) === networkId && Web3.utils.isAddress(r.token));
      if (rows.length === 0) return;

      const abi = JSON.parse(JSON.stringify(erc20_jsonData));
      const token = new web3.eth.Contract(abi, rows[0].token);
      const spender = escrowAddressForChain(rows[0].chainId);

      const [symbol, balance, allowance] = await Promise.all([
        token.methods.symbol().call().catch(() => "Unknown"),
        token.methods.balanceOf(connectedAccount).call().catch(() => "0"),
        spender ? token.methods.allowance(connectedAccount, spender).call().catch(() => "0") : "0",
      ]);

      this.setState(prevState => {
        const legInfo = { ...prevState.legInfo };
        rows.forEach(row => {
          legInfo[row.key] = {
            symbol,
            balance: web3.utils.fromWei(balance, 'ether'),
            allowance: web3.utils.fromWei(allowance, 'ether'),
            approveAmount: row.requiredAmount,
          };
        });
        return { legInfo };
      });
    } catch (err) {
      console.log("refreshData error:", err);
    }
  };

  onChangeApproveAmount = (rowKey) => (e) => {
    const value = e.target.value;
    this.setState(prevState => ({
      legInfo: { ...prevState.legInfo, [rowKey]: { ...prevState.legInfo[rowKey], approveAmount: value } },
    }));
  };

  onChangeNetwork = async (e) => {
    const networkName = e.target.value;
    const network = networkOptions.find(opt => opt.name === networkName);
    if (network) {
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: network.chainId }] });
      } catch (error) {
        this.displayModal(`Failed to switch network: ${error.message}`);
      }
    }
  };

  displayModal(msg) {
    this.setState({ showm: true, modalmsg: msg });
  }

  hideModal = () => {
    this.setState({ showm: false });
  };

  show_loading() { this.setState({ isLoading: true }); }
  hide_loading() { this.setState({ isLoading: false }); }

  askUser2SignTxn = async (row) => {
    const { connectedAccount, legInfo } = this.state;
    const spender = escrowAddressForChain(row.chainId);
    if (!spender) {
      this.displayModal("The escrow address is not configured for this chain.");
      return;
    }

    // Fall back to the row's required amount if the field hasn't been touched/loaded
    // yet, and refuse to send an approve(spender, 0) for a blank/invalid amount -
    // MetaMask treats that as revoking the existing allowance, not a no-op.
    const info = legInfo[row.key];
    const approveAmount = (info && info.approveAmount !== "" && info.approveAmount != null) ? info.approveAmount : row.requiredAmount;
    if (approveAmount === "" || approveAmount == null || isNaN(parseFloat(approveAmount)) || parseFloat(approveAmount) <= 0) {
      this.displayModal("Please enter a valid amount greater than zero to approve.");
      return;
    }

    const web3 = window.web3;
    const abi = JSON.parse(JSON.stringify(erc20_jsonData));
    const token = new web3.eth.Contract(abi, row.token);
    const amountToSend = new BN(Math.ceil(approveAmount)).mul(new BN("1000000000000000000"));

    // Some testnets (e.g. Polygon Amoy) reject MetaMask's default suggested gas price as
    // too low - same fix as repo-setallowance.component.js: floor at 30 gwei.
    let gasPrice;
    try {
      gasPrice = await web3.eth.getGasPrice();
    } catch (err) {
      gasPrice = web3.utils.toWei('30', 'gwei');
    }
    gasPrice = Math.max(gasPrice, web3.utils.toWei('30', 'gwei'));

    this.show_loading();
    try {
      await token.methods.approve(spender, amountToSend.toString()).send({ from: connectedAccount, gasPrice })
        .on('receipt', () => {
          this.hide_loading();
          this.displayModal(`Successfully approved ${parseFloat(approveAmount).toLocaleString()} ${(info || {}).symbol || ''} tokens for the Cross Chain DvP escrow contract (${row.depositorLabel}, ${row.legLabel}).`);
          this.refreshData();
        })
        .on('error', (error) => {
          this.hide_loading();
          let errMsg = error.message;
          if (errMsg.includes("User denied transaction signature")) {
            errMsg = "You have denied the transaction signature in Metamask. Please try again.";
          }
          this.displayModal(`Transaction failed: ${errMsg}`);
        });
    } catch (err) {
      this.hide_loading();
      let errMsg = err.message;
      if (errMsg.includes("User denied transaction signature")) {
        errMsg = "You have denied the transaction signature in Metamask. Please try again.";
      }
      this.displayModal(`Error approving in Metamask: ${errMsg}`);
    }
  };

  renderRow(row) {
    const { networkId, legInfo, connectedAccount } = this.state;
    const onRightNetwork = parseInt(row.chainId, 10) === networkId;
    const info = legInfo[row.key];
    const approveAmount = info ? info.approveAmount : row.requiredAmount;
    const mismatch = connectedAccount && row.expectedDepositor && connectedAccount.toLowerCase() !== row.expectedDepositor.toLowerCase();

    return (
      <div className="form-group" style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }} key={row.key}>
        <p><strong>{row.depositorLabel}</strong> — Token {row.token} on {blockchainName(row.chainId)}</p>
        <p>Required: {parseFloat(row.requiredAmount).toLocaleString()} | Expected depositor: {row.expectedDepositor}</p>

        {!onRightNetwork ?
          <p>Switch your wallet to {blockchainName(row.chainId)} above to view balance/allowance and approve this leg.</p>
          :
          <>
            {mismatch &&
              <p style={{ color: 'red' }}>
                Connected wallet ({connectedAccount}) does not match {row.depositorLabel}'s wallet address ({row.expectedDepositor}).
                Approving from this account will not satisfy this leg - switch to {row.depositorLabel}'s account in MetaMask first.
              </p>
            }
            <p>Token: {info ? info.symbol : "..."} | Balance: {info ? parseFloat(info.balance).toLocaleString() : "..."} | Approved allowance: {info ? parseFloat(info.allowance).toLocaleString() : "..."}</p>
            <label htmlFor={`approveAmount-${row.key}`}>Amount to approve</label>
            <input type="number" className="form-control" id={`approveAmount-${row.key}`} min="0"
              value={approveAmount} onChange={this.onChangeApproveAmount(row.key)} />
            <button className={"m-3 btn btn-sm " + (info ? "btn-primary" : "btn-secondary")} disabled={!info}
              onClick={() => this.askUser2SignTxn(row)}>
              Approve
            </button>
          </>
        }
      </div>
    );
  }

  render() {
    const { trade, connectedAccount } = this.state;
    const rows = buildLegRows(trade);
    const tradeNetworkOptions = trade
      ? networkOptions.filter(n => [parseInt(trade.blockchain, 10), parseInt(trade.blockchain2, 10)].includes(parseInt(n.chainId, 16)))
      : networkOptions;

    return (
      <div className="container">
        <header className="jumbotron col-md-8">
          <h3><strong>Cross Chain DvP - Set Token Allowance</strong></h3>
        </header>

        {!trade ? <p>Loading trade...</p> : (
          <div className="col-md-8">
            <p><strong>Trade:</strong> {trade.name}</p>
            <p><strong>Blockchain 1:</strong> {blockchainName(trade.blockchain)} (Token {trade.smartcontractaddress1}, Amount {trade.amount1})</p>
            <p><strong>Counterparty 1 Wallet:</strong> {trade.counterparty1}</p>
            <p><strong>Blockchain 2:</strong> {blockchainName(trade.blockchain2)} (Token {trade.smartcontractaddress2}, Amount {trade.amount2})</p>
            <p><strong>Counterparty 2 Wallet:</strong> {trade.counterparty2}</p>

            {!connectedAccount &&
              <button className="m-3 btn btn-sm btn-outline-primary" onClick={this.connectWallet}>
                Connect Wallet
              </button>
            }
            {connectedAccount &&
              <p><strong>Connected wallet:</strong> {connectedAccount} <small>(to use a different account, switch it directly in the MetaMask extension)</small></p>
            }

            <div className="form-group">
              <label htmlFor="network">Connect wallet to</label>
              <select className="form-control" id="network" onChange={this.onChangeNetwork} value={this.state.selectedNetwork}>
                <option value=""> </option>
                {tradeNetworkOptions.map(n => <option key={n.chainId} value={n.name}>{n.name}</option>)}
              </select>
            </div>

            {!connectedAccount ?
              <p>Connect your wallet to see the Start Leg and Maturity Leg amounts you'll need to approve.</p>
              :
              <>
                <h5>Start Leg</h5>
                {rows.filter(r => r.legLabel === "Start Leg").map(row => this.renderRow(row))}
                <h5>Maturity Leg</h5>
                {rows.filter(r => r.legLabel === "Maturity Leg").map(row => this.renderRow(row))}
              </>
            }

            <Link to={"/xchaindvptransact/" + trade.id} className="m-3 btn btn-sm btn-success">
              Proceed to Transact
            </Link>

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

export default withRouter(CrossChainDvPSetAllowance);
