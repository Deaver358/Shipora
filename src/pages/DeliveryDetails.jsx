import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../interceptors/api";
import "../index.css";

function DeliveryDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const isJob = searchParams.get("mode") === "job";

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDelivery = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`shipments/${id}`);
      setDelivery(response.data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load this delivery."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && !isJob) {
      loadDelivery();
    } else {
      setLoading(false);
    }
  }, [id, isJob]);

  const status = String(delivery?.status || "")
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

    return labels[status] || delivery?.status || "Assigned";
  }, [status, delivery]);

  const nextAction = useMemo(() => {
    if (status === "ASSIGNED") {
      return {
        label: "Mark as Picked Up",
        endpoint: `shipments/${id}/pickup`,
      };
    }

    if (status === "PICKED_UP") {
      return {
        label: "Mark In Transit",
        endpoint: `shipments/${id}/in-transit`,
      };
    }

    if (status === "IN_TRANSIT") {
      return {
        label: "Mark Out for Delivery",
        endpoint: `shipments/${id}/out-for-delivery`,
      };
    }

    if (status === "OUT_FOR_DELIVERY") {
      return {
        label: "Mark Delivered",
        endpoint: `shipments/${id}/delivered`,
      };
    }

    return null;
  }, [status, id]);

  const handleStatusAction = async () => {
    if (!nextAction || actionLoading) return;

    try {
      setActionLoading(true);
      setError("");

      const response = await api.post(nextAction.endpoint);

      setDelivery(response.data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Unable to update delivery status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatMoney = (amount) => {
    if (amount === null || amount === undefined) return "—";

    // Backend stores monetary values in kobo.
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
      return new Date(value).toLocaleDateString(
        undefined,
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="delivery-details-page">
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading delivery...
        </div>
      </div>
    );
  }

  if (!isJob && !delivery) {
    return (
      <div className="delivery-details-page">
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2>Delivery unavailable</h2>
          <p>{error || "This delivery could not be found."}</p>

          <button
            onClick={() => navigate(-1)}
            style={{ marginTop: "20px" }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isJob) {
    return (
      <div className="delivery-details-page">
        <header className="delivery-details-header">
          <button
            className="delivery-details-back"
            onClick={() => navigate(-1)}
          >
            ←
          </button>

          <div>
            <span>DELIVERY DETAILS</span>
            <h1>{id}</h1>
          </div>

          <span className="delivery-details-status available">
            <i></i>
            Available
          </span>
        </header>

        <main className="delivery-details-content">
          <section className="delivery-details-status-card">
            <span>DELIVERY OPPORTUNITY</span>

            <h2>Available for Application</h2>

            <p>
              Apply for this delivery from the available
              delivery jobs section.
            </p>

            <button
              onClick={() => navigate(-1)}
              style={{ marginTop: "20px" }}
            >
              ← Back to Jobs
            </button>
          </section>
        </main>
      </div>
    );
  }

  const itemName = delivery.item_name || "Shipment";
  const description =
    delivery.description ||
    delivery.note ||
    "No package description provided.";

  const pickup = delivery.pickup || "Pickup location";
  const destination =
    delivery.destination || "Destination";

  const vehicle =
    delivery.vehicle_type ||
    delivery.vehicle_preference ||
    delivery.vehicle ||
    "—";

  const trackingNumber =
    delivery.tracking_number || "Not assigned";

  const image =
    delivery.image_url ||
    delivery.image ||
    null;

  const recipientName =
    delivery.recipient_name ||
    delivery.receiver_name ||
    "Protected";

  const recipientPhone =
    delivery.recipient_phone ||
    delivery.receiver_phone ||
    "Protected";

  const statusClass = status
    .toLowerCase()
    .replace(/_/g, "-");

  return (
    <div className="delivery-details-page">

      <header className="delivery-details-header">

        <button
          className="delivery-details-back"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <div>
          <span>DELIVERY DETAILS</span>
          <h1>
            {trackingNumber !== "Not assigned"
              ? trackingNumber
              : id}
          </h1>
        </div>

        <span
          className={`delivery-details-status ${statusClass}`}
        >
          <i></i>
          {statusLabel}
        </span>

      </header>

      <main className="delivery-details-content">

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

        {/* PACKAGE */}

        <section className="delivery-details-hero">

          <div className="delivery-details-image">
            {image ? (
              <img
                src={image}
                alt={itemName}
              />
            ) : (
              <span>📦</span>
            )}
          </div>

          <div>
            <span className="delivery-details-eyebrow">
              SHIPMENT ITEM
            </span>

            <h2>{itemName}</h2>

            <p>{description}</p>
          </div>

        </section>

        {/* ROUTE */}

        <section className="delivery-details-route">

          <div className="delivery-details-section-heading">
            <span>01</span>

            <div>
              <span>DELIVERY ROUTE</span>
              <h2>Pickup to destination</h2>
            </div>
          </div>

          <div className="delivery-details-route-box">

            <div className="delivery-details-route-point">

              <span className="delivery-details-route-dot pickup"></span>

              <div>
                <small>PICKUP</small>
                <strong>{pickup}</strong>
              </div>

            </div>

            <div className="delivery-details-route-line"></div>

            <div className="delivery-details-route-point">

              <span className="delivery-details-route-dot destination"></span>

              <div>
                <small>DESTINATION</small>
                <strong>{destination}</strong>
              </div>

            </div>

          </div>

        </section>

        {/* OVERVIEW */}

        <section className="delivery-details-overview">

          <div className="delivery-details-section-heading">
            <span>02</span>

            <div>
              <span>DELIVERY OVERVIEW</span>
              <h2>Assignment information</h2>
            </div>
          </div>

          <div className="delivery-details-info-grid">

            <div>
              <span>DELIVERY FEE</span>
              <strong>
                {formatMoney(delivery.delivery_fee)}
              </strong>
            </div>

            <div>
              <span>VEHICLE</span>
              <strong>{vehicle}</strong>
            </div>

            <div>
              <span>TRACKING NUMBER</span>
              <strong>{trackingNumber}</strong>
            </div>

            <div>
              <span>DATE</span>
              <strong>
                {formatDate(delivery.created_at)}
              </strong>
            </div>

          </div>

        </section>

        {/* CONTACT */}

        <section className="delivery-details-contact">

          <div className="delivery-details-section-heading">
            <span>03</span>

            <div>
              <span>CONTACT INFORMATION</span>
              <h2>Delivery contact</h2>
            </div>
          </div>

          <div className="delivery-details-protected">

            <div>
              <span>📥</span>

              <div>
                <small>RECIPIENT</small>
                <strong>{recipientName}</strong>
                <p>{recipientPhone}</p>
              </div>
            </div>

          </div>

        </section>

        {/* DISPATCHER ACTIONS */}

        {nextAction && (
          <section className="delivery-details-status-card">

            <span>DELIVERY ACTION</span>

            <h2>{nextAction.label}</h2>

            <p>
              Update the delivery after completing this
              stage of the shipment.
            </p>

            <button
              onClick={handleStatusAction}
              disabled={actionLoading}
              style={{
                marginTop: "18px",
                width: "100%",
                padding: "14px 18px",
                border: "none",
                borderRadius: "10px",
                cursor: actionLoading
                  ? "not-allowed"
                  : "pointer",
                opacity: actionLoading ? 0.7 : 1,
                fontWeight: 700,
              }}
            >
              {actionLoading
                ? "Updating..."
                : nextAction.label}
            </button>

          </section>
        )}

        {/* DELIVERED WAITING FOR VENDOR */}

        {status === "DELIVERED" && (
          <section className="delivery-details-status-card">

            <span>DELIVERY COMPLETED BY DISPATCHER</span>

            <h2>Awaiting Vendor Confirmation</h2>

            <p>
              You have marked this shipment as delivered.
              The vendor has been notified and must confirm
              delivery before the held payment is released.
            </p>

          </section>
        )}

        {/* COMPLETED */}

        {status === "COMPLETED" && (
          <section className="delivery-details-status-card">

            <span>DELIVERY COMPLETE</span>

            <h2>Payment Released</h2>

            <p>
              This shipment has been completed and the
              delivery payment has been released.
            </p>

          </section>
        )}

        {/* DISPUTED */}

        {status === "DISPUTED" && (
          <section className="delivery-details-status-card">

            <span>DELIVERY DISPUTED</span>

            <h2>Payment On Hold</h2>

            <p>
              The vendor has disputed this delivery.
              Payment remains on hold pending Shipora
              review.
            </p>

          </section>
        )}

      </main>

      {/* BOTTOM NAV */}

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

export default DeliveryDetails;
