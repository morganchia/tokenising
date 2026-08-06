/**
 * Shared helper for deploying a new ERC1967Proxy pointing at a shared UUPS
 * implementation, calling initialize(...initArgs) at deploy time.
 *
 * Mirrors the proven proxy-deploy flow already used for TokenizedPayable in
 * dtscf.controller.js (gas estimate, balance check, gas-escalating retry with
 * signed-tx polling) so bond/campaign/pbm/repo/dvp controllers don't each need
 * their own copy of that ~140-line block.
 */

const fs = require('fs');
const path = require('path');

const PROXY_ABI_FILE = path.join(__dirname, '../abis/ERC1967Proxy.abi.json');
const PROXY_BYTECODE_FILE = path.join(__dirname, '../abis/ERC1967Proxy.bytecode.json');

const withTimeout = (promise, ms, label) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} TIMEOUT after ${ms}ms`)), ms)),
  ]);
};

const retryWithBackoff = async (fn, maxRetries = 5, baseDelay = 15000, shouldRetry = () => true) => {
  let gasMultiplier = 1.0;
  let priorityMultiplier = 1.0;
  let gasLimitMultiplier = 1.1;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(gasMultiplier, priorityMultiplier, gasLimitMultiplier);
    } catch (err) {
      if (!shouldRetry(err) || attempt === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      console.warn(`proxyDeploy retry attempt ${attempt} after ${delay}ms: ${err.message}`);
      gasMultiplier += 0.05;
      priorityMultiplier += 0.05;
      gasLimitMultiplier += 0.05;
    }
  }
};

/**
 * @param {object} opts
 * @param {object} opts.web3 - connected web3 instance (from setupWeb3())
 * @param {object} opts.signer - web3.eth.accounts.privateKeyToAccount(...) result
 * @param {string} opts.implAddressEnvVar - env var name holding the implementation address, e.g. "BOND_IMPLEMENTATION_ADDRESS_11155111"
 * @param {Array}  opts.targetAbi - ABI of the implementation contract, used to encode the initialize() call
 * @param {Array}  opts.initArgs - args passed to initialize()
 * @param {string} [opts.initMethod] - defaults to "initialize"
 * @param {number} [opts.timeoutSeconds] - defaults to 700 (matches dtscf.controller.js's TIMEOUT)
 * @param {function} [opts.sendLog] - optional progress callback
 * @returns {Promise<string>} deployed proxy address
 */
async function deployUUPSProxy(opts) {
  const {
    web3,
    signer,
    implAddressEnvVar,
    targetAbi,
    initArgs,
    initMethod = 'initialize',
    timeoutSeconds = 700,
    sendLog = () => {},
  } = opts;

  const implAddress = process.env[implAddressEnvVar];
  if (!implAddress || !web3.utils.isAddress(implAddress)) {
    throw new Error(`${implAddressEnvVar} is not set in .env. Run scripts/deployImplementation.js first.`);
  }

  sendLog(`Deploying proxy → implementation: ${implAddress}`);
  sendLog(`Deploying from account: ${signer.address}`);

  const proxyAbi = JSON.parse(fs.readFileSync(PROXY_ABI_FILE, 'utf8'));
  const proxyBytecode = JSON.parse(fs.readFileSync(PROXY_BYTECODE_FILE, 'utf8'));
  const initData = (new web3.eth.Contract(targetAbi)).methods[initMethod](...initArgs).encodeABI();
  const proxyContract = new web3.eth.Contract(proxyAbi);
  const deployTx = proxyContract.deploy({
    data: proxyBytecode,
    arguments: [implAddress, initData],
  });

  console.log('[deployUUPSProxy] DIAG: about to call estimateGas()');
  const estimateGasPromise = deployTx.estimateGas({ from: signer.address });
  console.log('[deployUUPSProxy] DIAG: estimateGas() call returned (promise created), racing against timeout');
  let gasEstimate = await withTimeout(estimateGasPromise, 15000, 'estimateGas').catch((error) => {
    console.error('[deployUUPSProxy] DIAG: Error while estimating gas fee:', error);
    return 4000000;
  });
  console.log('[deployUUPSProxy] DIAG: past estimateGas, gasEstimate =', gasEstimate);

  console.log('[deployUUPSProxy] DIAG: about to call getBalance()');
  const balance = await retryWithBackoff(
    () => withTimeout(web3.eth.getBalance(signer.address), 15000, 'getBalance'),
    3, 5000, (err) => err.message.includes('TIMEOUT')
  );
  console.log('[deployUUPSProxy] DIAG: past getBalance, balance =', balance);
  if (web3.utils.toBN(balance).lt(web3.utils.toBN(gasEstimate).mul(web3.utils.toBN('1000000000')))) {
    throw new Error('Insufficient funds for gas. Please ensure the system wallet has enough balance to cover deployment fees.');
  }

  console.log('[deployUUPSProxy] DIAG: about to call getChainId()');
  const chainId = await withTimeout(web3.eth.getChainId(), 15000, 'getChainId');
  console.log('[deployUUPSProxy] DIAG: past getChainId, chainId =', chainId);

  const startTime = Date.now();
  const maxWaitTime = timeoutSeconds * 1000;
  let deployedAddress = null;

  const deployWithRetry = async () => {
    try {
      return await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
        let currentGas = Math.floor(gasEstimate * innerGasLimitMultiplier);
        console.log('[deployUUPSProxy] DIAG: about to call getBlock(latest)');
        let latestBlock = await withTimeout(web3.eth.getBlock('latest'), 15000, 'getBlock');
        console.log('[deployUUPSProxy] DIAG: past getBlock, baseFeePerGas =', latestBlock.baseFeePerGas);
        let baseFee = BigInt(latestBlock.baseFeePerGas || await withTimeout(web3.eth.getGasPrice(), 15000, 'getGasPrice'));
        console.log('[deployUUPSProxy] DIAG: past baseFee resolution, baseFee =', baseFee.toString());
        // 30 gwei: comfortably clears Polygon Amoy's ~25 gwei minimum tip cap
        // (2 gwei was rejected outright with "gas price below minimum").
        let maxPriorityFee = BigInt(30000000000);
        let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) +
                           (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
        let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();
        // Pass nonce/chainId explicitly so signTransaction() takes its synchronous
        // fast path instead of internally fetching them over the network with no timeout.
        console.log('[deployUUPSProxy] DIAG: about to call getTransactionCount()');
        // 'pending' so a retry advances the nonce instead of resending an
        // identical already-submitted tx (which the node rejects as
        // "already known" - an error retryWithBackoff didn't treat as
        // retryable, causing a silent infinite loop).
        let nonce = await withTimeout(web3.eth.getTransactionCount(signer.address, 'pending'), 15000, 'getTransactionCount');
        console.log('[deployUUPSProxy] DIAG: past getTransactionCount, nonce =', nonce);

        const tx = {
          chainId,
          nonce,
          from: signer.address,
          data: deployTx.encodeABI(),
          gas: currentGas,
          maxFeePerGas: maxFeePerGas.toString(),
          maxPriorityFeePerGas,
        };

        console.log('[deployUUPSProxy] DIAG: about to call signTransaction()');
        const signedTx = await withTimeout(web3.eth.accounts.signTransaction(tx, signer.privateKey), 15000, 'signTransaction');
        console.log('[deployUUPSProxy] DIAG: past signTransaction');

        let hash;
        try {
          console.log('[deployUUPSProxy] DIAG: about to call sendSignedTransaction()');
          hash = await withTimeout(new Promise((resolve, reject) => {
            web3.eth.sendSignedTransaction(signedTx.rawTransaction)
              .once('transactionHash', resolve)
              .once('error', reject);
          }), 15000, 'sendSignedTransaction');
        } catch (err) {
          throw new Error(`Send failed: ${err.message}`);
        }
        sendLog(`Transaction hash: ${hash}`);

        let receipt = null;
        let pollAttempts = 0;
        const maxPollAttempts = 18; // ~3 minute timeout
        while (!receipt && pollAttempts < maxPollAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          receipt = await withTimeout(web3.eth.getTransactionReceipt(hash), 15000, 'getTransactionReceipt');
          pollAttempts++;
        }

        if (!receipt) throw new Error('not mined');
        if (!receipt.status) throw new Error('Deployment failed (status false)');

        deployedAddress = receipt.contractAddress;
        return receipt.contractAddress;
      }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT') || err.message.includes('already known'));
    } catch (err) {
      console.error('[deployUUPSProxy] deployWithRetry attempt failed:', err.message);
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error(`Timeout after ${timeoutSeconds} seconds`);
      }
      return await deployWithRetry();
    }
  };

  await deployWithRetry();
  if (!deployedAddress || !web3.utils.isAddress(deployedAddress)) {
    throw new Error('Deployment succeeded but no contract address was returned');
  }

  sendLog(`Deployment successful, address: ${deployedAddress}`);
  return deployedAddress;
}

module.exports = { deployUUPSProxy };
