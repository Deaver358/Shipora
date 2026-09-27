import { useState } from "react";
import "../index.css";

function AdminVehicleKYC() {
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState("");

  const applications = [
    {
      id: "KYC-001",
      name: "David Logistics",
      type: "Dispatcher",
      vehicle: "Toyota Hiace",
      plate: "LAG-482-KD",
      submitted: "September 26, 2026",
      status: "Pending",
    },
    {
      id: "KYC-002",
      name: "Michael Transport",
      type: "Vendor",
      vehicle: "Mercedes Sprinter",
      plate: "ABC-219-LG",
      submitted: "September 25, 2026",
      status: "Pending",
    },
  ];

  const handleAction = (status) => {
    setAction(status);
    setSelected(null);
  };

  return (
    <main className="admin-kyc-page">
      <section className="page-shell">

        <div className="page-top">
          <div>
            <span className="page-eyebrow">SHIPORA ADMIN</span>
            <h1>Vehicle KYC</h1>
            <p>
              Review vehicle verification submissions and manage approval.
            </p>
          </div>
        </div>

        <div className="admin-summary-grid">
          <div className="summary-card">
            <span>Pending Review</span>
            <strong>02</strong>
          </div>

          <div className="summary-card">
            <span>Approved</span>
            <strong>00</strong>
          </div>

          <div className="summary-card">
            <span>Rejected</span>
            <strong>00</strong>
          </div>
        </div>

        <section className="admin-table-card">
          <div className="section-title">
            <span>VERIFICATION QUEUE</span>
            <h2>Vehicle Applications</h2>
          </div>

          <div className="admin-list">
            {applications.map((application) => (
              <div className="admin-list-item" key={application.id}>

                <div>
                  <small>{application.id}</small>
                  <strong>{application.name}</strong>
                  <span>{application.type}</span>
                </div>

                <div>
                  <small>VEHICLE</small>
                  <strong>{application.vehicle}</strong>
                  <span>{application.plate}</span>
                </div>

                <div>
                  <small>SUBMITTED</small>
                  <strong>{application.submitted}</strong>
                  <span className="status-pending">
                    {application.status}
                  </span>
                </div>

                <button
                  className="primary-small-button"
                  onClick={() => setSelected(application)}
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

            <span className="page-eyebrow">KYC REVIEW</span>
            <h2>{selected.name}</h2>

            <div className="review-details">
              <div>
                <span>ACCOUNT TYPE</span>
                <strong>{selected.type}</strong>
              </div>

              <div>
                <span>VEHICLE</span>
                <strong>{selected.vehicle}</strong>
              </div>

              <div>
                <span>PLATE NUMBER</span>
                <strong>{selected.plate}</strong>
              </div>

              <div>
                <span>APPLICATION ID</span>
                <strong>{selected.id}</strong>
              </div>
            </div>

            <div className="document-placeholder">
              Vehicle documents will appear here.
            </div>

            <div className="modal-actions">
              <button
                className="danger-button"
                onClick={() => handleAction("Rejected")}
              >
                Reject
              </button>

              <button
                className="success-button"
                onClick={() => handleAction("Approved")}
              >
                Approve
              </button>
            </div>

            {action && (
              <div className="action-message">
                Application marked as {action}.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminVehicleKYC;