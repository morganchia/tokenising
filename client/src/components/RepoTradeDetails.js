import React from 'react';

const RepoTradeDetails = ({ tradeDetails }) => {
  return (
    <div className="space-y-2">
      <p><strong>Trade ID:</strong> {tradeDetails.tradeId}</p>
      <p><strong>Start DateTime (SGT):</strong> {new Date(tradeDetails.startDateTime * 1000).toLocaleString('en-SG')}</p>
      <p><strong>Maturity DateTime (SGT):</strong> {new Date(tradeDetails.maturityDateTime * 1000).toLocaleString('en-SG')}</p>
      <p><strong>Bond ISIN:</strong> {tradeDetails.bondIsin}</p>
      <p><strong>Counterparty 1 Type:</strong> {tradeDetails.counterparty1RepoType === '0' ? 'Repo' : 'ReverseRepo'}</p>
      <p><strong>Bond Amount:</strong> {tradeDetails.bondAmount} Ether</p>
      <p><strong>Start Amount:</strong> {tradeDetails.startAmount} Ether</p>
      <p><strong>Interest Amount:</strong> {tradeDetails.interestAmount} Ether</p>
      <p><strong>Cash Amount:</strong> {tradeDetails.cashAmount} Ether</p>
      <p><strong>Counterparty 1:</strong> {tradeDetails.counterparty1}</p>
      <p><strong>Counterparty 2:</strong> {tradeDetails.counterparty2}</p>
      <p><strong>Cash Token:</strong> {tradeDetails.cashToken}</p>
      <p><strong>Bond Token:</strong> {tradeDetails.bondToken}</p>
      <p><strong>Status:</strong> {['Pending', 'Started', 'Matured', 'Cancelled'][tradeDetails.status]}</p>
      {tradeDetails.endDate && (
        <p><strong>End Date (SGT):</strong> {new Date(tradeDetails.endDate * 1000).toLocaleString('en-SG')}</p>
      )}
    </div>
  );
};

export default RepoTradeDetails;