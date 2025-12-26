import React from "react";
import { Tree } from "react-organizational-chart"; // Recommended alternative
// If you were using a different library, adjust import accordingly
// Note: "react-organizational-chart" package uses <Tree> component

const ContractorDashboard = () => {
  // Sample hierarchical data
  const treeData = {
    name: "ADG (Root Project)",
    amount: "$50,000,000",
    status: "Active",
    children: [
      {
        name: "Tier-1 Contractor A (Civil Works)",
        amount: "$20,000,000",
        status: "Partially Paid (50%)",
        children: [
          {
            name: "Tier-2 Subcontractor B (Foundation)",
            amount: "$8,000,000",
            status: "Financed by BankA",
            children: [
              {
                name: "Tier-3 Supplier C (Concrete)",
                amount: "$3,000,000",
                status: "Awaiting Proof",
                children: [] // Leaf node
              },
              {
                name: "Tier-3 Labor Crew D",
                amount: "$1,500,000",
                status: "Paid in Full",
                children: []
              }
            ]
          },
          {
            name: "Tier-2 Equipment Supplier E",
            amount: "$4,000,000",
            status: "Token Minted",
            children: []
          }
        ]
      },
      {
        name: "Tier-1 Contractor B (Electrical & HVAC)",
        amount: "$15,000,000",
        status: "Milestone Pending",
        children: [] // Can expand later
      }
    ]
  };

  // Recursive Node Component
  const Node = ({ data }) => (
    <div style={{
      padding: "10px",
      margin: "10px",
      border: "2px solid #535353",
      borderRadius: "8px",
      backgroundColor: data.status.includes("Paid") ? "#d4edda" : 
                      data.status.includes("Awaiting") ? "#fff3cd" : "#f8f9fa",
      display: "inline-block",
      minWidth: "200px",
      textAlign: "center"
    }}>
      <strong>{data.name}</strong><br/>
      <small>{data.amount}</small><br/>
      <em>{data.status}</em>
    </div>
  );

  // Recursive Tree Renderer
  const RecursiveTree = ({ data }) => (
    <Tree label={<Node data={data} />}>
      {data.children.map((child, i) => (
        <RecursiveTree key={i} data={child} />
      ))}
    </Tree>
  );

  return (
    <div className="container">
      <header className="jumbotron">
        <h3 className="center">Contractor Dashboard – Deep Tier Tokenized Payables</h3>
      </header>

      <div className="card">
        <h4>Project Payment Hierarchy (Up to 9 Tiers Supported)</h4>
        <div style={{ overflowX: "auto", padding: "20px" }}>
          <RecursiveTree data={treeData} />
        </div>

        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <button className="m-3 btn btn-primary">
            Mint Child Token
          </button>
          <button className="m-3 btn btn-success">
            Submit Payment Proof
          </button>
          <button className="m-3 btn btn-info">
            Request Financing from Bank
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: "30px" }}>
        <h4>Your Tokens</h4>
        <table style={{ width: "100%", marginTop: "10px" }}>
          <thead>
            <tr>
              <th>Token ID</th>
              <th>Amount</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#TP001</td>
              <td>$8,000,000</td>
              <td>Tier-2</td>
              <td>50% Released</td>
              <td>
                <button className="btn btn-sm btn-outline-primary">View</button>
              </td>
            </tr>
            {/* Add more rows dynamically */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractorDashboard;