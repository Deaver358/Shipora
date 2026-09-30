import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api/v1";

function Tracking() {
  const navigate = useNavigate();

  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const statusSteps = [
    {
      key: "pending_payment",
      label: "Shipment Created",
      description:
        "The shipment has been created and is awaiting payment.",
    },
    {
      key: "open",
      label: "Available for Dispatch",
      description:
        "The shipment is available for verified dispatch matching.",
    },
    {
      key: "assigned",
      label: "Dispatch Assigned",
      description:
        "A verified dispatch has accepted the shipment.",
    },
    {
      key: "picked_up",
      label: "Picked Up",
      description:
        "The dispatch has collected the shipment.",
    },
    {
      key: "in_transit",
      label: "In Transit",
      description:
        "The shipment is currently moving toward its destination.",
    },
    {
      key: "out_for_delivery",
      label: "Out for Delivery",
      description:
        "The dispatch is completing the final part of the delivery.",
    },
    {
      key: "delivered",
      label: "Delivered",
      description:
        "The recipient has received the shipment.",
    },
    {
      key: "completed",
      label: "Completed",
      description:
        "The shipment has been completed.",
    },
    {
      key: "disputed",
      label: "Dispute Under Review",
      description:
        "This shipment has an active dispute under Shipora review.",
    },
    {
      key: "cancelled",
      label: "Cancelled",
      description:
        "This shipment has been cancelled.",
    },
  ];

  /*
  ============================================================
  REAL SHIPORA TRACKING API
  ============================================================
  */

  const handleTrack = async (event) => {
    event.preventDefault();

    const number = trackingNumber.trim().toUpperCase();

    if (!number) {
      setError("Please enter a tracking number.");
      setSearched(false);
      setShipment(null);
      return;
    }

    setLoading(true);
    setSearched(false);
    setShipment(null);
    setError("");

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
            "We couldn't find a shipment with that tracking number."
        );
      }

      setShipment(data);
      setSearched(true);
    } catch (err) {
      setError(
        err.message ||
          "Unable to retrieve this shipment. Please try again."
      );
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  /*
  ============================================================
  STATUS HELPERS
  ============================================================
  */

  const getStatusIndex = (currentStatus) => {
    const index = statusSteps.findIndex(
      (step) => step.key === currentStatus
    );

    return index === -1 ? 0 : index;
  };

  const currentStatusIndex = shipment
    ? getStatusIndex(shipment.status || shipment.shipment_status)
    : 0;

  const getStatusLabel = (status) => {
    const step = statusSteps.find(
      (item) => item.key === status
    );

    if (step) return step.label;

    if (!status) return "Shipment Created";

    return String(status)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatMoney = (amount) => {
    const value = Number(amount || 0);

    /*
      Backend stores monetary values in kobo.
      Convert to naira for display.
    */
    const naira = value / 100;

    return `₦${naira.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const currentStatus =
    shipment?.status || shipment?.shipment_status;

  const canDispute =
    shipment &&
    shipment.shipment_id &&
    !["cancelled", "completed"].includes(currentStatus);

  return (
    <main className="tracking-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="app-topbar">
        <button
          type="button"
          className="app-logo"
          onClick={() => navigate("/home")}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <img
            src={shiporaLogo}
            alt="Shipora"
          />
        </button>
      </header>


      {/* ======================================================
          TRACKING HERO
      ====================================================== */}

      <section className="tracking-hero">

        <div className="eyebrow">
          <span className="eyebrow-dot"></span>
          SHIPMENT TRACKING
        </div>

        <h1>
          Track your
          <span> shipment.</span>
        </h1>

        <p>
          Enter your Shipora tracking number to view the
          shipment journey, dispatch information and
          delivery progress.
        </p>


        {/* ==================================================
            SEARCH
        ================================================== */}

        <form
          className="tracking-search"
          onSubmit={handleTrack}
        >
          <div className="tracking-search-input">
            <label htmlFor="trackingNumber">
              Tracking Number
            </label>

            <input
              id="trackingNumber"
              type="text"
              value={trackingNumber}
              onChange={(event) =>
                setTrackingNumber(event.target.value)
              }
              placeholder="e.g. SHP-2048-921"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Checking..."
              : "Track Shipment"}

            <span>→</span>
          </button>
        </form>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="tracking-error">
            {error}
          </div>
        )}


        {/* ==================================================
            TRACKING RESULT
        ================================================== */}

        {searched && shipment && (
          <div className="tracking-result">

            {/* RESULT HEADER */}

            <div className="result-header">
              <div>
                <span>
                  TRACKING NUMBER
                </span>

                <strong>
                  {shipment.tracking_number ||
                    trackingNumber}
                </strong>
              </div>

              <div className="result-status">
                <i></i>

                {getStatusLabel(currentStatus)}
              </div>
            </div>


            {/* ROUTE */}

            <div className="tracking-route">

              <div className="tracking-location">
                <span className="location-dot location-dot-start"></span>

                <div>
                  <small>
                    PICKUP
                  </small>

                  <strong>
                    {shipment.pickup || "Not provided"}
                  </strong>
                </div>
              </div>


              <div className="tracking-progress">
                <div className="progress-line">
                  <span
                    style={{
                      width: `${
                        currentStatusIndex ===
                        statusSteps.length - 1
                          ? 100
                          : Math.max(
                              8,
                              (
                                currentStatusIndex /
                                Math.max(
                                  1,
                                  statusSteps.length - 1
                                )
                              ) *
                                100
                            )
                      }%`,
                    }}
                  ></span>
                </div>
              </div>


              <div className="tracking-location">
                <span
                  className={`location-dot ${
                    currentStatusIndex >=
                    statusSteps.length - 2
                      ? "location-dot-completed"
                      : "location-dot-end"
                  }`}
                ></span>

                <div>
                  <small>
                    DESTINATION
                  </small>

                  <strong>
                    {shipment.destination ||
                      "Not provided"}
                  </strong>
                </div>
              </div>

            </div>


            {/* CURRENT LOCATION */}

            <div className="tracking-current-location">
              <div className="tracking-current-location-content">
                <span>
                  CURRENT LOCATION
                </span>

                <strong>
                  {shipment.current_location ||
                    "Location update pending"}
                </strong>

                <small>
                  {shipment.location_updated_at
                    ? `Last updated ${formatDate(
                        shipment.location_updated_at
                      )}`
                    : shipment.updated_at
                    ? `Last updated ${formatDate(
                        shipment.updated_at
                      )}`
                    : ""}
                </small>
              </div>
            </div>


            {/* SHIPMENT INFORMATION */}

            <div className="tracking-info-grid">

              <div className="tracking-info-item">
                <span>
                  ITEM
                </span>

                <strong>
                  {shipment.item_name ||
                    "Shipment"}
                </strong>
              </div>


              <div className="tracking-info-item">
                <span>
                  RECIPIENT
                </span>

                <strong>
                  {shipment.recipient_name ||
                    "—"}
                </strong>
              </div>


              <div className="tracking-info-item">
                <span>
                  DELIVERY FEE
                </span>

                <strong className="tracking-money">
                  {formatMoney(
                    shipment.delivery_fee
                  )}
                </strong>
              </div>


              <div className="tracking-info-item">
                <span>
                  PAYMENT
                </span>

                <strong className="tracking-payment-status">
                  {String(
                    shipment.payment_status ||
                      "unpaid"
                  )
                    .replaceAll("_", " ")
                    .toUpperCase()}
                </strong>
              </div>

            </div>


            {/* ASSIGNED DISPATCH */}

            {(shipment.dispatch_name ||
              shipment.dispatcher_name) && (
              <div className="tracking-dispatch-card">

                <div className="tracking-dispatch-profile">

                  <div className="tracking-dispatch-avatar">
                    {(
                      shipment.dispatch_name ||
                      shipment.dispatcher_name ||
                      "D"
                    ).charAt(0)}
                  </div>

                  <div>
                    <span>
                      ASSIGNED DISPATCH
                    </span>

                    <strong>
                      {shipment.dispatch_name ||
                        shipment.dispatcher_name}
                    </strong>

                    <p>
                      {shipment.dispatch_vehicle ||
                        shipment.vehicle_type ||
                        "Dispatch vehicle"}

                      {shipment.dispatch_rating && (
                        <>
                          <span className="dispatch-meta-separator">
                            ·
                          </span>

                          ★{" "}
                          {shipment.dispatch_rating}
                        </>
                      )}
                    </p>
                  </div>

                </div>

                <div className="tracking-dispatch-verified">
                  <span>✓</span>
                  VERIFIED DISPATCH
                </div>

              </div>
            )}


            {/* TIMELINE */}

            <div className="tracking-timeline">

              {statusSteps.map(
                (step, index) => {
                  const completed =
                    index <
                    currentStatusIndex;

                  const active =
                    index ===
                    currentStatusIndex;

                  return (
                    <div
                      className={`timeline-item ${
                        completed
                          ? "completed"
                          : ""
                      } ${
                        active
                          ? "active"
                          : ""
                      }`}
                      key={step.key}
                    >

                      <span className="timeline-dot">
                        {completed
                          ? "✓"
                          : ""}
                      </span>

                      <div>
                        <strong>
                          {step.label}
                        </strong>

                        <p>
                          {step.description}
                        </p>

                        {active && (
                          <small>
                            Current shipment status
                          </small>
                        )}
                      </div>

                    </div>
                  );
                }
              )}

            </div>


            {/* SHIPMENT UPDATE */}

            {shipment.status_note && (
              <div className="tracking-status-note">

                <span>
                  SHIPMENT UPDATE
                </span>

                <p>
                  {shipment.status_note}
                </p>

                <small>
                  {formatDate(
                    shipment.updated_at
                  )}
                </small>

              </div>
            )}

          </div>
        )}

      </section>


      {/* ======================================================
          DISPUTE FLOATING BUTTON
          Only appears after a real shipment is loaded.
      ====================================================== */}

      {canDispute && (
        <button
          type="button"
          className="shipment-dispute-fab"
          onClick={() =>
            navigate(
              `/dispute/${shipment.shipment_id}`
            )
          }
          aria-label="Report shipment issue"
        >
          <span className="shipment-dispute-fab-pulse" />

          <span className="shipment-dispute-fab-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 8v4M12 16h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M10.3 4.5 3.6 16a2 2 0 0 0 1.74 3h13.32a2 2 0 0 0 1.74-3L13.7 4.5a2 2 0 0 0-3.4 0Z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </span>

          <span className="shipment-dispute-fab-label">
            Report Issue
          </span>
        </button>
      )}


      {/* ======================================================
          BOTTOM NAVIGATION
      ====================================================== */}

      <nav className="bottom-nav">

        <NavLink
          to="/home"
          className={({ isActive }) =>
            `bottom-nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
          >
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

          <span>
            Home
          </span>
        </NavLink>


        <NavLink
          to="/shipments"
          className={({ isActive }) =>
            `bottom-nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
          >
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

          <span>
            Shipments
          </span>
        </NavLink>


        <NavLink
          to="/tracking"
          className={({ isActive }) =>
            `bottom-nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
          >
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

          <span>
            Tracking
          </span>
        </NavLink>


        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `bottom-nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
          >
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

          <span>
            Dashboard
          </span>
        </NavLink>

      </nav>

    </main>
  );
}

export default Tracking;