import React, { useEffect, useState, useCallback } from 'react';
import Web3 from 'web3';
import cbdcAbi from '../abis/CBDC.json';
import bridgeSourceAbi from '../abis/BridgeSource.json';
import wrappedAbi from '../abis/WrappedCBDC.json';
import bridgeDestAbi from '../abis/BridgeDestination.json';
import Modal from '../Modal.js';

const Bridge = () => {
  const ADMIN_ADDRESS = process.env.REACT_APP_ADMIN_ADDRESS?.toLowerCase();
  
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [wrBalance, setWrBalance] = useState('0');
  const [amount, setAmount] = useState('10');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [status, setStatus] = useState('');
  const [refundableBurns, setRefundableBurns] = useState([]);
  const [customNonce, setCustomNonce] = useState('');
  const isAdmin = account && ADMIN_ADDRESS && account.toLowerCase() === ADMIN_ADDRESS;
  const [showToast, setShowToast] = useState(false);

  const CBDC_ADDRESS = process.env.REACT_APP_CBDC_ADDRESS;
  const WRAPPED_ADDRESS = process.env.REACT_APP_WRAPPEDCBDC_ADDRESS;
  const BRIDGE_SRC_ADDRESS = process.env.REACT_APP_BRIDGE_SOURCE_ADDRESS;
  const BRIDGE_DEST_ADDRESS = process.env.REACT_APP_BRIDGE_DEST_ADDRESS;
  const AMOY_CHAIN_ID = 80002;
  const SEPOLIA_CHAIN_ID = 11155111;

  let cachedGasPrice = null;
  let cachedPriorityFee = null;
  let gasPriceTimestamp = 0;
  const GAS_PRICE_CACHE_DURATION = 30000; // 30 seconds

  const getGasParameters = async () => {
    if (!web3) throw new Error('Web3 not initialized');
    const now = Date.now();
    if (cachedGasPrice && cachedPriorityFee && now - gasPriceTimestamp < GAS_PRICE_CACHE_DURATION) {
      return { maxFeePerGas: cachedGasPrice, maxPriorityFeePerGas: cachedPriorityFee };
    }
    
    // Fetch base fee
    const baseFeePerGas = await web3.eth.getGasPrice();
    let priorityFeePerGas;
    try {
      priorityFeePerGas = await web3.eth.getMaxPriorityFeePerGas();
    } catch (err) {
      console.warn('getMaxPriorityFeePerGas not supported, estimating priority fee...');
      // Estimate priority fee: max(1.5 gwei, baseFeePerGas * 1.25)
      const minPriorityFee = web3.utils.toWei('1.5', 'gwei'); // Minimum 1.5 gwei
      const estimatedPriorityFee = web3.utils.toBN(baseFeePerGas).mul(web3.utils.toBN(125)).div(web3.utils.toBN(100)).toString(); // 25% increase over base fee
      priorityFeePerGas = web3.utils.toBN(estimatedPriorityFee).gt(web3.utils.toBN(minPriorityFee)) ? estimatedPriorityFee : minPriorityFee;
    }
    
    // Increase priority fee to ensure transaction inclusion
    const increasedPriorityFee = web3.utils.toBN(priorityFeePerGas).mul(web3.utils.toBN(13)).div(web3.utils.toBN(10)).toString(); // 30% increase
    // Calculate maxFeePerGas: baseFeePerGas + increasedPriorityFee + buffer
    const maxFeePerGas = web3.utils.toBN(baseFeePerGas).add(web3.utils.toBN(increasedPriorityFee)).mul(web3.utils.toBN(11)).div(web3.utils.toBN(10)).toString(); // 10% buffer
    
    cachedGasPrice = maxFeePerGas;
    cachedPriorityFee = increasedPriorityFee;
    gasPriceTimestamp = now;
    
    console.log('Fetched gas parameters:', {
      maxFeePerGas: web3.utils.fromWei(maxFeePerGas, 'gwei') + ' gwei',
      maxPriorityFeePerGas: web3.utils.fromWei(increasedPriorityFee, 'gwei') + ' gwei'
    });
    
    return { maxFeePerGas, maxPriorityFeePerGas: increasedPriorityFee };
  };

  const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const gasParams = await getGasParameters();
        const result = await fn(gasParams);
        console.log('Retry response:', result);
        return result;
      } catch (err) {
        console.error(`Attempt ${attempt} failed:`, err.message);
        if ((err.message.includes('429') || err.message.includes('replacement transaction underpriced') || err.message.includes('not mined within') || err.message.includes('Please pass numbers as strings or BN objects')) && attempt < maxRetries) {
          console.log(`Retrying (${attempt}/${maxRetries}) due to error: ${err.message}...`);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
        throw err;
      }
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const updateBalances = async (overrideChainId = chainId) => {
    if (!web3 || !account || !overrideChainId) {
      console.warn('Skipping balance update: web3, account, or chainId not set');
      setBalance('0');
      setWrBalance('0');
      return;
    }

    try {
      if (overrideChainId === AMOY_CHAIN_ID) {
        const cbdc = new web3.eth.Contract(cbdcAbi.abi, CBDC_ADDRESS);
        const bal = await withRetry(() => cbdc.methods.balanceOf(account).call());
        if (bal === undefined || bal === null) {
          console.error('BalanceOf returned undefined/null for account:', account);
          setStatus('❌ Error: Failed to fetch CBDC balance');
          setBalance('0');
          setWrBalance('0');
          return;
        }
        console.log('Raw CBDC balance:', bal);
        setBalance(web3.utils.fromWei(bal, 'ether'));
        setWrBalance('0');
      } else if (overrideChainId === SEPOLIA_CHAIN_ID) {
        const wrapped = new web3.eth.Contract(wrappedAbi.abi, WRAPPED_ADDRESS);
        const bal = await withRetry(() => wrapped.methods.balanceOf(account).call());
        if (bal === undefined || bal === null) {
          console.error('BalanceOf returned undefined/null for account:', account);
          setStatus('❌ Error: Failed to fetch wrCBDC balance');
          setBalance('0');
          setWrBalance('0');
          return;
        }
        console.log('Raw wrCBDC balance:', bal);
        setWrBalance(web3.utils.fromWei(bal, 'ether'));
        setBalance('0');
      }
    } catch (err) {
      console.error('Balance update error:', err);
      setStatus(`❌ Balance update error: ${err.message}`);
      setBalance('0');
      setWrBalance('0');
    }
  };

  const debouncedUpdateBalances = useCallback(debounce(updateBalances, 1000), [web3, account, chainId]);

  useEffect(() => {
    const handleChainChanged = (_chainId) => {
      const newChainId = parseInt(_chainId, 16);
      console.log('Chain changed to:', newChainId);
      setChainId(newChainId);
      if (web3 && account) {
        debouncedUpdateBalances(newChainId);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', () => window.location.reload());
    }

    const init = async () => {
      if (!window.ethereum) {
        setStatus('❌ Please connect using MetaMask or EIP-1193 compatible wallet.');
        return;
      }

      try {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
    
        const id = await web3Instance.eth.getChainId();
        setChainId(parseInt(id));
    
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        let userAccount = accounts[0];
        if (!userAccount) {
          const requested = await window.ethereum.request({ method: 'eth_requestAccounts' });
          userAccount = requested[0];
        }
    
        setAccount(userAccount);
    
        if (web3Instance && userAccount && id) {
          debouncedUpdateBalances(parseInt(id));
        }
    
      } catch (err) {
        console.error('MetaMask connection error:', err);
        setStatus(`❌ MetaMask connection error: ${err.message}`);
      }
    };

    init();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  useEffect(() => {
    if (web3 && account && chainId) {
      debouncedUpdateBalances();
    }
  }, [web3, account, chainId, debouncedUpdateBalances]);

  const bridgeToSepolia = async () => {
    if (!web3 || !account) {
      setStatus('❌ Web3 or account not initialized');
      return;
    }

    try {
      if (!BRIDGE_SRC_ADDRESS) {
        setStatus('❌ Bridge source address not configured. Check .env');
        return;
      }
      if (BRIDGE_SRC_ADDRESS === '0x0000000000000000000000000000000000000000') {
        setStatus('❌ Bridge source address is zero address');
        return;
      }
      if (!destinationAddress) {
        setStatus('❌ Destination address cannot be empty');
        return;
      }
      if (!web3.utils.isAddress(destinationAddress)) {
        setStatus('❌ Invalid destination address');
        return;
      }
      const weiAmount = web3.utils.toWei((amount || '0').toString(), 'ether');
      if (weiAmount === '0') {
        setStatus('❌ Please enter a valid amount to bridge');
        return;
      }

      setStatus('Checking balance and allowance...');
      const cbdc = new web3.eth.Contract(cbdcAbi.abi, CBDC_ADDRESS);
      const bridge = new web3.eth.Contract(bridgeSourceAbi.abi, BRIDGE_SRC_ADDRESS);

      // Check POL balance
      const polBalance = await web3.eth.getBalance(account);
      const requiredPol = web3.utils.toBN('117277').mul(web3.utils.toBN(web3.utils.toWei('100', 'gwei'))); // Approx gas limit * gas price
      if (web3.utils.toBN(polBalance).lt(requiredPol)) {
        setStatus(`❌ Insufficient POL balance: ${web3.utils.fromWei(polBalance, 'ether')} POL available, ~${web3.utils.fromWei(requiredPol, 'ether')} POL required`);
        return;
      }
      console.log(`POL balance: ${web3.utils.fromWei(polBalance, 'ether')} POL`);

      // Check CBDC balance
      const userBalance = await withRetry(() => cbdc.methods.balanceOf(account).call());
      if (web3.utils.toBN(userBalance).lt(web3.utils.toBN(weiAmount))) {
        setStatus(`❌ Insufficient CBDC balance: ${web3.utils.fromWei(userBalance, 'ether')} available, ${web3.utils.fromWei(weiAmount, 'ether')} required`);
        return;
      }

      // Check allowance
      const allowance = await withRetry(() => cbdc.methods.allowance(account, BRIDGE_SRC_ADDRESS).call());
      console.log(`Current allowance: ${web3.utils.fromWei(allowance, 'ether')} CBDC`);

      if (web3.utils.toBN(allowance).lt(web3.utils.toBN(weiAmount))) {
        setStatus('Estimating gas for approve...');
        let approveGas;
        try {
          approveGas = await withRetry(() => cbdc.methods.approve(BRIDGE_SRC_ADDRESS, weiAmount).estimateGas({ from: account }));
          console.log(`Estimated gas for approve: ${approveGas}`);
        } catch (gasErr) {
          console.error('Gas estimation failed for approve:', gasErr.message);
          setStatus(`❌ Gas estimation failed for approve: ${gasErr.message}`);
          return;
        }

        setStatus('Testing approve call...');
        try {
          await withRetry(() => cbdc.methods.approve(BRIDGE_SRC_ADDRESS, weiAmount).call({ from: account }));
          console.log('Approve simulation successful');
        } catch (callErr) {
          console.error('Approve call reverted:', callErr.message);
          setStatus(`❌ Approve simulation failed: ${callErr.message}`);
          return;
        }

        setStatus('Approving CBDC tokens for bridge...');
        try {
          const gasParams = await getGasParameters();
          const nonce = customNonce ? String(parseInt(customNonce)) : String(await web3.eth.getTransactionCount(account, 'pending'));
          console.log('Transaction nonce:', nonce);
          console.log('Gas parameters:', {
            maxFeePerGas: web3.utils.fromWei(gasParams.maxFeePerGas, 'gwei'),
            maxPriorityFeePerGas: web3.utils.fromWei(gasParams.maxPriorityFeePerGas, 'gwei')
          });
          const gasLimit = web3.utils.toBN(approveGas).mul(web3.utils.toBN(3)).div(web3.utils.toBN(2)).toString();
          console.log('Gas limit:', gasLimit);

          // Log raw transaction
          const txData = cbdc.methods.approve(BRIDGE_SRC_ADDRESS, weiAmount).encodeABI();
          const rawTx = {
            from: account,
            to: CBDC_ADDRESS,
            gas: gasLimit,
            maxFeePerGas: String(gasParams.maxFeePerGas),
            maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
            nonce: nonce,
            data: txData
          };
          console.log('Raw transaction:', rawTx);

          const approveResult = await withRetry(async (gasParams) => cbdc.methods.approve(BRIDGE_SRC_ADDRESS, weiAmount).send({
            from: account,
            gas: gasLimit,
            maxFeePerGas: String(gasParams.maxFeePerGas),
            maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
            nonce: nonce
          }));

          console.log('Approval successful. TxHash:', approveResult.transactionHash);

          // Re-check allowance
          const newAllowance = await withRetry(() => cbdc.methods.allowance(account, BRIDGE_SRC_ADDRESS).call());
          console.log(`New allowance: ${web3.utils.fromWei(newAllowance, 'ether')} CBDC`);
          if (web3.utils.toBN(newAllowance).lt(web3.utils.toBN(weiAmount))) {
            setStatus('❌ Approval did not set sufficient allowance. Please try again.');
            return;
          }
        } catch (approveErr) {
          if (approveErr.message.includes('User denied transaction signature')) {
            console.error('Transaction rejected by user');
            setStatus('❌ Transaction rejected by user');
          } else {
              console.error('Approve transaction failed:', approveErr.message);
              setStatus(`❌ Approve transaction failed: ${approveErr.message}`);
          }
          return;
        }
      }

      setStatus('Estimating gas for lock...');
      let lockGas;
      try {
        lockGas = await withRetry(() => bridge.methods.lock(weiAmount, destinationAddress).estimateGas({ from: account }));
        console.log(`Estimated gas for lock: ${lockGas}`);
      } catch (gasErr) {
        console.error('Gas estimation failed for lock:', gasErr.message);
        setStatus(`❌ Gas estimation failed for lock: ${gasErr.message}`);
        return;
      }

      setStatus('Testing lock call...');
      try {
        await withRetry(() => bridge.methods.lock(weiAmount, destinationAddress).call({ from: account }));
        console.log('Lock simulation successful');
      } catch (callErr) {
        console.error('Lock call reverted:', callErr.message);
        setStatus(`❌ Lock simulation failed: ${callErr.message}`);
        return;
      }

      setStatus('Locking tokens...');
      const gasParams = await getGasParameters();
      const lockGasLimit = web3.utils.toBN(lockGas).mul(web3.utils.toBN(3)).div(web3.utils.toBN(2)).toString();
      console.log('Lock gas limit:', lockGasLimit);
      const lockNonce = customNonce ? String(parseInt(customNonce)) : String(await web3.eth.getTransactionCount(account, 'pending'));
      console.log('Lock transaction nonce:', lockNonce);

      const lockRawTx = {
        from: account,
        to: BRIDGE_SRC_ADDRESS,
        gas: lockGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: lockNonce,
        data: bridge.methods.lock(weiAmount, destinationAddress).encodeABI()
      };
      console.log('Lock raw transaction:', lockRawTx);

      const lockResult = await withRetry(async (gasParams) => bridge.methods.lock(weiAmount, destinationAddress).send({
        from: account,
        gas: lockGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: lockNonce
      }));
      console.log('Lock successful. TxHash:', lockResult.transactionHash);
      setStatus(`✅ Tokens locked in source bridge. Awaiting mint on Sepolia for ${destinationAddress}`);

      await debouncedUpdateBalances();
    } catch (err) {
      console.error('Bridge error:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        raw: err
      });
      if (err.message.includes('User denied transaction signature')) {
        setStatus('❌ Transaction rejected by user');
      } else {
        setStatus(`❌ Bridge error: ${err.message}`);
      }
    }
  };

  const bridgeToAmoy = async () => {
    if (!web3 || !account) {
      setStatus('❌ Web3 or account not initialized');
      return;
    }

    try {
      if (!destinationAddress) {
        setStatus('❌ Destination address cannot be empty');
        return;
      }
      if (!web3.utils.isAddress(destinationAddress)) {
        setStatus('❌ Invalid destination address');
        return;
      }
      const weiAmount = web3.utils.toWei((amount || '0').toString(), 'ether');
      if (weiAmount === '0') {
        setStatus('❌ Please enter a valid amount to bridge');
        return;
      }

      setStatus('Checking balance...');
      const wrapped = new web3.eth.Contract(wrappedAbi.abi, WRAPPED_ADDRESS);
      const bridge = new web3.eth.Contract(bridgeDestAbi.abi, BRIDGE_DEST_ADDRESS);
      const userBalance = await withRetry(() => wrapped.methods.balanceOf(account).call());
      if (web3.utils.toBN(userBalance).lt(web3.utils.toBN(weiAmount))) {
        setStatus(`❌ Insufficient wrCBDC balance: ${web3.utils.fromWei(userBalance, 'ether')} available`);
        return;
      }

      setStatus('Estimating gas for approve...');
      let approveGas;
      try {
        approveGas = await withRetry(() => wrapped.methods.approve(BRIDGE_DEST_ADDRESS, weiAmount).estimateGas({ from: account }));
        console.log(`Estimated gas for approve: ${approveGas}`);
      } catch (gasErr) {
        console.error('Gas estimation failed for approve:', gasErr.message);
        setStatus(`❌ Gas estimation failed for approve: ${gasErr.message}`);
        return;
      }

      setStatus('Testing approve call...');
      try {
        await withRetry(() => wrapped.methods.approve(BRIDGE_DEST_ADDRESS, weiAmount).call({ from: account }));
        console.log('Approve simulation successful');
      } catch (callErr) {
        console.error('Approve call reverted:', callErr.message);
        setStatus(`❌ Approve simulation failed: ${callErr.message}`);
        return;
      }

      setStatus('Approving...');
      const gasParams = await getGasParameters();
      const approveGasLimit = web3.utils.toBN(approveGas).mul(web3.utils.toBN(3)).div(web3.utils.toBN(2)).toString();
      const approveNonce = customNonce ? String(parseInt(customNonce)) : String(await web3.eth.getTransactionCount(account, 'pending'));
      console.log('Approve transaction nonce:', approveNonce);
      console.log('Approve gas limit:', approveGasLimit);

      const approveRawTx = {
        from: account,
        to: WRAPPED_ADDRESS,
        gas: approveGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: approveNonce,
        data: wrapped.methods.approve(BRIDGE_DEST_ADDRESS, weiAmount).encodeABI()
      };
      console.log('Approve raw transaction:', approveRawTx);

      await withRetry(async (gasParams) => wrapped.methods.approve(BRIDGE_DEST_ADDRESS, weiAmount).send({
        from: account,
        gas: approveGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: approveNonce
      }));
      console.log('Approval successful');

      setStatus('Estimating gas for burn...');
      let burnGas;
      try {
        burnGas = await withRetry(() => bridge.methods.stageBurn(weiAmount, destinationAddress).estimateGas({ from: account }));
        console.log(`Estimated gas for burn: ${burnGas}`);
      } catch (gasErr) {
        console.error('Gas estimation failed for burn:', gasErr.message);
        setStatus(`❌ Gas estimation failed for burn: ${gasErr.message}`);
        return;
      }

      setStatus('Testing burn call...');
      try {
        await withRetry(() => bridge.methods.stageBurn(weiAmount, destinationAddress).call({ from: account }));
        console.log('Burn simulation successful');
      } catch (callErr) {
        console.error('Burn call reverted:', callErr.message);
        setStatus(`❌ Burn simulation failed: ${callErr.message}`);
        return;
      }

      setStatus('Staging burn...');
      const burnGasLimit = web3.utils.toBN(burnGas).mul(web3.utils.toBN(3)).div(web3.utils.toBN(2)).toString();
      const burnNonce = customNonce ? String(parseInt(customNonce)) : String(await web3.eth.getTransactionCount(account, 'pending'));
      console.log('Burn transaction nonce:', burnNonce);
      console.log('Burn gas limit:', burnGasLimit);

      const burnRawTx = {
        from: account,
        to: BRIDGE_DEST_ADDRESS,
        gas: burnGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: burnNonce,
        data: bridge.methods.stageBurn(weiAmount, destinationAddress).encodeABI()
      };
      console.log('Burn raw transaction:', burnRawTx);

      const burnResult = await withRetry(async (gasParams) => bridge.methods.stageBurn(weiAmount, destinationAddress).send({
        from: account,
        gas: burnGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: burnNonce
      }));
      console.log('Burn successful. TxHash:', burnResult.transactionHash);
      setStatus(`✅ Burn staged. Awaiting unlock on Amoy for ${destinationAddress}`);
      await debouncedUpdateBalances();
    } catch (err) {
      console.error('Bridge error:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        raw: err
      });
      if (err.message.includes('User denied transaction signature')) {
        setStatus('❌ Transaction rejected by user');
      } else {
        setStatus(`❌ Bridge error: ${err.message}`);
      }
    }
  };

  const debugUnlock = async () => {
    if (!web3 || !account) {
      setStatus('❌ Web3 or account not initialized');
      return;
    }

    try {
      if (chainId !== AMOY_CHAIN_ID) {
        setStatus('❌ Please switch to Polygon Amoy network for debug unlock');
        return;
      }
      if (!BRIDGE_SRC_ADDRESS) {
        setStatus('❌ Bridge source address not configured');
        return;
      }
      if (!destinationAddress) {
        setStatus('❌ Destination address cannot be empty');
        return;
      }
      if (!web3.utils.isAddress(destinationAddress)) {
        setStatus('❌ Invalid destination address');
        return;
      }
      const weiAmount = web3.utils.toWei((amount || '0').toString(), 'ether');
      if (weiAmount === '0') {
        setStatus('❌ Please enter a valid amount');
        return;
      }

      setStatus('Estimating gas for debug unlock...');
      const bridge = new web3.eth.Contract(bridgeSourceAbi.abi, BRIDGE_SRC_ADDRESS);
      let unlockGas;
      try {
        unlockGas = await withRetry(() => bridge.methods.unlock(destinationAddress, weiAmount).estimateGas({ from: account }));
        console.log(`Estimated gas for debug unlock: ${unlockGas}`);
      } catch (gasErr) {
        console.error('Gas estimation failed:', gasErr.message);
        setStatus(`❌ Gas estimation failed: ${gasErr.message}`);
        return;
      }

      setStatus('Testing unlock...');
      try {
        await withRetry(() => bridge.methods.unlock(destinationAddress, weiAmount).call({ from: account }));
        console.log('Unlock simulation successful');
      } catch (callErr) {
        console.error('Unlock call reverted:', callErr.message);
        setStatus(`❌ Unlock simulation failed: ${callErr.message}`);
        return;
      }

      setStatus('Performing debug unlock...');
      const gasParams = await getGasParameters();
      const unlockGasLimit = web3.utils.toBN(unlockGas).mul(web3.utils.toBN(3)).div(web3.utils.toBN(2)).toString();
      const unlockNonce = customNonce ? String(parseInt(customNonce)) : String(await web3.eth.getTransactionCount(account, 'pending'));
      console.log('Unlock transaction nonce:', unlockNonce);
      console.log('Unlock gas limit:', unlockGasLimit);

      const unlockRawTx = {
        from: account,
        to: BRIDGE_SRC_ADDRESS,
        gas: unlockGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: unlockNonce,
        data: bridge.methods.unlock(destinationAddress, weiAmount).encodeABI()
      };
      console.log('Unlock raw transaction:', unlockRawTx);

      const unlockResult = await withRetry(async (gasParams) => bridge.methods.unlock(destinationAddress, weiAmount).send({
        from: account,
        gas: unlockGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: unlockNonce
      }));
      console.log('Debug unlock successful. TxHash:', unlockResult.transactionHash);
      setStatus('✅ Debug unlock successful');
      await debouncedUpdateBalances();
    } catch (err) {
      console.error('Debug unlock error:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        raw: err
      });
      if (err.message.includes('User denied transaction signature')) {
        setStatus('❌ Transaction rejected by user');
      } else {
        setStatus(`❌ Debug unlock error: ${err.message}`);
      }
    }
  };

  const debugBurn = async () => {
    if (!web3 || !account) {
      setStatus('❌ Web3 or account not initialized');
      return;
    }

    try {
      if (chainId !== SEPOLIA_CHAIN_ID) {
        setStatus('❌ Please switch to Ethereum Sepolia network for debug burn');
        return;
      }
      if (!BRIDGE_DEST_ADDRESS) {
        setStatus('❌ Bridge destination address not configured');
        return;
      }
      if (!destinationAddress) {
        setStatus('❌ Destination address cannot be empty');
        return;
      }
      if (!web3.utils.isAddress(destinationAddress)) {
        setStatus('❌ Invalid destination address');
        return;
      }
      const weiAmount = web3.utils.toWei((amount || '0').toString(), 'ether');
      if (weiAmount === '0') {
        setStatus('❌ Please enter a valid amount');
        return;
      }

      setStatus('Checking balance...');
      const wrapped = new web3.eth.Contract(wrappedAbi.abi, WRAPPED_ADDRESS);
      const bridge = new web3.eth.Contract(bridgeDestAbi.abi, BRIDGE_DEST_ADDRESS);
      const userBalance = await withRetry(() => wrapped.methods.balanceOf(account).call());
      if (web3.utils.toBN(userBalance).lt(web3.utils.toBN(weiAmount))) {
        setStatus(`❌ Insufficient wrCBDC balance: ${web3.utils.fromWei(userBalance, 'ether')} available`);
        return;
      }

      setStatus('Estimating gas for approve...');
      let approveGas;
      try {
        approveGas = await withRetry(() => wrapped.methods.approve(BRIDGE_DEST_ADDRESS, weiAmount).estimateGas({ from: account }));
        console.log(`Estimated gas for approve: ${approveGas}`);
      } catch (gasErr) {
        console.error('Gas estimation failed:', gasErr.message);
        setStatus(`❌ Gas estimation failed: ${gasErr.message}`);
        return;
      }

      setStatus('Testing approve call...');
      try {
        await withRetry(() => wrapped.methods.approve(BRIDGE_DEST_ADDRESS, weiAmount).call({ from: account }));
        console.log('Approve simulation successful');
      } catch (callErr) {
        console.error('Approve call reverted:', callErr.message);
        setStatus(`❌ Approve simulation failed: ${callErr.message}`);
        return;
      }

      setStatus('Approving...');
      const gasParams = await getGasParameters();
      const approveGasLimit = web3.utils.toBN(approveGas).mul(web3.utils.toBN(3)).div(web3.utils.toBN(2)).toString();
      const approveNonce = customNonce ? String(parseInt(customNonce)) : String(await web3.eth.getTransactionCount(account, 'pending'));
      console.log('Approve transaction nonce:', approveNonce);
      console.log('Approve gas limit:', approveGasLimit);

      const approveRawTx = {
        from: account,
        to: WRAPPED_ADDRESS,
        gas: approveGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: approveNonce,
        data: wrapped.methods.approve(BRIDGE_DEST_ADDRESS, weiAmount).encodeABI()
      };
      console.log('Approve raw transaction:', approveRawTx);

      await withRetry(async (gasParams) => wrapped.methods.approve(BRIDGE_DEST_ADDRESS, weiAmount).send({
        from: account,
        gas: approveGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: approveNonce
      }));
      console.log('Approval successful');

      setStatus('Estimating gas for stage burn...');
      let stageBurnGas;
      try {
        stageBurnGas = await withRetry(() => bridge.methods.stageBurn(weiAmount, destinationAddress).estimateGas({ from: account }));
        console.log(`Estimated gas for stage burn: ${stageBurnGas}`);
      } catch (gasErr) {
        console.error('Gas estimation failed:', gasErr.message);
        setStatus(`❌ Gas estimation failed: ${gasErr.message}`);
        return;
      }

      setStatus('Testing stage burn call...');
      try {
        await withRetry(() => bridge.methods.stageBurn(weiAmount, destinationAddress).call({ from: account }));
        console.log('Stage burn simulation successful');
      } catch (callErr) {
        console.error('Stage burn call reverted:', callErr.message);
        setStatus(`❌ Stage burn simulation failed: ${callErr.message}`);
        return;
      }

      setStatus('Staging burn...');
      const stageBurnGasLimit = web3.utils.toBN(stageBurnGas).mul(web3.utils.toBN(3)).div(web3.utils.toBN(2)).toString();
      const stageBurnNonce = customNonce ? String(parseInt(customNonce)) : String(await web3.eth.getTransactionCount(account, 'pending'));
      console.log('Stage burn transaction nonce:', stageBurnNonce);
      console.log('Stage burn gas limit:', stageBurnGasLimit);

      const stageBurnRawTx = {
        from: account,
        to: BRIDGE_DEST_ADDRESS,
        gas: stageBurnGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: stageBurnNonce,
        data: bridge.methods.stageBurn(weiAmount, destinationAddress).encodeABI()
      };
      console.log('Stage burn raw transaction:', stageBurnRawTx);

      const stageBurnResult = await withRetry(async (gasParams) => bridge.methods.stageBurn(weiAmount, destinationAddress).send({
        from: account,
        gas: stageBurnGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: stageBurnNonce
      }));
      console.log('Stage burn successful. TxHash:', stageBurnResult.transactionHash);

      setStatus('Estimating gas for confirm burn...');
      let confirmBurnGas;
      try {
        confirmBurnGas = await withRetry(() => bridge.methods.confirmBurn(account, weiAmount, 0).estimateGas({ from: account }));
        console.log(`Estimated gas for confirm burn: ${confirmBurnGas}`);
      } catch (gasErr) {
        console.error('Gas estimation failed:', gasErr.message);
        setStatus(`❌ Gas estimation failed: ${gasErr.message}`);
        return;
      }

      setStatus('Testing confirm burn call...');
      try {
        await withRetry(() => bridge.methods.confirmBurn(account, weiAmount, 0).call({ from: account }));
        console.log('Confirm burn simulation successful');
      } catch (callErr) {
        console.error('Confirm burn call reverted:', callErr.message);
        setStatus(`❌ Confirm burn simulation failed: ${callErr.message}`);
        return;
      }

      setStatus('Confirming burn...');
      const confirmBurnGasLimit = web3.utils.toBN(confirmBurnGas).mul(web3.utils.toBN(3)).div(web3.utils.toBN(2)).toString();
      const confirmBurnNonce = customNonce ? String(parseInt(customNonce)) : String(await web3.eth.getTransactionCount(account, 'pending'));
      console.log('Confirm burn transaction nonce:', confirmBurnNonce);
      console.log('Confirm burn gas limit:', confirmBurnGasLimit);

      const confirmBurnRawTx = {
        from: account,
        to: BRIDGE_DEST_ADDRESS,
        gas: confirmBurnGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: confirmBurnNonce,
        data: bridge.methods.confirmBurn(account, weiAmount, 0).encodeABI()
      };
      console.log('Confirm burn raw transaction:', confirmBurnRawTx);

      const confirmBurnResult = await withRetry(async (gasParams) => bridge.methods.confirmBurn(account, weiAmount, 0).send({
        from: account,
        gas: confirmBurnGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: confirmBurnNonce
      }));
      console.log('Confirm burn successful. TxHash:', confirmBurnResult.transactionHash);
      setStatus('✅ Debug burn successful');
      await debouncedUpdateBalances();
    } catch (err) {
      console.error('Debug burn error:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        raw: err
      });
      if (err.message.includes('User denied transaction signature')) {
        setStatus('❌ Transaction rejected by user');
      } else {
        setStatus(`❌ Debug burn error: ${err.message}`);
      }
    }
  };

  const checkRefundableBurns = async () => {
    if (!web3 || !account) {
      setStatus('❌ Web3 or account not initialized');
      return;
    }
    try {
      if (chainId !== SEPOLIA_CHAIN_ID) {
        setStatus('❌ Please switch to Ethereum Sepolia network to check refunds');
        return;
      }
      const bridge = new web3.eth.Contract(bridgeDestAbi.abi, BRIDGE_DEST_ADDRESS);
      const nonce = await withRetry(() => bridge.methods.burnNonce(account).call());
      let refundable = [];
      for (let i = 0; i < nonce; i++) {
        const amount = await withRetry(() => bridge.methods.stagedBurns(account, i).call());
        if (web3.utils.toBN(amount).gt(0)) {
          refundable.push({ nonce: i, amount: web3.utils.fromWei(amount, 'ether') });
        }
      }
      setRefundableBurns(refundable);
      setStatus(refundable.length > 0 ? '✅ Found refundable burns' : 'ℹ️ No refundable burns found');
    } catch (err) {
      console.error('Check refundable burns error:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        raw: err
      });
      setStatus(`❌ Error checking refundable burns: ${err.message}`);
    }
  };

  const refundBurn = async (nonce) => {
    if (!web3 || !account) {
      setStatus('❌ Web3 or account not initialized');
      return;
    }
    try {
      if (chainId !== SEPOLIA_CHAIN_ID) {
        setStatus('❌ Please switch to Ethereum Sepolia network to refund');
        return;
      }
      const bridge = new web3.eth.Contract(bridgeDestAbi.abi, BRIDGE_DEST_ADDRESS);
      setStatus('Estimating gas for refund...');
      let refundGas;
      try {
        refundGas = await withRetry(() => bridge.methods.refund(account, nonce).estimateGas({ from: account }));
        console.log(`Estimated gas for refund: ${refundGas}`);
      } catch (gasErr) {
        console.error('Gas estimation failed:', gasErr.message);
        setStatus(`❌ Gas estimation failed: ${gasErr.message}`);
        return;
      }

      setStatus('Testing refund...');
      try {
        await withRetry(() => bridge.methods.refund(account, nonce).call({ from: account }));
        console.log('Refund simulation successful');
      } catch (callErr) {
        console.error('Refund call reverted:', callErr.message);
        setStatus(`❌ Refund simulation failed: ${callErr.message}`);
        return;
      }

      setStatus('Refunding...');
      const gasParams = await getGasParameters();
      const refundGasLimit = web3.utils.toBN(refundGas).mul(web3.utils.toBN(3)).div(web3.utils.toBN(2)).toString();
      const refundNonce = customNonce ? String(parseInt(customNonce)) : String(await web3.eth.getTransactionCount(account, 'pending'));
      console.log('Refund transaction nonce:', refundNonce);
      console.log('Refund gas limit:', refundGasLimit);

      const refundRawTx = {
        from: account,
        to: BRIDGE_DEST_ADDRESS,
        gas: refundGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: refundNonce,
        data: bridge.methods.refund(account, nonce).encodeABI()
      };
      console.log('Refund raw transaction:', refundRawTx);

      const refundResult = await withRetry(async (gasParams) => bridge.methods.refund(account, nonce).send({
        from: account,
        gas: refundGasLimit,
        maxFeePerGas: String(gasParams.maxFeePerGas),
        maxPriorityFeePerGas: String(gasParams.maxPriorityFeePerGas),
        nonce: refundNonce
      }));
      console.log('Refund successful. TxHash:', refundResult.transactionHash);
      setStatus('✅ Refund successful');
      setRefundableBurns(refundableBurns.filter(burn => burn.nonce !== nonce));
      await debouncedUpdateBalances();
    } catch (err) {
      console.error('Refund error:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        raw: err
      });
      if (err.message.includes('User denied transaction signature')) {
        setStatus('❌ Transaction rejected by user');
      } else {
        setStatus(`❌ Refund error: ${err.message}`);
      }
    }
  };

  function displayModal(msg, b1text, b2text, b3text, b0text) {
    this.setState({
      showm: true, 
      modalmsg: msg, 
      button1text: b1text,
      button2text: b2text,
      button3text: b3text,
      button0text: b0text,
    });
  } // displayModal()
  
  function hideModal() {
    this.setState({ showm: false });
  }; // hideModal

  return (
    <>
          <center>
          <div class="outer">
          <div class="swap-container">
          <h1>Cross Chain Bridging</h1>
          <br/>
          <form class="swap-form">
              <div class="input-group">
                <table class="input-group">
                  <tr><td><strong>Bridge:</strong></td><td>Polygon Amoy &lt; - &gt; Ethereum Sepolia</td></tr>
                  <tr><td><strong>Connected wallet:</strong></td><td></td></tr>
                  <tr><td colspan="2"><small>{account || 'Not connected'}</small></td></tr>
                  <tr><td><strong>Network:</strong></td><td>
                    {
                  chainId === null ? 'Loading...' :
                  chainId === AMOY_CHAIN_ID ? 'Polygon Amoy' :
                  chainId === SEPOLIA_CHAIN_ID ? 'Ethereum Sepolia' :
                  `Unknown (${chainId})`
                  }
                  </td></tr>
                  <tr><td><strong>CBDC Balance:</strong></td><td>{balance} {chainId === AMOY_CHAIN_ID ? 'CBDC' : ''}</td></tr>
                  <tr><td><strong>wrCBDC Balance:</strong></td><td>{wrBalance} {chainId === SEPOLIA_CHAIN_ID ? 'wrCBDC' : ''}</td></tr>
                {isAdmin ? <tr><td><strong>Admin Status:</strong></td><td> ✅ Admin</td></tr> : ""}
                </table>
                <br/>
                <label>Amount to Bridge</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border p-2 mt-1 w-full rounded"
                  placeholder="Enter amount to bridge"
                />

                <label>
                  {chainId === AMOY_CHAIN_ID ? 'Sepolia Destination Address' : 'Amoy Destination Address'}
                </label>
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="border p-2 mt-1 w-full rounded"
                  placeholder="Enter destination wallet address"
                />
              </div>

                {chainId === AMOY_CHAIN_ID && (
                <button 
                  type="button"
                  class="uniswap"
                  onClick={bridgeToSepolia}
                >
                  Bridge CBDC to Sepolia
                  </button>
                )}
                <br/>              
            {chainId === SEPOLIA_CHAIN_ID && parseFloat(wrBalance) > 0 && (
              <button
                type="button"
                class="uniswap"
                onClick={bridgeToAmoy}
              >
                Reverse Bridge wrCBDC to Amoy
              </button>
            )}
          </form>
          <br/>
          
            { status != "" &&
          <div style={{ textAlign: 'left', backgroundColor: 'white', width: '100%', fontSize: '1.2rem', border: '0px solid black' }}>
                <small><strong>Status:</strong> {status}</small>
          </div>
          }
          
          {showToast && <Toast message="Only admin wallet can mint CBDC tokens" onClose={() => setShowToast(false)} />}

          </div> 
          </div>

          </center>
    </>
  );
};

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
    <div className="flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4">✖</button>
    </div>
  </div>
);

export default Bridge;