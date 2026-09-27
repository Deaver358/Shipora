import { useState } from "react";
import "../index.css";

function AdminDisputes() {
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState("");
  const [resolved, setResolved] = useState(false);

  const disputes = [
    {
      id: "DSP-001",
      tracking: "SP-2048-921",
      customer: "John Doe",
      reason: "Delivery issue",
      date: "September 26, 2026",
      status: "Open",
    },
    {
      id: "DSP-002",
      tracking: "SP-2048-817",
      customer: "Sarah Smith",
      reason: "Shipment delay",
      date: "September 25, 2026",
      status: "Open",
    },
  ];

  const handleResolve = () => {
    setResolved(true);
  };

  return (
    <main className="admin-disputes-page">
      <section className="page-shell">

        <div className="page-top">
          <div>
            <span className="page-eyebrow">SHIPORA ADMIN</span>
            <h1>Disputes</h1>
            <p>
              Review shipment disputes and record their resolution.
            </p>
          </div>
        </div>

        <div className="admin-summary-grid">
          <div className="summary-card">
            <span>Open Disputes</span>
            <strong>02</strong>
          </div>

          <div className="summary-card">
            <span>Resolved</span>
            <strong>00</strong>
          </div>
        </div>

        <section className="admin-table-card">
          <div className="section-title">
            <span>DISPUTE CENTER</span>
            <h2>Open Disputes</h2>
          </div>

          <div className="admin-list">
            {disputes.map((dispute) => (
              <div className="admin-list-item" key={dispute.id}>

                <div>
                  <small>{dispute.id}</small>
                  <strong>{dispute.customer}</strong>
                  <span>{dispute.reason}</span>
                </div>

                <div>
                  <small>TRACKING</small>
                  <strong>{dispute.tracking}</strong>
                </div>

                <div>
                  <small>DATE</small>
                  <strong>{dispute.date}</strong>
                  <span className="status-pending">
                    {dispute.status}
                  </span>
                </div>

                <button
                  className="primary-small-button"
                  onClick={() => {
                    setSelected(dispute);
                    setResolved(false);
                  }}
                >
                  Review
                </button>

              </div>
            ))}
          </div>
        </section>
      </section>

      {selected && (
        <div
          className="modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="professional-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelected(null)}
            >
              ×
            </button>

            <span className="page-eyebrow">DISPUTE REVIEW</span>
            <h2>{selected.id}</h2>

            <div className="review-details">
              <div>
                <span>CUSTOMER</span>
                <strong>{selected.customer}</strong>
              </div>

              <div>
                <span>TRACKING NUMBER</span>
                <strong>{selected.tracking}</strong>
              </div>

              <div>
                <span>REASON</span>
                <strong>{selected.reason}</strong>
              </div>
            </div>

            <label className="field-label">
              Resolution
            </label>

            <textarea
              className="large-textarea"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Enter the resolution..."
              rows="5"
            />

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setSelected(null)}
              >
                Close
              </button>

              <button
                className="success-button"
                onClick={handleResolve}
              >
                Resolve Dispute
              </button>
            </div>

            {resolved && (
              <div className="action-message">
                Dispute resolution recorded.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminDisputes;