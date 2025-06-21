import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import RepoTradeForm from './RepoTradeForm';
import RepoTradeActions from './RepoTradeActions';
import RepoTradeDetails from './RepoTradeDetails';
import contractAbi from '../abis/ERC20TokenRepo.abi.json';
//import contractBytecode from '../abis/ERC20TokenRepo.bytecode.json'; 
const contractBytecode = '0x...'; // Replace with actual bytecode from compiled contract

const RepoTradeManager = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [repoContract, setRepoContract] = useState(null);
  const [tradeId, setTradeId] = useState('');
  const [tradeDetails, setTradeDetails] = useState(null);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          setWeb3(web3Instance);
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
        } catch (err) {
          setError('Failed to connect to MetaMask: ' + err.message);
        }
      } else {
        setError('Please install MetaMask!');
      }
    };
    initWeb3();

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDeployContract = async () => {
    if (!web3 || !account) {
      setError('Web3 or account not initialized');
      return;
    }

    const emptyTradeInput = {
      startDateTime: '0',
      maturityDateTime: '0',
      bondIsin: '',
      counterparty1RepoType: 0,
      bondAmount: '0',
      startAmount: '0',
      interestAmount: '0',
      cashAmount: '0',
      counterparty1: '0x0000000000000000000000000000000000000000',
      counterparty2: '0x0000000000000000000000000000000000000000',
      cashToken: '0x0000000000000000000000000000000000000000',
      bondToken: '0x0000000000000000000000000000000000000000'
    };

    try {
      const contract = new web3.eth.Contract(contractAbi.abi);
      const deployment = contract.deploy({
        data: contractBytecode,
        arguments: [emptyTradeInput]
      });
      const gas = await deployment.estimateGas({ from: account });
      const newContract = await deployment.send({ from: account, gas });
      setRepoContract(newContract);
      setContractAddress(newContract.options.address);
      setError('');
      alert('Contract deployed successfully at ' + newContract.options.address);
    } catch (err) {
      setError('Contract deployment failed: ' + err.message);
    }
  };

  const handleCreateTrade = async (tradeInput) => {
    if (!web3 || !account) {
      setError('Web3 or account not initialized');
      return;
    }

    try {
      const contract = new web3.eth.Contract(contractAbi.abi);
      const deployment = contract.deploy({
        data: contractBytecode,
        arguments: [tradeInput]
      });
      const gas = await deployment.estimateGas({ from: account });
      const newContract = await deployment.send({ from: account, gas });
      setRepoContract(newContract);
      setContractAddress(newContract.options.address);
      setError('');
      alert('Contract deployed with trade at ' + newContract.options.address);
    } catch (err) {
      setError('Contract deployment with trade failed: ' + err.message);
    }
  };

  const handleConnectContract = async (address) => {
    if (!web3 || !address) {
      setError('Web3 not initialized or invalid address');
      return;
    }
    try {
      const contract = new web3.eth.Contract(contractAbi.abi, address);
      setRepoContract(contract);
      setContractAddress(address);
      setError('');
      alert('Connected to contract at ' + address);
    } catch (err) {
      setError('Failed to connect to contract: ' + err.message);
    }
  };

  const handleFetchTrade = async () => {
    if (!repoContract || !tradeId) return;
    try {
      const basics = await repoContract.methods.getTradeBasicsSGT(tradeId).call();
      const details = await repoContract.methods.getTradeDetails(tradeId).call();
      const endDate = await repoContract.methods.getEndDateSGT().call();
      setTradeDetails({
        tradeId: basics[0],
        startDateTime: parseInt(basics[1]),
        maturityDateTime: parseInt(basics[2]),
        bondIsin: basics[3],
        counterparty1RepoType: basics[4],
        startAmount: basics[5],
        interestAmount: basics[6],
        bondAmount: basics[7],
        cashAmount: basics[8],
        status: basics[9],
        counterparty1: details[1],
        counterparty2: details[2],
        cashToken: details[3],
        bondToken: details[4],
        endDate: parseInt(endDate) !== 0 ? parseInt(endDate) : null
      });
      setError('');
    } catch (err) {
      setError('Failed to fetch trade: ' + err.message);
    }
  };

  const handleStartTrade = async () => {
    if (!repoContract || !tradeId || !account) return;
    try {
      await repoContract.methods.startTrade(tradeId).send({ from: account });
      alert('Trade started successfully');
      handleFetchTrade();
    } catch (err) {
      setError('Start trade failed: ' + err.message);
    }
  };

  const handleMatureTrade = async () => {
    if (!repoContract || !tradeId || !account) return;
    try {
      await repoContract.methods.matureTrade(tradeId).send({ from: account });
      alert('Trade matured successfully');
      handleFetchTrade();
    } catch (err) {
      setError('Mature trade failed: ' + err.message);
    }
  };

  const handleCancelTrade = async () => {
    if (!repoContract || !tradeId || !account) return;
    try {
      await repoContract.methods.cancelTrade(tradeId).send({ from: account });
      alert('Trade cancelled successfully');
      handleFetchTrade();
    } catch (err) {
      setError('Cancel trade failed: ' + err.message);
    }
  };

  const handleWithdrawTokens = async (tradeId, token, to, amount) => {
    if (!repoContract || !account) return;
    try {
      await repoContract.methods.withdrawTokens(tradeId, token, to, amount).send({ from: account });
      alert('Tokens withdrawn successfully');
    } catch (err) {
      setError('Withdraw tokens failed: ' + err.message);
    }
  };

  const handleSetEndDate = async (endDateTime) => {
    if (!repoContract || !account) return;
    try {
      await repoContract.methods.setEndDate(endDateTime).send({ from: account });
      alert('End date set successfully');
      handleFetchTrade();
    } catch (err) {
      setError('Set end date failed: ' + err.message);
    }
  };

  const handlePauseUnpause = async (pause) => {
    if (!repoContract || !account) return;
    try {
      await repoContract.methods.pauseUnpause(pause).send({ from: account });
      alert(`Contract ${pause ? 'paused' : 'unpaused'} successfully`);
    } catch (err) {
      setError(`Pause/unpause failed: ${err.message}`);
    }
  };

  const handleManageAdmins = async (admin, add) => {
    if (!repoContract || !account) return;
    try {
      await repoContract.methods.manageAdmins(admin, add).send({ from: account });
      alert(`Admin ${add ? 'added' : 'removed'} successfully`);
    } catch (err) {
      setError(`Manage admins failed: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Repo Trade Manager</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <label className="block text-sm font-medium">Contract Address</label>
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="Enter contract address to connect"
          className="border p-2 rounded w-full mb-2"
        />
        <button
          onClick={() => handleConnectContract(contractAddress)}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 w-full"
          disabled={!contractAddress}
        >
          Connect to Contract
        </button>
      </div>
      <RepoTradeForm
        onCreateTrade={handleCreateTrade}
        onDeployContract={handleDeployContract}
      />
      <RepoTradeActions
        web3={web3}
        account={account}
        repoContract={repoContract}
        tradeId={tradeId}
        setTradeId={setTradeId}
        tradeDetails={tradeDetails}
        currentTime={currentTime}
        onFetchTrade={handleFetchTrade}
        onStartTrade={handleStartTrade}
        onMatureTrade={handleMatureTrade}
        onCancelTrade={handleCancelTrade}
        onWithdrawTokens={handleWithdrawTokens}
        onSetEndDate={handleSetEndDate}
        onPauseUnpause={handlePauseUnpause}
        onManageAdmins={handleManageAdmins}
      />
      {tradeDetails && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Trade Details</h2>
          <RepoTradeDetails tradeDetails={tradeDetails} />
        </div>
      )}
    </div>
  );
};

export default RepoTradeManager;