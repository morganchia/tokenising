import React, { useState } from 'react';

const RepoTradeForm = ({ onCreateTrade, onDeployContract }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    maturityDate: '',
    maturityTime: '',
    bondIsin: '',
    counterparty1Type: '0',
    bondAmount: '',
    startAmount: '',
    interestAmount: '',
    cashAmount: '',
    counterparty1: '',
    counterparty2: '',
    cashToken: '',
    bondToken: ''
  });
  const [deployWithoutTrade, setDeployWithoutTrade] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggleDeployWithoutTrade = () => {
    setDeployWithoutTrade(!deployWithoutTrade);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (deployWithoutTrade) {
      // Deploy contract without trade by passing an empty TradeInput
      onDeployContract();
    } else {
      // Convert SGT to UTC timestamps (subtract 8 hours = 28,800 seconds)
      const startDateTime = Math.floor(new Date(`${formData.startDate}T${formData.startTime}:00:00+08:00`).getTime() / 1000) - 28800;
      const maturityDateTime = Math.floor(new Date(`${formData.maturityDate}T${formData.maturityTime}:00:00+08:00`).getTime() / 1000) - 28800;

      const tradeInput = {
        startDateTime,
        maturityDateTime,
        bondIsin: formData.bondIsin,
        counterparty1RepoType: parseInt(formData.counterparty1Type),
        bondAmount: formData.bondAmount ? (parseFloat(formData.bondAmount) * 1e18).toString() : '0',
        startAmount: formData.startAmount ? (parseFloat(formData.startAmount) * 1e18).toString() : '0',
        interestAmount: formData.interestAmount ? (parseFloat(formData.interestAmount) * 1e18).toString() : '0',
        cashAmount: formData.cashAmount ? (parseFloat(formData.cashAmount) * 1e18).toString() : '0',
        counterparty1: formData.counterparty1 || '0x0000000000000000000000000000000000000000',
        counterparty2: formData.counterparty2 || '0x0000000000000000000000000000000000000000',
        cashToken: formData.cashToken || '0x0000000000000000000000000000000000000000',
        bondToken: formData.bondToken || '0x0000000000000000000000000000000000000000'
      };
      onCreateTrade(tradeInput);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Deploy Smart Contract only, without creating Trade</label>
        <input
          type="checkbox"
          checked={deployWithoutTrade}
          onChange={handleToggleDeployWithoutTrade}
          className="mt-1"
        />
      </div>
      {!deployWithoutTrade && (
        <>
          <div>
            <label className="block text-sm font-medium">Start Date (SGT)</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Start Time (SGT, Hours)</label>
            <input
              type="number"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              placeholder="0-23"
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Maturity Date (SGT)</label>
            <input
              type="date"
              name="maturityDate"
              value={formData.maturityDate}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Maturity Time (SGT, Hours)</label>
            <input
              type="number"
              name="maturityTime"
              value={formData.maturityTime}
              onChange={handleChange}
              placeholder="0-23"
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Bond ISIN</label>
            <input
              type="text"
              name="bondIsin"
              value={formData.bondIsin}
              onChange={handleChange}
              placeholder="US1234567890"
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Counterparty 1 Type</label>
            <select
              name="counterparty1Type"
              value={formData.counterparty1Type}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            >
              <option value="0">Repo</option>
              <option value="1">ReverseRepo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Bond Amount (Ether)</label>
            <input
              type="number"
              name="bondAmount"
              value={formData.bondAmount}
              onChange={handleChange}
              placeholder="1000"
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Start Amount (Ether)</label>
            <input
              type="number"
              name="startAmount"
              value={formData.startAmount}
              onChange={handleChange}
              placeholder="1000"
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Interest Amount (Ether)</label>
            <input
              type="number"
              name="interestAmount"
              value={formData.interestAmount}
              onChange={handleChange}
              placeholder="10"
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Cash Amount (Ether)</label>
            <input
              type="number"
              name="cashAmount"
              value={formData.cashAmount}
              onChange={handleChange}
              placeholder="1000"
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Counterparty 1 Address</label>
            <input
              type="text"
              name="counterparty1"
              value={formData.counterparty1}
              onChange={handleChange}
              placeholder="0x..."
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Counterparty 2 Address</label>
            <input
              type="text"
              name="counterparty2"
              value={formData.counterparty2}
              onChange={handleChange}
              placeholder="0x..."
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Cash Token Address</label>
            <input
              type="text"
              name="cashToken"
              value={formData.cashToken}
              onChange={handleChange}
              placeholder="0x..."
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Bond Token Address</label>
            <input
              type="text"
              name="bondToken"
              value={formData.bondToken}
              onChange={handleChange}
              placeholder="0x..."
              className="border p-2 rounded w-full"
            />
          </div>
        </>
      )}
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 w-full"
      >
        {deployWithoutTrade ? 'Deploy Contract' : 'Deploy Contract with Trade'}
      </button>
    </div>
  );
};

export default RepoTradeForm;