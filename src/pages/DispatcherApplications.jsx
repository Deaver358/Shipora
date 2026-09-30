import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import "../styles/change.css";

function formatMoney(amount) {
  const value = Number(amount || 0) / 100;

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value.includes("accept")) return "is-accepted";
  if (value.includes("reject")) return "is-rejected";
  if (value.includes("pending")) return "is-pending";

  return "is-default";
}

function DispatcherApplications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "shipments/applications/mine"
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      const enriched = await Promise.all(
        data.map(async (application) => {
          try {
            const shipmentResponse = await api.get(
              `shipments/${application.shipment_id}`
            );

            return {
              ...application,
              shipment: shipmentResponse.data,
            };
          } catch {
            return {
              ...application,
              shipment: null,
            };
          }
        })
      );

      setApplications(enriched);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load your applications."
      );
    } finally {
      setLoading(false);
    }
  }

  async function acceptInvitation(applicationId) {
    try {
      setProcessingId(applicationId);
      setError("");

      await api.post(
        `shipments/applications/${applicationId}/accept-invitation`
      );

      await loadApplications();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to accept this invitation."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function declineInvitation(applicationId) {
    try {
      setProcessingId(applicationId);
      setError("");

      await api.post(
        `shipments/applications/${applicationId}/decline-invitation`
      );

      await loadApplications();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to decline this invitation."
      );
    } finally {
      setProcessingId(null);
    }
  }

  const invitations = applications.filter(
    (application) =>
      application.initiated_by === "VENDOR"
  );

  return (
    <div className="applications-shell">
      <main className="applications-container">
        <section className="applications-hero">
          <div>
            <button
              className="applications-back"
              onClick={() => navigate(-1)}
            >
              <span>←</span>
              Back
            </button>

            <div className="applications-eyebrow">
              DISPATCH OPERATIONS
            </div>

            <h1>My Applications</h1>

            <p>
              Track your delivery applications and manage
              invitations from vendors.
            </p>
          </div>

          <div className="applications-summary">
            <div className="summary-number">
              {applications.length}
            </div>

            <div>
              <strong>Total applications</strong>
              <span>
                {invitations.length} vendor invitation
                {invitations.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </section>

        {error && (
          <div className="applications-alert">
            <span>!</span>
            <p>{error}</p>
            <button onClick={loadApplications}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="applications-loading">
            <div className="applications-spinner" />
            <p>Loading your applications...</p>
          </div>
        ) : !applications.length ? (
          <section className="applications-empty-state">
            <div className="empty-icon">⌁</div>

            <h2>No applications yet</h2>

            <p>
              When you apply for delivery jobs or a vendor
              invites you, they will appear here.
            </p>

            <button
              className="empty-action"
              onClick={() => navigate("/dispatch-jobs")}
            >
              Find Delivery Jobs
            </button>
          </section>
        ) : (
          <section className="applications-grid">
            {applications.map((application) => {
              const shipment = application.shipment;

              const isInvitation =
                application.initiated_by === "VENDOR";

              const isPending =
                String(application.status).toLowerCase() ===
                "pending";

              return (
                <article
                  className={`application-card ${
                    isInvitation ? "invitation-card" : ""
                  }`}
                  key={application.application_id}
                >
                  <div className="application-card-header">
                    <div className="application-reference">
                      <span className="reference-label">
                        {isInvitation
                          ? "VENDOR INVITATION"
                          : "YOUR APPLICATION"}
                      </span>

                      <strong>
                        {shipment?.tracking_number || "—"}
                      </strong>
                    </div>

                    <span
                      className={`application-status ${statusClass(
                        application.status
                      )}`}
                    >
                      {application.status}
                    </span>
                  </div>

                  <div className="shipment-title">
                    <div className="shipment-icon">▣</div>

                    <div>
                      <h2>
                        {shipment?.item_name || "Shipment"}
                      </h2>

                      <span>
                        {isInvitation
                          ? `Invited ${formatDate(
                              application.created_at
                            )}`
                          : `Applied ${formatDate(
                              application.created_at
                            )}`}
                      </span>
                    </div>
                  </div>

                  <div className="route-box">
                    <div className="route-line">
                      <span className="route-dot pickup" />
                      <span className="route-connector" />
                      <span className="route-dot destination" />
                    </div>

                    <div className="route-location">
                      <small>PICKUP</small>
                      <strong>
                        {shipment?.pickup || "Not provided"}
                      </strong>
                    </div>

                    <div className="route-location">
                      <small>DESTINATION</small>
                      <strong>
                        {shipment?.destination ||
                          "Not provided"}
                      </strong>
                    </div>
                  </div>

                  <div className="application-info-row">
                    <div className="application-info-item">
                      <span>Delivery fee</span>
                      <strong className="fee-value">
                        {formatMoney(
                          application.proposed_fee
                        )}
                      </strong>
                    </div>

                    <div className="application-info-item">
                      <span>Shipment status</span>
                      <strong>
                        {shipment?.status || "—"}
                      </strong>
                    </div>

                    <div className="application-info-item">
                      <span>Application</span>
                      <strong>
                        {isInvitation
                          ? "Vendor invitation"
                          : "Dispatcher application"}
                      </strong>
                    </div>
                  </div>

                  {isInvitation && isPending && (
                    <div className="application-card-actions">
                      <button
                        className="decline-application-button"
                        disabled={
                          processingId ===
                          application.application_id
                        }
                        onClick={() =>
                          declineInvitation(
                            application.application_id
                          )
                        }
                      >
                        {processingId ===
                        application.application_id
                          ? "Processing..."
                          : "Decline"}
                      </button>

                      <button
                        className="accept-application-button"
                        disabled={
                          processingId ===
                          application.application_id
                        }
                        onClick={() =>
                          acceptInvitation(
                            application.application_id
                          )
                        }
                      >
                        {processingId ===
                        application.application_id
                          ? "Accepting..."
                          : "Accept invitation"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default DispatcherApplications;