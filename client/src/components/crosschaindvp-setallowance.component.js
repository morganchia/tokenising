import React, { Component } from "react";
import Web3 from 'web3';
import BN from 'bn.js';
import { withRouter } from '../common/with-router.js';
import CrossChainDvPDataService from "../services/crosschaindvp.service.js";
import erc20_jsonData from '../abis/ERC20TokenDSGD.abi.json';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";
import { networkOptions, escrowAddressForChain, blockchainName } from "../common/crosschaindvp-constants";

// Unlike repo-setallowance.component.js, there is no per-trade deployed contract to
// read trade details from — the trade lives in our DB (crosschaindvps table) and the
// spender is whichever chain's long-lived CrossChainRepoEscrow the connected wallet
// is currently on. The counterparty simply needs to be on the right chain and approve
// their side's token to that chain's escrow address.
class CrossChainDvPSetAllowance extends Component {
  constructor(props) {
    super(props);
    this.onChangeApproveAmount = this.onChangeApproveAmount.bind(this);
    this.onChangeNetwork = this.onChangeNetwork.bind(this);
    this.askUser2SignTxn = this.askUser2SignTxn.bind(this);

    this.state = {
      trade: null,
      connectedAccount: "",
      networkId: 0,
      selectedNetwork: "",
      approveAmount: "",
      tokenSymbol: "",
      tokenBalance: 0,
      allowance: 0,
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
      this.handleAccountsChanged = () => this.refreshData();
      this.handleChainChanged = async (chainId) => {
        const networkId = parseInt(chainId, 16);
        const network = networkOptions.find(opt => parseInt(opt.chainId, 16) === networkId);
        this.setState({ networkId, selectedNetwork: network ? network.name : "" });
        this.refreshData();
      };
      ethereum.on('accountsChanged', this.handleAccountsChanged);
      ethereum.on('chainChanged', this.handleChainChanged);
    }
  };

  // Determines which side of the trade (Token1/blockchain, or Token2/blockchain2)
  // corresponds to the chain the wallet is currently connected to.
  getMySide() {
    const { trade, networkId } = this.state;
    if (!trade) return null;
    if (parseInt(trade.blockchain, 10) === networkId) {
      return { token: trade.smartcontractaddress1, chainId: trade.blockchain, amount: trade.amount1, label: "Counterparty 1" };
    }
    if (parseInt(trade.blockchain2, 10) === networkId) {
      return { token: trade.smartcontractaddress2, chainId: trade.blockchain2, amount: trade.amount2, label: "Counterparty 2" };
    }
    return null;
  }

  refreshData = async () => {
    try {
      const web3 = window.web3;
      if (!web3) return;
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      this.setState({ connectedAccount: accounts[0] });

      const side = this.getMySide();
      if (!side || !Web3.utils.isAddress(side.token)) return;

      const abi = JSON.parse(JSON.stringify(erc20_jsonData));
      const token = new web3.eth.Contract(abi, side.token);
      const spender = escrowAddressForChain(side.chainId);

      const [symbol, balance, allowance] = await Promise.all([
        token.methods.symbol().call().catch(() => "Unknown"),
        token.methods.balanceOf(accounts[0]).call().catch(() => "0"),
        spender ? token.methods.allowance(accounts[0], spender).call().catch(() => "0") : "0",
      ]);

      this.setState({
        tokenSymbol: symbol,
        tokenBalance: web3.utils.fromWei(balance, 'ether'),
        allowance: web3.utils.fromWei(allowance, 'ether'),
        approveAmount: side.amount,
      });
    } catch (err) {
      console.log("refreshData error:", err);
    }
  };

  onChangeApproveAmount(e) {
    this.setState({ approveAmount: e.target.value });
  }

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

  askUser2SignTxn = async () => {
    const side = this.getMySide();
    const spender = side ? escrowAddressForChain(side.chainId) : null;
    if (!side || !spender) {
      this.displayModal("Please connect a wallet on Blockchain 1 or Blockchain 2 for this trade, and make sure the escrow address is configured for that chain.");
      return;
    }

    const web3 = window.web3;
    const abi = JSON.parse(JSON.stringify(erc20_jsonData));
    const token = new web3.eth.Contract(abi, side.token);
    const connectedAccount = this.state.connectedAccount;
    const amountToSend = new BN(Math.ceil(this.state.approveAmount)).mul(new BN("1000000000000000000"));

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
          this.displayModal(`Successfully approved ${parseFloat(this.state.approveAmount).toLocaleString()} ${this.state.tokenSymbol} tokens for the Cross Chain DvP escrow contract.`);
          this.refreshData();
        })
        .on('error', (error) => {
          this.hide_loading();
          this.displayModal(`Transaction failed: ${error.message}`);
        });
    } catch (err) {
      this.hide_loading();
      this.displayModal(`Error approving in Metamask: ${err.message}`);
    }
  };

  render() {
    const { trade, networkId, tokenSymbol, tokenBalance, allowance, approveAmount } = this.state;
    const side = this.getMySide();

    return (
      <div className="container">
        <header className="jumbotron col-md-8">
          <h3><strong>Cross Chain DvP - Set Token Allowance</strong></h3>
        </header>

        {!trade ? <p>Loading trade...</p> : (
          <div className="col-md-8">
            <p><strong>Trade:</strong> {trade.name}</p>
            <p><strong>Blockchain 1:</strong> {blockchainName(trade.blockchain)} (Token {trade.smartcontractaddress1}, Amount {trade.amount1})</p>
            <p><strong>Blockchain 2:</strong> {blockchainName(trade.blockchain2)} (Token {trade.smartcontractaddress2}, Amount {trade.amount2})</p>

            <div className="form-group">
              <label htmlFor="network">Connect wallet to</label>
              <select className="form-control" id="network" onChange={this.onChangeNetwork} value={this.state.selectedNetwork}>
                <option value=""> </option>
                {networkOptions.map(n => <option key={n.chainId} value={n.name}>{n.name}</option>)}
              </select>
            </div>

            {!side ?
              <p>Your wallet is on chain id {networkId}, which is not Blockchain 1 or Blockchain 2 for this trade. Please switch network above.</p>
              :
              <>
                <p>Connected as <strong>{side.label}</strong>. Token: {tokenSymbol} | Balance: {parseFloat(tokenBalance).toLocaleString()} | Current allowance: {parseFloat(allowance).toLocaleString()}</p>
                <div className="form-group">
                  <label htmlFor="approveAmount">Amount to approve</label>
                  <input type="number" className="form-control" id="approveAmount" min="0"
                    value={approveAmount} onChange={this.onChangeApproveAmount} />
                </div>
                <button className="m-3 btn btn-sm btn-primary" onClick={this.askUser2SignTxn}>
                  Approve
                </button>
              </>
            }

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
