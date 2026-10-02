import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";
import {
  getCached,
  setCached,
  clearCached,
} from "../utils/appCache";
import "../styles/change.css";

const SHIPMENTS_TTL = 30 * 1000;
const APPLICATIONS_TTL = 30 * 1000;

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

function VendorApplications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications({ force = false } = {}) {
    try {
      setError("");

      // --------------------------------------------------
      // SHOW CACHED APPLICATIONS IMMEDIATELY
      // --------------------------------------------------

      if (!force) {
        const cachedApplications = getCached(
          "vendor_applications"
        );

        if (Array.isArray(cachedApplications)) {
          setApplications(cachedApplications);
          setLoading(false);

          // Refresh silently in the background.
          loadApplications({ force: true });
          return;
        }
      }

      setLoading(true);

      // --------------------------------------------------
      // LOAD SHIPMENTS
      // --------------------------------------------------

      let shipments = null;

      if (!force) {
        shipments = getCached("vendor_shipments");
      }

      if (!Array.isArray(shipments)) {
        const shipmentsResponse = await api.get(
          "shipments/mine"
        );

        shipments = Array.isArray(shipmentsResponse.data)
          ? shipmentsResponse.data
          : [];

        setCached(
          "vendor_shipments",
          shipments,
          SHIPMENTS_TTL
        );
      }

      // --------------------------------------------------
      // LOAD APPLICATIONS FOR EACH SHIPMENT
      // --------------------------------------------------

      const results = await Promise.all(
        shipments.map(async (shipment) => {
          const cacheKey =
            `vendor_applications_${shipment.shipment_id}`;

          if (!force) {
            const cached = getCached(cacheKey);

            if (Array.isArray(cached)) {
              return cached.map((application) => ({
                ...application,
                shipment,
              }));
            }
          }

          try {
            const response = await api.get(
              `shipments/${shipment.shipment_id}/applications`
            );

            const shipmentApplications =
              Array.isArray(response.data)
                ? response.data
                : [];

            setCached(
              cacheKey,
              shipmentApplications,
              APPLICATIONS_TTL
            );

            return shipmentApplications.map(
              (application) => ({
                ...application,
                shipment,
              })
            );
          } catch {
            return [];
          }
        })
      );

      const flattenedApplications =
        results.flat();

      setApplications(flattenedApplications);

      setCached(
        "vendor_applications",
        flattenedApplications,
        APPLICATIONS_TTL
      );
    } catch (err) {
      console.error(
        "Failed to load applications:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load shipment applications."
      );
    } finally {
      setLoading(false);
    }
  }

  async function acceptApplication(applicationId) {
    try {
      setProcessingId(applicationId);
      setError("");

      await api.post(
        `shipments/applications/${applicationId}/accept`
      );

      // The application state has changed.
      clearCached("vendor_applications");

      // Clear individual shipment application caches.
      applications.forEach((application) => {
        if (application.shipment?.shipment_id) {
          clearCached(
            `vendor_applications_${application.shipment.shipment_id}`
          );
        }
      });

      // Shipment status may also have changed.
      clearCached("vendor_shipments");

      await loadApplications({ force: true });
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to accept this application."
      );
    } finally {
      setProcessingId(null);
    }
  }

  const pendingCount = useMemo(
    () =>
      applications.filter(
        (item) =>
          String(item.status).toLowerCase() ===
          "pending"
      ).length,
    [applications]
  );

  if (loading) {
    return (
      <div className="applications-shell">
        <div className="applications-loading">
          <div className="applications-spinner" />
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

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
              SHIPMENT MANAGEMENT
            </div>

            <h1>Delivery Applications</h1>

            <p>
              Review dispatchers who have applied to handle
              your shipments.
            </p>
          </div>

          <div className="applications-summary">
            <div className="summary-number">
              {applications.length}
            </div>

            <div>
              <strong>Total applications</strong>
              <span>
                {pendingCount} awaiting your decision
              </span>
            </div>
          </div>
        </section>

        {error && (
          <div className="applications-alert">
            <span>!</span>
            <p>{error}</p>
            <button
              onClick={() =>
                loadApplications({ force: true })
              }
            >
              Retry
            </button>
          </div>
        )}

        {!applications.length ? (
          <section className="applications-empty-state">
            <div className="empty-icon">↗</div>

            <h2>No applications yet</h2>

            <p>
              Dispatcher applications for your open shipments
              will appear here.
            </p>

            <button
              className="empty-action"
              onClick={() => navigate("/my-shipments")}
            >
              View My Shipments
            </button>
          </section>
        ) : (
          <section className="applications-grid">
            {applications.map((application) => {
              const shipment = application.shipment;

              const pending =
                String(application.status).toLowerCase() ===
                "pending";

              return (
                <article
                  className="application-card"
                  key={application.application_id}
                >
                  <div className="application-card-header">
                    <div className="application-reference">
                      <span className="reference-label">
                        SHIPMENT
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
                        Applied{" "}
                        {formatDate(
                          application.created_at
                        )}
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
                        {shipment?.pickup ||
                          "Not provided"}
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
                      <span>Dispatcher ID</span>

                      <strong>
                        {application.dispatcher_id
                          ? String(
                              application.dispatcher_id
                            ).slice(0, 12) + "..."
                          : "—"}
                      </strong>
                    </div>

                    <div className="application-info-item">
                      <span>Proposed fee</span>

                      <strong className="fee-value">
                        {formatMoney(
                          application.proposed_fee
                        )}
                      </strong>
                    </div>

                    <div className="application-info-item">
                      <span>Application type</span>

                      <strong>
                        {application.initiated_by ===
                        "VENDOR"
                          ? "Invitation"
                          : "Dispatcher"}
                      </strong>
                    </div>
                  </div>

                  {pending && (
                    <div className="application-card-actions">
                      <button
                        className="view-application-button"
                        onClick={() =>
                          navigate(
                            `/shipment/${shipment.shipment_id}`
                          )
                        }
                      >
                        View shipment
                      </button>

                      <button
                        className="accept-application-button"
                        disabled={
                          processingId ===
                          application.application_id
                        }
                        onClick={() =>
                          acceptApplication(
                            application.application_id
                          )
                        }
                      >
                        {processingId ===
                        application.application_id
                          ? "Accepting..."
                          : "Accept dispatcher"}
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

export default VendorApplications;