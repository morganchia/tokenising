import React from 'react';

const RepoTradeActions = ({
  web3,
  account,
  repoContract,
  tradeId,
  setTradeId,
  tradeDetails,
  currentTime,
  onFetchTrade,
  onStartTrade,
  onMatureTrade,
  onCancelTrade
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Trade ID</label>
        <input
          type="number"
          value={tradeId}
          onChange={(e) => setTradeId(e.target.value)}
          placeholder="Enter Trade ID"
          className="border p-2 rounded w-full mb-2"
        />
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onFetchTrade}
          className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 flex-1"
          disabled={!repoContract || !tradeId}
        >
          Fetch Trade
        </button>
        <button
          onClick={onStartTrade}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 flex-1"
          disabled={!repoContract || !tradeId || (tradeDetails && tradeDetails.status !== '0')}
        >
          Start Trade
        </button>
        <button
          onClick={onMatureTrade}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 flex-1"
          disabled={!repoContract || !tradeId || (tradeDetails && tradeDetails.status !== '1')}
        >
          Mature Trade
        </button>
        <button
          onClick={onCancelTrade}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600 flex-1"
          disabled={!repoContract || !tradeId || (tradeDetails && tradeDetails.status !== '0')}
        >
          Cancel Trade
        </button>
      </div>
      {tradeDetails && (
        <div className="mt-4">
          <p>Current Time (SGT): {new Date(currentTime * 1000).toLocaleString('en-SG')}</p>
        </div>
      )}
    </div>
  );
};

export default RepoTradeActions;