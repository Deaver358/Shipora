import { useState } from "react";
import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api/v1";

function Disputes() {
  const navigate = useNavigate();

  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const findShipment = async () => {
    const number = trackingNumber.trim();

    if (!number) {
      setError("Enter a tracking number.");
      return;
    }

    setLoading(true);
    setError("");
    setShipment(null);

    try {
      const response = await fetch(
        `${API_BASE}/shipments/tracking/${encodeURIComponent(number)}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json().catch(() => null);

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

    navigate(`/dispute/${shipment.shipment_id}`);
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

            {hasActiveDispute ? (
              <div className="dispute-hold-notice">
                <strong>
                  This shipment already has an active dispute.
                </strong>

                <p>
                  A new dispute cannot be created while the
                  existing dispute is being handled.
                </p>
              </div>
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