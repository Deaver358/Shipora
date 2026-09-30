import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../interceptors/api";
import "../index.css";

function ShipmentDetails() {
  const navigate = useNavigate();
  const { shipmentId } = useParams();

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const loadShipment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`shipments/${shipmentId}`);
      setShipment(response.data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load this shipment."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shipmentId) {
      loadShipment();
    }
  }, [shipmentId]);

  const status = String(shipment?.status || "")
    .toUpperCase()
    .replace(/-/g, "_");

  const statusLabel = useMemo(() => {
    const labels = {
      PENDING_PAYMENT: "Pending Payment",
      ASSIGNED: "Assigned",
      PICKED_UP: "Picked Up",
      IN_TRANSIT: "In Transit",
      OUT_FOR_DELIVERY: "Out for Delivery",
      DELIVERED: "Delivered",
      COMPLETED: "Completed",
      DISPUTED: "Disputed",
      CANCELLED: "Cancelled",
    };

    return labels[status] || shipment?.status || "Unknown";
  }, [status, shipment]);

  const formatMoney = (amount) => {
    if (amount === null || amount === undefined) {
      return "—";
    }

    return `₦${(Number(amount) / 100).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatDate = (value) => {
    if (!value) return "—";

    try {
      return new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const handleConfirmDelivery = async () => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      setError("");

      const response = await api.post(
        `shipments/${shipmentId}/confirm`
      );

      setShipment(response.data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to confirm delivery."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim() || actionLoading) return;

    try {
      setActionLoading(true);
      setError("");

      const response = await api.post(
        `shipments/${shipmentId}/dispute`,
        {
          reason: disputeReason.trim(),
        }
      );

      setShipment(response.data);
      setShowDispute(false);
      setDisputeReason("");
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to submit the dispute."
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="shipment-details-page">
        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          Loading shipment...
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="shipment-details-page">
        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h2>Shipment unavailable</h2>
          <p>
            {error || "This shipment could not be found."}
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ marginTop: "20px" }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const shipmentIdDisplay =
    shipment.tracking_number ||
    shipment.public_token ||
    shipment.shipment_id ||
    shipmentId;

  const media = Array.isArray(shipment.media)
    ? shipment.media
    : Array.isArray(shipment.images)
      ? shipment.images.map((url) => ({
          type: "image",
          url,
        }))
      : [];

  const itemName =
    shipment.item_name ||
    shipment.itemName ||
    "Shipment";

  const description =
    shipment.description ||
    shipment.note ||
    "No package description provided.";

  const pickup =
    shipment.pickup ||
    shipment.pickup_location ||
    "Pickup location";

  const destination =
    shipment.destination ||
    "Destination";

  const recipientName =
    shipment.recipient_name ||
    shipment.recipientName ||
    "—";

  const recipientPhone =
    shipment.recipient_phone ||
    shipment.recipientPhone ||
    "—";

  const paymentStatus =
    shipment.payment_status || "—";

  const statusClass = status
    .toLowerCase()
    .replace(/_/g, "-");

  const showConfirm =
    status === "DELIVERED" &&
    paymentStatus !== "RELEASED";

  const showDisputeButton =
    status === "DELIVERED";

  return (
    <div className="shipment-details-page">

      <button
        type="button"
        className="white-page-back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        ←
      </button>

      <br />
      <br />

      {/* ================= HEADER ================= */}

      <header className="shipment-details-header">

        <div>
          <span>SHIPMENT DETAILS</span>

          <h1>{shipmentIdDisplay}</h1>
        </div>

        <div
          className={`shipment-header-status ${statusClass}`}
        >
          <i></i>
          {statusLabel}
        </div>

      </header>

      <main className="shipment-details-content">

        {error && (
          <div
            style={{
              padding: "14px 16px",
              marginBottom: "20px",
              borderRadius: "10px",
              background: "#fff1f1",
              color: "#b42318",
            }}
          >
            {error}
          </div>
        )}

        {/* ================= PAYMENT STATUS ================= */}

        <section className="shipment-status-card">

          <div className="shipment-status-icon">
            ✓
          </div>

          <div>
            <span>PAYMENT STATUS</span>

            <h2>
              {paymentStatus === "HELD"
                ? "HELD FOR DELIVERY"
                : paymentStatus}
            </h2>

            <p>
              The delivery amount is protected and will be
              released according to the shipment completion
              and dispute process.
            </p>
          </div>

        </section>

        {/* ================= ROUTE ================= */}

        <section className="shipment-detail-card">

          <div className="detail-card-heading">
            <div>
              <span>SHIPMENT ROUTE</span>
              <h2>Pickup & delivery</h2>
            </div>
          </div>

          <div className="shipment-detail-route">

            <div className="detail-route-item">

              <span className="route-dot pickup"></span>

              <div>
                <small>PICKUP</small>
                <strong>{pickup}</strong>
              </div>

            </div>

            <div className="detail-route-line"></div>

            <div className="detail-route-item">

              <span className="route-dot destination"></span>

              <div>
                <small>DESTINATION</small>
                <strong>{destination}</strong>
              </div>

            </div>

          </div>

        </section>

        {/* ================= PACKAGE ================= */}

        <section className="shipment-detail-card">

          <div className="detail-card-heading">

            <div>
              <span>PACKAGE</span>
              <h2>Shipment information</h2>
            </div>

          </div>

          <div className="shipment-info-grid">

            <div>
              <small>ITEM</small>
              <strong>{itemName}</strong>
            </div>

            <div>
              <small>DESCRIPTION</small>
              <strong>{description}</strong>
            </div>

            <div>
              <small>RECIPIENT</small>
              <strong>{recipientName}</strong>
            </div>

            <div>
              <small>RECIPIENT PHONE</small>
              <strong>{recipientPhone}</strong>
            </div>

          </div>

        </section>

        {/* ================= PACKAGE MEDIA ================= */}

        <section className="shipment-detail-card shipment-media-card">

          <div className="detail-card-heading">

            <div>
              <span>PACKAGE MEDIA</span>

              <h2>Item photos & videos</h2>

              <p>
                Photos and videos provided for identification
                and delivery handling.
              </p>
            </div>

          </div>

          {media.length > 0 ? (

            <div className="shipment-media-grid">

              {media.map((file, index) => {

                const url =
                  typeof file === "string"
                    ? file
                    : file?.url;

                const type =
                  typeof file === "string"
                    ? "image"
                    : file?.type;

                if (!url) return null;

                return (
                  <div
                    className="shipment-media-item"
                    key={index}
                  >

                    {type === "video" ? (
                      <video
                        src={url}
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Shipment item ${index + 1}`}
                      />
                    )}

                  </div>
                );
              })}

            </div>

          ) : (

            <div className="shipment-media-empty">

              <div className="shipment-media-empty-icon">
                📦
              </div>

              <strong>
                No package media uploaded
              </strong>

              <p>
                Photos or videos of the item will appear
                here once they are uploaded.
              </p>

            </div>

          )}

        </section>

        {/* ================= PAYMENT ================= */}

        <section className="shipment-detail-card">

          <div className="detail-card-heading">

            <div>
              <span>DELIVERY PAYMENT</span>
              <h2>Payment arrangement</h2>
            </div>

          </div>

          <div className="shipment-payment-summary">

            <div>
              <small>DELIVERY FEE</small>

              <strong>
                {formatMoney(shipment.delivery_fee)}
              </strong>
            </div>

            <div>
              <small>PAID BY</small>

              <strong>
                {shipment.payment_by || "Vendor"}
              </strong>
            </div>

            <div>
              <small>STATUS</small>

              <strong className="held-status">
                {paymentStatus === "HELD"
                  ? "HELD FOR DELIVERY"
                  : paymentStatus}
              </strong>
            </div>

          </div>

        </section>

        {/* ================= DISPATCH STATUS ================= */}

        <div className="shipment-dispatch-empty">

          <div className="shipment-dispatch-empty-icon">
            🚚
          </div>

          <div className="shipment-dispatch-empty-content">

            <span className="shipment-dispatch-eyebrow">
              DISPATCH STATUS
            </span>

            <h3>
              {shipment.dispatcher_id
                ? "Dispatcher assigned"
                : "No dispatch assigned yet"}
            </h3>

            <p>
              {shipment.dispatcher_id
                ? "A dispatcher has been assigned to this shipment. Delivery progress will appear here as the shipment moves."
                : "Your shipment is currently waiting for a dispatcher. Once a dispatcher is assigned, delivery progress will appear here."}
            </p>

          </div>

        </div>

        {/* ================= DELIVERY CONFIRMATION ================= */}

        {showConfirm && (
          <section className="shipment-status-card">

            <div className="shipment-status-icon">
              ✓
            </div>

            <div style={{ width: "100%" }}>

              <span>DELIVERY CONFIRMATION</span>

              <h2>
                Dispatcher marked this shipment delivered
              </h2>

              <p>
                Please confirm that you received the
                shipment. Confirmation releases the held
                payment to the dispatcher.
              </p>

              <button
                type="button"
                onClick={handleConfirmDelivery}
                disabled={actionLoading}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  padding: "14px 18px",
                  border: "none",
                  borderRadius: "10px",
                  cursor: actionLoading
                    ? "not-allowed"
                    : "pointer",
                  fontWeight: 700,
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading
                  ? "Processing..."
                  : "Confirm Delivery"}
              </button>

            </div>

          </section>
        )}

        {/* ================= COMPLETED ================= */}

        {status === "COMPLETED" && (
          <section className="shipment-status-card">

            <div className="shipment-status-icon">
              ✓
            </div>

            <div>

              <span>DELIVERY COMPLETE</span>

              <h2>Payment Released</h2>

              <p>
                Delivery has been confirmed and the held
                payment has been released to the dispatcher.
              </p>

            </div>

          </section>
        )}

        {/* ================= DISPUTE ================= */}

        {showDisputeButton && (
          <section className="shipment-dispute-card">

            <div>

              <strong>
                Something wrong with the delivery?
              </strong>

              <p>
                You can dispute this delivery before the
                payment is released. The payment will remain
                held while Shipora reviews the issue.
              </p>

            </div>

            <button
              type="button"
              onClick={() => setShowDispute(true)}
              disabled={actionLoading}
            >
              Report an Issue
            </button>

          </section>
        )}

        {status === "DISPUTED" && (
          <section className="shipment-dispute-card">

            <div>

              <strong>
                Delivery dispute opened
              </strong>

              <p>
                Payment remains held while Shipora reviews
                the dispute.
              </p>

            </div>

          </section>
        )}

        {/* ================= DISPUTE FORM ================= */}

        {showDispute && (
          <section className="shipment-detail-card">

            <div className="detail-card-heading">

              <div>
                <span>REPORT AN ISSUE</span>

                <h2>
                  Tell us what happened
                </h2>
              </div>

            </div>

            <textarea
              value={disputeReason}
              onChange={(event) =>
                setDisputeReason(event.target.value)
              }
              placeholder="Describe the issue with this delivery..."
              rows={5}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                resize: "vertical",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "14px",
              }}
            >

              <button
                type="button"
                onClick={() => {
                  setShowDispute(false);
                  setDisputeReason("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDispute}
                disabled={
                  actionLoading ||
                  !disputeReason.trim()
                }
              >
                {actionLoading
                  ? "Submitting..."
                  : "Submit Dispute"}
              </button>

            </div>

          </section>
        )}

        {/* ================= TIMELINE ================= */}

        <section className="shipment-detail-card">

          <div className="detail-card-heading">

            <div>
              <span>SHIPMENT ACTIVITY</span>
              <h2>Current progress</h2>
            </div>

          </div>

          <div className="shipment-detail-timeline">

            {[
              ["PENDING_PAYMENT", "Shipment Created"],
              ["ASSIGNED", "Dispatcher Assigned"],
              ["PICKED_UP", "Picked Up"],
              ["IN_TRANSIT", "In Transit"],
              ["OUT_FOR_DELIVERY", "Out for Delivery"],
              ["DELIVERED", "Delivered"],
              ["COMPLETED", "Completed"],
            ].map(([timelineStatus, label]) => {

              const order = [
                "PENDING_PAYMENT",
                "ASSIGNED",
                "PICKED_UP",
                "IN_TRANSIT",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "COMPLETED",
              ];

              const currentIndex =
                order.indexOf(status);

              const itemIndex =
                order.indexOf(timelineStatus);

              const completed =
                currentIndex >= itemIndex &&
                currentIndex !== -1;

              const active =
                timelineStatus === status;

              return (
                <div
                  className={`detail-timeline-item ${
                    completed ? "completed" : ""
                  } ${active ? "active" : ""}`}
                  key={timelineStatus}
                >

                  <span>
                    {completed ? "✓" : ""}
                  </span>

                  <div>
                    <strong>{label}</strong>

                    {active && (
                      <p>
                        Current shipment status.
                      </p>
                    )}

                  </div>

                </div>
              );
            })}

          </div>

        </section>

      </main>

      {/* ================= BOTTOM NAVIGATION ================= */}

      <nav className="bottom-nav">

        <button
          className="bottom-nav-item"
          onClick={() => navigate("/Home")}
        >
          <svg viewBox="0 0 24 24" fill="none">

            <path
              d="M3 10.5L12 3L21 10.5V21H3V10.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            <path
              d="M9 21V14H15V21"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

          </svg>

          <span>Home</span>
        </button>

        <button
          className="bottom-nav-item active"
          onClick={() => navigate("/shipments")}
        >
          <svg viewBox="0 0 24 24" fill="none">

            <path
              d="M4 7.5L12 3L20 7.5V16.5L12 21L4 16.5V7.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            <path
              d="M4 7.5L12 12L20 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            <path
              d="M12 12V21"
              stroke="currentColor"
              strokeWidth="1.8"
            />

          </svg>

          <span>Shipments</span>
        </button>

        <button
          className="bottom-nav-item"
          onClick={() => navigate("/tracking")}
        >
          <svg viewBox="0 0 24 24" fill="none">

            <circle
              cx="12"
              cy="12"
              r="8.5"
              stroke="currentColor"
              strokeWidth="1.8"
            />

            <path
              d="M12 7V12L15.5 14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

          </svg>

          <span>Tracking</span>
        </button>

        <button
          className="bottom-nav-item"
          onClick={() => navigate("/dashboard")}
        >
          <svg viewBox="0 0 24 24" fill="none">

            <path
              d="M4 19V11"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M10 19V5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M16 19V9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M22 19V3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

          </svg>

          <span>Dashboard</span>
        </button>

      </nav>

    </div>
  );
}

export default ShipmentDetails;
