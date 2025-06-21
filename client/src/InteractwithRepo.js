import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import RepoTradeForm from './components/RepoTradeForm';
import RepoTradeActions from './components/RepoTradeActions';
import RepoTradeDetails from './components/RepoTradeDetails';
import RepoAbi from './abis/Repo.json';
import './App.css';

const InteractWithRepo = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [repoContract, setRepoContract] = useState(null);
  const [contractAddress, setContractAddress] = useState('');
  const [tradeId, setTradeId] = useState('');
  const [tradeDetails, setTradeDetails] = useState(null);
  const [adminAddress, setAdminAddress] = useState('');
  const [adminAction, setAdminAction] = useState(true);
  const [endDate, setEndDate] = useState('');
  const [pauseState, setPauseState] = useState(false);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionError, setConnectionError] = useState(null);

  const SGT_OFFSET = 28800;
  const contractBytecode = 'YOUR_CONTRACT_BYTECODE';

  const connectToMetaMask = async () => {
    if (connectionStatus === 'connecting' || connectionStatus === 'connected') return;
    setConnectionStatus('connecting');
    setConnectionError(null);
    console.log('Attempting to connect to MetaMask...');

    if (!window.ethereum) {
      setConnectionStatus('failed');
      setConnectionError('MetaMask not detected. Please install MetaMask.');
      console.error('MetaMask not detected');
      return;
    }

    try {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      let accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        if (contractAddress) {
          const repoContractInstance = new web3Instance.eth.Contract(RepoAbi, contractAddress);
          setRepoContract(repoContractInstance);
          setConnectionStatus('connected');
          console.log('Connected to MetaMask (existing):', accounts[0]);
        }
        return;
      }

      try {
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        if (error.code === -32002) {
          setConnectionError('MetaMask connection request pending. Please check MetaMask.');
          console.error('Pending MetaMask request:', error);
          await new Promise(resolve => setTimeout(resolve, 2000));
          accounts = await window.ethereum.request({ method: 'eth_accounts' });
        } else {
          throw error;
        }
      }

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        if (contractAddress) {
          const repoContractInstance = new web3Instance.eth.Contract(RepoAbi, contractAddress);
          setRepoContract(repoContractInstance);
          setConnectionStatus('connected');
          console.log('Connected to MetaMask (new):', accounts[0]);
        }
      } else {
        setConnectionStatus('failed');
        setConnectionError('No accounts selected in MetaMask.');
      }
    } catch (error) {
      setConnectionStatus('failed');
      setConnectionError(
        error.message.includes('User rejected')
          ? 'MetaMask connection rejected by user.'
          : `Failed to connect to MetaMask: ${error.message}`
      );
      console.error('Web3 initialization failed:', error);
    }
  };

  useEffect(() => {
    connectToMetaMask();

    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0] || null);
        setConnectionStatus(accounts[0] ? 'connected' : 'disconnected');
        console.log('Account changed:', accounts[0] || 'Disconnected');
      });
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => clearInterval(timer);
  }, [contractAddress]);

  const handleDeployContract = async () => {
    if (!web3 || !account) {
      setConnectionError('Please connect to MetaMask.');
      console.error('No web3 or account');
      return;
    }

    try {
      const contract = new web3.eth.Contract(RepoAbi);
      const deployTx = contract.deploy({ data: contractBytecode });
      const gas = await deployTx.estimateGas({ from: account });
      const deployedContract = await deployTx.send({ from: account, gas });
      setContractAddress(deployedContract.options.address);
      setRepoContract(deployedContract);
      setConnectionError(null);
      console.log('Contract deployed at:', deployedContract.options.address);
    } catch (error) {
      console.error('Deploy contract failed:', error);
      setConnectionError(`Failed to deploy contract: ${error.message}`);
    }
  };

  const handleManageAdmins = async () => {
    if (!repoContract || !account || !web3.utils.isAddress(adminAddress)) {
      setConnectionError('Invalid admin address or contract not loaded.');
      console.error('Invalid admin address or no contract:', { adminAddress, repoContract });
      return;
    }

    try {
      await repoContract.methods.manageAdmins(adminAddress, adminAction)
        .send({ from: account, gas: 100000 })
        .on('transactionHash', (hash) => console.log('Transaction hash:', hash))
        .on('confirmation', (confirmationNumber, receipt) => console.log('Confirmation:', confirmationNumber, receipt))
        .on('error', (error) => console.error('Transaction error:', error));
      setConnectionError(null);
      console.log(`Admin ${adminAction ? 'added' : 'removed'}:`, adminAddress);
    } catch (error) {
      console.error('Manage admins failed:', error);
      setConnectionError(`Failed to manage admin: ${error.message}`);
    }
  };

  const handleCreateTrade = async (formData) => {
    console.log('handleCreateTrade called with:', formData);
    if (!repoContract || !account) {
      setConnectionError('Please connect to MetaMask and ensure contract is loaded.');
      console.error('No contract or account available');
      return;
    }

    try {
      const {
        startDate,
        startTime,
        maturityDate,
        maturityTime,
        bondIsin,
        counterparty1Type,
        bondAmount,
        startAmount,
        interestAmount,
        cashAmount,
        counterparty1,
        counterparty2,
        cashToken,
        bondToken
      } = formData;

      if (!web3.utils.isAddress(counterparty1) || !web3.utils.isAddress(counterparty2)) {
        setConnectionError('Invalid counterparty addresses');
        console.error('Invalid addresses:', { counterparty1, counterparty2 });
        return;
      }
      if (!web3.utils.isAddress(cashToken) || !web3.utils.isAddress(bondToken)) {
        setConnectionError('Invalid token addresses');
        console.error('Invalid token addresses:', { cashToken, bondToken });
        return;
      }
      if (isNaN(bondAmount) || isNaN(startAmount) || isNaN(interestAmount) || isNaN(cashAmount) || bondAmount <= 0 || startAmount <= 0) {
        setConnectionError('Invalid amounts');
        console.error('Invalid amounts:', { bondAmount, startAmount, interestAmount, cashAmount });
        return;
      }

      const startDateTimeSGT = Math.floor(new Date(startDate).getTime() / 1000) + parseInt(startTime) * 3600;
      const maturityDateTimeSGT = Math.floor(new Date(maturityDate).getTime() / 1000) + parseInt(maturityTime) * 3600;
      const startDateTimeUTC = startDateTimeSGT - SGT_OFFSET;
      const maturityDateTimeUTC = maturityDateTimeSGT - SGT_OFFSET;

      const tradeInput = {
        startDateTime: startDateTimeUTC,
        maturityDateTime: maturityDateTimeUTC,
        bondIsin,
        counterparty1RepoType: parseInt(counterparty1Type),
        bondAmount: web3.utils.toWei(bondAmount.toString(), 'ether'),
        startAmount: web3.utils.toWei(startAmount.toString(), 'ether'),
        interestAmount: web3.utils.toWei(interestAmount.toString(), 'ether'),
        cashAmount: web3.utils.toWei(cashAmount.toString(), 'ether'),
        counterparty1,
        counterparty2,
        cashToken,
        bondToken
      };

      console.log('Calling createTrade with:', tradeInput);
      const trade = await repoContract.methods.createTrade(tradeInput)
        .send({ from: account, gas: 2000000 })
        .on('transactionHash', (hash) => console.log('Transaction hash:', hash))
        .on('confirmation', (confirmationNumber, receipt) => console.log('Confirmation:', confirmationNumber, receipt))
        .on('error', (error) => console.error('Transaction error:', error));

      const newTradeId = trade.events.TradeCreated.returnValues.tradeId;
      setTradeId(newTradeId);
      setConnectionError(null);
      console.log('Trade created successfully:', newTradeId);
    } catch (error) {
      console.error('Create trade failed:', error);
      setConnectionError(`Failed to create trade: ${error.message}`);
    }
  };

  const handleSetEndDate = async () => {
    if (!repoContract || !account || isNaN(endDate) || endDate <= currentTime) {
      setConnectionError('Invalid end date or contract not loaded.');
      console.error('Invalid end date or no contract:', { endDate, currentTime });
      return;
    }

    try {
      const endDateUTC = parseInt(endDate) - SGT_OFFSET;
      await repoContract.methods.setEndDate(endDateUTC)
        .send({ from: account, gas: 100000 })
        .on('transactionHash', (hash) => console.log('Transaction hash:', hash))
        .on('confirmation', (confirmationNumber, receipt) => console.log('Confirmation:', confirmationNumber, receipt))
        .on('error', (error) => console.error('Transaction error:', error));
      setConnectionError(null);
      console.log('End date set to (UTC):', endDateUTC);
    } catch (error) {
      console.error('Set end date failed:', error);
      setConnectionError(`Failed to set end date: ${error.message}`);
    }
  };

  const handlePauseUnpause = async () => {
    if (!repoContract || !account) {
      setConnectionError('Please connect to MetaMask and ensure contract is loaded.');
      console.error('No contract or account');
      return;
    }

    try {
      await repoContract.methods.pauseUnpause(pauseState)
        .send({ from: account, gas: 100000 })
        .on('transactionHash', (hash) => console.log('Transaction hash:', hash))
        .on('confirmation', (confirmationNumber, receipt) => console.log('Confirmation:', confirmationNumber, receipt))
        .on('error', (error) => console.error('Transaction error:', error));
      setConnectionError(null);
      console.log(`Contract ${pauseState ? 'paused' : 'unpaused'}`);
    } catch (error) {
      console.error('Pause/unpause failed:', error);
      setConnectionError(`Failed to pause/unpause: ${error.message}`);
    }
  };

  const handleStartTrade = async () => {
    if (!repoContract || !account || !tradeId) {
      setConnectionError('Please enter a trade ID and ensure contract is loaded.');
      console.error('No contract or tradeId:', { tradeId });
      return;
    }

    try {
      await repoContract.methods.startTrade(tradeId)
        .send({ from: account, gas: 600000 })
        .on('transactionHash', (hash) => console.log('Transaction hash:', hash))
        .on('confirmation', (confirmationNumber, receipt) => console.log('Confirmation:', confirmationNumber, receipt))
        .on('error', (error) => console.error('Transaction error:', error));
      setConnectionError(null);
      console.log('Trade started:', tradeId);
    } catch (error) {
      console.error('Start trade failed:', error);
      setConnectionError(`Failed to start trade: ${error.message}`);
    }
  };

  const handleMatureTrade = async () => {
    if (!repoContract || !account || !tradeId) {
      setConnectionError('Please enter a trade ID and ensure contract is loaded.');
      console.error('No contract or tradeId:', { tradeId });
      return;
    }

    try {
      await repoContract.methods.matureTrade(tradeId)
        .send({ from: account, gas: 600000 }) // Increased from 500,000
        .on('transactionHash', (hash) => console.log('Transaction hash:', hash))
        .on('confirmation', (confirmationNumber, receipt) => console.log('Confirmation:', confirmationNumber, receipt))
        .on('error', (error) => console.error('Transaction error:', error));
      setConnectionError(null);
      console.log('Trade matured:', tradeId);
    } catch (error) {
      console.error('Mature trade failed:', error);
      setConnectionError(`Failed to mature trade: ${error.message}`);
    }
  };

  const handleCancelTrade = async () => {
    if (!repoContract || !account || !tradeId) {
      setConnectionError('Please enter a trade ID and ensure contract is loaded.');
      console.error('No contract or tradeId:', { tradeId });
      return;
    }

    try {
      await repoContract.methods.cancelTrade(tradeId)
        .send({ from: account, gas: 100000 })
        .on('transactionHash', (hash) => console.log('Transaction hash:', hash))
        .on('confirmation', (confirmationNumber, receipt) => console.log('Confirmation:', confirmationNumber, receipt))
        .on('error', (error) => console.error('Transaction error:', error));
      setConnectionError(null);
      console.log('Trade cancelled:', tradeId);
    } catch (error) {
      console.error('Cancel trade failed:', error);
      setConnectionError(`Failed to cancel trade: ${error.message}`);
    }
  };

  const handleFetchTrade = async () => {
    console.log('handleFetchTrade called with tradeId:', tradeId);
    if (!repoContract || !tradeId) {
      setConnectionError('Please enter a trade ID and ensure contract is loaded.');
      console.error('No contract or tradeId');
      return;
    }
    try {
      const basics = await repoContract.methods.getTradeBasicsSGT(tradeId).call();
      const details = await repoContract.methods.getTradeDetails(tradeId).call();
      setTradeDetails({
        tradeId: basics.tradeId,
        startDateTime: basics.startDateTime,
        maturityDateTime: basics.maturityDateTime,
        bondIsin: basics.bondIsin,
        counterparty1RepoType: basics.counterparty1RepoType == 0 ? 'Repo' : 'ReverseRepo',
        bondAmount: web3.utils.fromWei(basics.bondAmount, 'ether'),
        startAmount: web3.utils.fromWei(basics.startAmount, 'ether'),
        interestAmount: web3.utils.fromWei(basics.interestAmount, 'ether'),
        cashAmount: web3.utils.fromWei(basics.cashAmount, 'ether'),
        counterparty1: details.counterparty1,
        counterparty2: details.counterparty2,
        cashToken: details.cashToken,
        bondToken: details.bondToken,
        status: ['Pending', 'Started', 'Matured', 'Cancelled'][basics.status]
      });
      const endDateSGT = await repoContract.methods.getEndDateSGT().call();
      console.log('End date (SGT):', endDateSGT);
      setTradeDetails((prev) => ({ ...prev, endDate: endDateSGT }));
      setConnectionError(null);
      console.log('Trade fetched successfully:', { basics, details });
    } catch (error) {
      console.error('Fetch trade details failed:', error);
      setConnectionError('Failed to fetch trade details: ' + error.message);
    }
  };

  return (
    <div className="app-container max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Repo DApp (Singapore Time)</h1>
      
      {connectionStatus === 'connected' && account ? (
        <p className="mb-4 text-green-500 text-center">Connected: {account}</p>
      ) : connectionStatus === 'connecting' ? (
        <p className="mb-4 text-yellow-500 text-center">Connecting to MetaMask...</p>
      ) : (
        <div className="mb-4 text-center">
          <p className="text-red-500">{connectionError || 'Please connect to MetaMask'}</p>
          <button
            onClick={connectToMetaMask}
            className="mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Connect to MetaMask
          </button>
        </div>
      )}
      {connectionError && (
        <p className="mb-4 text-red-500 text-center">{connectionError}</p>
      )}

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Deploy Contract</h2>
        <button
          onClick={handleDeployContract}
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
          disabled={!web3 || !account}
        >
          Deploy Repo Contract
        </button>
        {contractAddress && (
          <p className="mt-2 text-gray-600">Contract Address: {contractAddress}</p>
        )}
      </div>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Manage Admins</h2>
        <input
          type="text"
          value={adminAddress}
          onChange={(e) => setAdminAddress(e.target.value)}
          placeholder="Admin Address"
          className="border p-2 rounded w-full mb-2"
        />
        <select
          value={adminAction}
          onChange={(e) => setAdminAction(e.target.value === 'true')}
          className="border p-2 rounded w-full mb-2"
        >
          <option value="true">Add Admin</option>
          <option value="false">Remove Admin</option>
        </select>
        <button
          onClick={handleManageAdmins}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={!repoContract || !web3.utils.isAddress(adminAddress)}
        >
          Manage Admin
        </button>
      </div>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Set End Date (SGT)</h2>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(Math.floor(new Date(e.target.value).getTime() / 1000))}
          className="border p-2 rounded w-full mb-2"
        />
        <button
          onClick={handleSetEndDate}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={!repoContract || !endDate || endDate <= currentTime + SGT_OFFSET}
        >
          Set End Date
        </button>
      </div>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Pause/Unpause Contract</h2>
        <select
          value={pauseState}
          onChange={(e) => setPauseState(e.target.value === 'true')}
          className="border p-2 rounded w-full mb-2"
        >
          <option value="true">Pause</option>
          <option value="false">Unpause</option>
        </select>
        <button
          onClick={handlePauseUnpause}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={!repoContract}
        >
          {pauseState ? 'Pause' : 'Unpause'} Contract
        </button>
      </div>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Create Trade (SGT)</h2>
        <RepoTradeForm onCreateTrade={handleCreateTrade} />
      </div>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Trade Actions</h2>
        <RepoTradeActions
          web3={web3}
          account={account}
          repoContract={repoContract}
          tradeId={tradeId}
          setTradeId={setTradeId}
          tradeDetails={tradeDetails}
          currentTime={currentTime + SGT_OFFSET}
          onFetchTrade={handleFetchTrade}
          onStartTrade={handleStartTrade}
          onMatureTrade={handleMatureTrade}
          onCancelTrade={handleCancelTrade}
        />
      </div>

      {tradeDetails && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-4">Trade Details (SGT)</h2>
          <RepoTradeDetails tradeDetails={tradeDetails} />
        </div>
      )}
    </div>
  );
};

export default InteractWithRepo;