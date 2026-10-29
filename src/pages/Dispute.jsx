import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";
import { API_BASE_URL as CONFIG_API_BASE_URL } from "../config";

const API_BASE = CONFIG_API_BASE_URL;

function Disputes() {
  const navigate = useNavigate();
  const { shipmentId } = useParams();

  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // /dispute/:shipmentId — load the shipment and look it up by tracking number
  useEffect(() => {
    if (!shipmentId) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `${API_BASE}/shipments/${encodeURIComponent(shipmentId)}`,
          { credentials: "include", headers: { Accept: "application/json" } }
        );
        const data = await response.json().catch(() => null);

        if (!cancelled && response.ok && data?.tracking_number) {
          setTrackingNumber(data.tracking_number);
          findShipment(data.tracking_number);
        }
      } catch {
        // the user can still type the tracking number
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentId]);

  const findShipment = async (value) => {
    const number = String(
      typeof value === "string" ? value : trackingNumber
    ).trim();

    if (!number) {
      setError("Enter a tracking number.");
      return;
    }

    setLoading(true);
    setError("");
    setShipment(null);
    setShowForm(false);
    setSubmitted(false);

    try {
      // Authenticated lookup: only the vendor / dispatcher of the shipment
      const response = await fetch(
        `${API_BASE}/shipments/lookup/${encodeURIComponent(number)}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        navigate(
          `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "We couldn't find a shipment with that tracking number."
        );
      }

      setShipment(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to find this shipment. Please check the tracking number."
      );
    } finally {
      setLoading(false);
    }
  };

  const status =
    shipment?.status ||
    shipment?.shipment_status ||
    "unknown";

  const activeDispute =
    shipment?.dispute_status ||
    shipment?.dispute?.status ||
    null;

  const hasActiveDispute = [
    "open",
    "under_review",
    "in_consideration",
  ].includes(
    String(activeDispute || "").toLowerCase()
  );

  const handleReport = () => {
    if (!shipment?.shipment_id) return;

    setError("");
    setShowForm(true);
  };

  const submitDispute = async (event) => {
    event.preventDefault();

    if (!shipment?.shipment_id || submitting) return;

    if (reason.trim().length < 3) {
      setError("Please describe the issue in a few words.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/disputes`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          shipment_id: shipment.shipment_id,
          reason: reason.trim().slice(0, 255),
          description: description.trim() || null,
          evidence: [],
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = data?.detail;
        throw new Error(
          Array.isArray(detail)
            ? detail.map((item) => item?.msg).join(", ")
            : detail || "We couldn't submit this report. Please try again."
        );
      }

      setSubmitted(true);
      setShowForm(false);
      setShipment((current) => ({
        ...current,
        dispute_status: data?.status || "open",
        status: data?.shipment_status || "disputed",
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="dispute-page">
      <div className="dispute-shell">

        <button
          className="dispute-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <header className="dispute-header">
          <img
            src={shiporaLogo}
            alt="Shipora"
            className="dispute-header-icon"
          />

          <div>
            <p className="dispute-eyebrow">
              SHIPMENT SUPPORT
            </p>

            <h1>Report a Shipment Issue</h1>

            <p>
              Enter the shipment tracking number to find the
              shipment and report an issue.
            </p>
          </div>
        </header>

        <section className="dispute-form-card">

          <div className="dispute-form-section">
            <label className="dispute-label">
              Tracking Number
            </label>

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) =>
                  setTrackingNumber(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    findShipment();
                  }
                }}
                placeholder="Enter shipment tracking number"
                className="dispute-input"
              />

              <button
                type="button"
                className="dispute-submit-button"
                onClick={findShipment}
                disabled={loading}
              >
                {loading ? "Finding..." : "Find Shipment"}
              </button>
            </div>
          </div>

          {error && (
            <div className="dispute-inline-error">
              {error}
            </div>
          )}

        </section>

        {shipment && (
          <section className="dispute-shipment-card">

            <div>
              <span className="dispute-label">
                TRACKING NUMBER
              </span>

              <strong>
                {shipment.tracking_number ||
                  trackingNumber}
              </strong>
            </div>

            <div>
              <span className="dispute-label">
                SHIPMENT
              </span>

              <strong>
                {shipment.item_name ||
                  shipment.description ||
                  "Shipment"}
              </strong>
            </div>

            <div>
              <span className="dispute-label">
                STATUS
              </span>

              <strong>
                {String(status)
                  .replaceAll("_", " ")
                  .toUpperCase()}
              </strong>
            </div>

            {shipment.vendor_name && (
              <div>
                <span className="dispute-label">
                  VENDOR / CUSTOMER
                </span>

                <strong>
                  {shipment.vendor_name}
                </strong>

                {shipment.vendor_phone && (
                  <small>
                    {shipment.vendor_phone}
                  </small>
                )}
              </div>
            )}

            {shipment.dispatcher_name && (
              <div>
                <span className="dispute-label">
                  DISPATCHER
                </span>

                <strong>
                  {shipment.dispatcher_name}
                </strong>

                {shipment.dispatcher_phone && (
                  <small>
                    {shipment.dispatcher_phone}
                  </small>
                )}
              </div>
            )}

            {submitted ? (
              <div className="dispute-hold-notice">
                <strong>Your report has been submitted.</strong>

                <p>
                  Payment for this shipment is on hold while the
                  SHIPORA team reviews the issue. You'll get a
                  notification when it is resolved.
                </p>
              </div>
            ) : hasActiveDispute ? (
              <div className="dispute-hold-notice">
                <strong>
                  This shipment already has an active dispute.
                </strong>

                <p>
                  A new dispute cannot be created while the
                  existing dispute is being handled.
                </p>
              </div>
            ) : shipment.can_dispute === false ? (
              <div className="dispute-hold-notice">
                <strong>
                  This shipment can no longer be disputed.
                </strong>
              </div>
            ) : showForm ? (
              <form onSubmit={submitDispute}>
                <label className="dispute-label">
                  What went wrong?
                </label>

                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Item arrived damaged"
                  className="dispute-input"
                  maxLength={255}
                  required
                />

                <label className="dispute-label">
                  Details (optional)
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us what happened"
                  className="dispute-input"
                  rows={4}
                />

                <button
                  type="submit"
                  className="dispute-submit-button"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </form>
            ) : (
              <button
                className="dispute-submit-button"
                onClick={handleReport}
              >
                Report an Issue
              </button>
            )}

          </section>
        )}

      </div>
    </main>
  );
}

export default Disputes;