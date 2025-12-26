import React from "react";

const BankDashboard = () => {
  return (
    <div className="container">
      <h3 className="center">Bank Financing Dashboard</h3>
      <div className="card">
        <table>
          <thead><tr><th>Token ID</th><th>Amount</th><th>Contractor</th><th>Tier</th><th>Compliance</th><th>Action</th></tr></thead>
          <tbody>
            {/* Map requests */}
            <tr><td>123</td><td>$10,000</td><td>Tier-3 Sub</td><td>3</td><td>Compliant</td><td><button className="btn btn-primary">Approve & Fund</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BankDashboard;