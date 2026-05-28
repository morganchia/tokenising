import React, { useState } from "react";
import axios from "axios";

const DEFAULT_MATURITY = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

export default function DTSCFTestMetadata() {
  const [fields, setFields] = useState({
    contractAddress: "0xTEST",
    token_ID: "1",
    value: "1000",
    projectname: "My Test Project",
    milestonename: "Milestone 1",
    MID: "1",
    maturityDate: DEFAULT_MATURITY,
    conditions: "Upon delivery of goods.",
    originalValue: "",
    purchaseDescription: "",
    chainId: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setResult(null);
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...fields,
        token_ID: parseInt(fields.token_ID, 10),
        MID: parseInt(fields.MID, 10),
        originalValue: fields.originalValue !== "" ? fields.originalValue : null,
        chainId: fields.chainId !== "" ? parseInt(fields.chainId, 10) : null,
      };
      const res = await axios.post("/api/dtscf/testmetadata", payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = (label, key, opts = {}) => (
    <div className="mb-2">
      <label className="form-label fw-semibold mb-1" style={{ fontSize: 13 }}>{label}</label>
      <input
        className="form-control form-control-sm"
        value={fields[key]}
        onChange={e => set(key, e.target.value)}
        {...opts}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", padding: "0 16px" }}>
      <h4>Metadata Test — NFT name &amp; encryption preview</h4>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Builds the metadata JSON server-side without generating an image or uploading to Pinata.
        Set <strong>Chain ID</strong> to trigger the AES-256-GCM encrypted path and see what
        MetaMask / OpenSea would display.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            {inp("Project Name *", "projectname", { required: true })}
            {inp("Token ID *", "token_ID", { type: "number", required: true })}
            {inp("Value (SGD) *", "value", { type: "number", required: true })}
            {inp("Original Value (leave blank if unchanged)", "originalValue", { type: "number" })}
            {inp("Purchase Description", "purchaseDescription")}
          </div>
          <div className="col-md-6">
            {inp("Milestone Name", "milestonename")}
            {inp("Milestone ID (0 = no milestone)", "MID", { type: "number" })}
            {inp("Maturity Date (YYYY-MM-DD)", "maturityDate")}
            {inp("Conditions", "conditions")}
            {inp("Contract Address", "contractAddress")}
            {inp("Chain ID (blank = unencrypted, 11155111 = Sepolia, 80002 = Amoy)", "chainId", { type: "number" })}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-sm mt-2" disabled={loading}>
          {loading ? "Generating..." : "Generate Metadata"}
        </button>
      </form>

      {error && (
        <div className="alert alert-danger mt-3" style={{ fontSize: 13 }}>{error}</div>
      )}

      {result && (
        <div className="mt-4">
          {result.encryption_error && (
            <div className="alert alert-warning" style={{ fontSize: 13 }}>
              <strong>Encryption skipped:</strong> {result.encryption_error}
              <br />
              <span className="text-muted">Set <code>METADATA_ENCRYPTION_KEY</code> in the server <code>.env</code> to test the encrypted path. Plaintext metadata is shown below.</span>
            </div>
          )}

          {result.external_view && (
            <div className="card mb-3 border-warning">
              <div className="card-header bg-warning text-dark fw-semibold" style={{ fontSize: 13 }}>
                External view (MetaMask / OpenSea / Rarible) — plaintext fields on the encrypted envelope
              </div>
              <div className="card-body p-3">
                <div><strong>name:</strong> {result.external_view.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}><strong>image:</strong> {result.external_view.image}</div>
                <div style={{ fontSize: 12, color: "#888" }}>All other fields are encrypted ciphertext.</div>
              </div>
            </div>
          )}

          <div className="card mb-3">
            <div className="card-header fw-semibold" style={{ fontSize: 13 }}>
              Plaintext metadata (decrypted content — what a token holder sees after decryption)
            </div>
            <div className="card-body p-0">
              <pre style={{ margin: 0, padding: "12px", fontSize: 12, background: "#f8f9fa", borderRadius: "0 0 4px 4px", maxHeight: 400, overflow: "auto" }}>
                {JSON.stringify(result.plaintext, null, 2)}
              </pre>
            </div>
          </div>

          {result.envelope && (
            <div className="card mb-3">
              <div className="card-header fw-semibold" style={{ fontSize: 13 }}>
                Encrypted envelope (what is stored on Pinata / IPFS)
              </div>
              <div className="card-body p-0">
                <pre style={{ margin: 0, padding: "12px", fontSize: 12, background: "#f8f9fa", borderRadius: "0 0 4px 4px", maxHeight: 300, overflow: "auto" }}>
                  {JSON.stringify(result.envelope, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
