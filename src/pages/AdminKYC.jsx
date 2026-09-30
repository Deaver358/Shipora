import { useEffect, useMemo, useState } from "react";
import "../index.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1.0";

function getAuthHeaders() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getProfileName(profile) {
  const fullName = [
    profile.first_name,
    profile.middle_name,
    profile.surname,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    profile.business_name ||
    profile.dispatch_name ||
    "Unknown applicant"
  );
}

function getProfileId(profile, type) {
  if (type === "dispatcher") {
    return profile.dispatcher_id;
  }

  return profile.both_roles_id;
}

function getDocumentUrl(profile) {
  return profile.vehicle_document_url || "";
}

function normalizeStatus(status) {
  return String(status || "").toLowerCase();
}

function AdminKYC() {
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectReason, setShowRejectReason] = useState(false);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/admin/vehicle-kyc`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to load vehicle KYC applications."
        );
      }

      const dispatcherApplications = Array.isArray(data.dispatchers)
        ? data.dispatchers.map((profile) => ({
            ...profile,
            profileType: "dispatcher",
            accountType: "Dispatcher",
          }))
        : [];

      const bothApplications = Array.isArray(data.both_roles)
        ? data.both_roles.map((profile) => ({
            ...profile,
            profileType: "both",
            accountType: "Vendor + Dispatcher",
          }))
        : [];

      setApplications([
        ...dispatcherApplications,
        ...bothApplications,
      ]);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load vehicle KYC applications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const pendingApplications = useMemo(
    () =>
      applications.filter(
        (application) =>
          normalizeStatus(application.vehicle_verification_status) ===
          "pending"
      ),
    [applications]
  );

  const approvedCount = applications.filter(
    (application) =>
      normalizeStatus(application.vehicle_verification_status) ===
      "verified"
  ).length;

  const rejectedCount = applications.filter(
    (application) =>
      normalizeStatus(application.vehicle_verification_status) ===
      "rejected"
  ).length;

  const closeModal = () => {
    if (processing) return;

    setSelected(null);
    setShowRejectReason(false);
    setRejectReason("");
    setActionMessage("");
  };

  const approveApplication = async () => {
    if (!selected) return;

    const profileId = getProfileId(
      selected,
      selected.profileType
    );

    if (!profileId) {
      setError("This application does not have a valid profile ID.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setActionMessage("");

      const response = await fetch(
        `${API_URL}/admin/vehicle-kyc/${selected.profileType}/${profileId}/approve`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to approve this application."
        );
      }

      setActionMessage(
        data?.message || "Vehicle KYC approved."
      );

      await loadApplications();

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to approve this application."
      );
    } finally {
      setProcessing(false);
    }
  };

  const rejectApplication = async () => {
    if (!selected) return;

    const reason = rejectReason.trim();

    if (!reason) {
      setError("Please provide a rejection reason.");
      return;
    }

    const profileId = getProfileId(
      selected,
      selected.profileType
    );

    if (!profileId) {
      setError("This application does not have a valid profile ID.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setActionMessage("");

      const url =
        `${API_URL}/admin/vehicle-kyc/` +
        `${selected.profileType}/${profileId}/reject` +
        `?reason=${encodeURIComponent(reason)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to reject this application."
        );
      }

      setActionMessage(
        data?.message || "Vehicle KYC rejected."
      );

      await loadApplications();

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to reject this application."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="admin-kyc-page">
      <section className="page-shell">
        <div className="page-top">
          <div>
            <span className="page-eyebrow">
              SHIPORA ADMIN
            </span>

            <h1>Vehicle KYC</h1>

            <p>
              Review vehicle verification submissions and
              manage approval.
            </p>
          </div>

          <button
            type="button"
            className="primary-small-button"
            onClick={loadApplications}
            disabled={loading || processing}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="action-message error-message">
            {error}
          </div>
        )}

        <div className="admin-summary-grid">
          <div className="summary-card">
            <span>Pending Review</span>
            <strong>
              {String(pendingApplications.length).padStart(2, "0")}
            </strong>
          </div>

          <div className="summary-card">
            <span>Approved</span>
            <strong>
              {String(approvedCount).padStart(2, "0")}
            </strong>
          </div>

          <div className="summary-card">
            <span>Rejected</span>
            <strong>
              {String(rejectedCount).padStart(2, "0")}
            </strong>
          </div>
        </div>

        <section className="admin-table-card">
          <div className="section-title">
            <span>VERIFICATION QUEUE</span>
            <h2>Vehicle Applications</h2>
          </div>

          {loading ? (
            <div className="admin-empty-state">
              Loading vehicle verification applications...
            </div>
          ) : pendingApplications.length === 0 ? (
            <div className="admin-empty-state">
              No pending vehicle verification applications.
            </div>
          ) : (
            <div className="admin-list">
              {pendingApplications.map((application) => (
                <div
                  className="admin-list-item"
                  key={`${application.profileType}-${getProfileId(
                    application,
                    application.profileType
                  )}`}
                >
                  <div>
                    <small>
                      {application.profileType === "dispatcher"
                        ? "DISPATCHER"
                        : "BOTH ROLES"}
                    </small>

                    <strong>
                      {getProfileName(application)}
                    </strong>

                    <span>
                      {application.email || "No email"}
                    </span>
                  </div>

                  <div>
                    <small>VEHICLE</small>

                    <strong>
                      {application.vehicle_type || "—"}
                    </strong>

                    <span>
                      {application.vehicle_registration || "—"}
                    </span>
                  </div>

                  <div>
                    <small>SUBMITTED</small>

                    <strong>
                      {formatDate(application.created_at)}
                    </strong>

                    <span className="status-pending">
                      {application.vehicle_verification_status ||
                        "pending"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="primary-small-button"
                    onClick={() => {
                      setSelected(application);
                      setError("");
                      setActionMessage("");
                      setRejectReason("");
                      setShowRejectReason(false);
                    }}
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

      {selected && (
        <div
          className="modal-backdrop"
          onClick={closeModal}
        >
          <div
            className="professional-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeModal}
              disabled={processing}
              aria-label="Close"
            >
              ×
            </button>

            <span className="page-eyebrow">
              KYC REVIEW
            </span>

            <h2>{getProfileName(selected)}</h2>

            <div className="review-details">
              <div>
                <span>ACCOUNT TYPE</span>
                <strong>
                  {selected.accountType}
                </strong>
              </div>

              <div>
                <span>EMAIL</span>
                <strong>
                  {selected.email || "—"}
                </strong>
              </div>

              <div>
                <span>PHONE</span>
                <strong>
                  {selected.phone || "—"}
                </strong>
              </div>

              <div>
                <span>VEHICLE</span>
                <strong>
                  {selected.vehicle_type || "—"}
                </strong>
              </div>

              <div>
                <span>PLATE NUMBER</span>
                <strong>
                  {selected.vehicle_registration || "—"}
                </strong>
              </div>

              <div>
                <span>APPLICATION ID</span>
                <strong>
                  {getProfileId(
                    selected,
                    selected.profileType
                  ) || "—"}
                </strong>
              </div>

              <div>
                <span>VERIFICATION STATUS</span>
                <strong>
                  {selected.vehicle_verification_status ||
                    "pending"}
                </strong>
              </div>

              <div>
                <span>SUBMITTED</span>
                <strong>
                  {formatDate(selected.created_at)}
                </strong>
              </div>
            </div>

            {getDocumentUrl(selected) ? (
              <a
                className="document-placeholder"
                href={getDocumentUrl(selected)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open vehicle document
              </a>
            ) : (
              <div className="document-placeholder">
                No vehicle document URL is available.
              </div>
            )}

            {actionMessage && (
              <div className="action-message">
                {actionMessage}
              </div>
            )}

            {showRejectReason ? (
              <div className="reject-section">
                <label htmlFor="reject-reason">
                  Rejection reason
                </label>

                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(event) =>
                    setRejectReason(event.target.value)
                  }
                  placeholder="Explain why the vehicle documents are being rejected."
                  rows={4}
                  disabled={processing}
                />

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowRejectReason(false);
                      setRejectReason("");
                      setError("");
                    }}
                    disabled={processing}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="danger-button"
                    onClick={rejectApplication}
                    disabled={processing}
                  >
                    {processing
                      ? "Processing..."
                      : "Confirm Rejection"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-actions">
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    setShowRejectReason(true);
                    setError("");
                  }}
                  disabled={processing}
                >
                  Reject
                </button>

                <button
                  type="button"
                  className="success-button"
                  onClick={approveApplication}
                  disabled={processing}
                >
                  {processing
                    ? "Processing..."
                    : "Approve"}
                </button>
              </div>
            )}

            {error && (
              <div className="action-message error-message">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminKYC;