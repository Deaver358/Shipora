import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

function Tracking() {
  const navigate = useNavigate();

  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
  ============================================================
  SHIPORA SHIPMENT LIFECYCLE

  available
      ↓
  dispatch_assigned
      ↓
  picked_up
      ↓
  in_transit
      ↓
  out_for_delivery
      ↓
  delivered
  ============================================================
  */

  const statusSteps = [
    {
      key: "available",
      label: "Shipment Created",
      description:
        "The shipment has been created and is available for dispatch matching.",
    },
    {
      key: "dispatch_assigned",
      label: "Dispatch Assigned",
      description:
        "A verified dispatch has accepted the shipment and is assigned to the delivery.",
    },
    {
      key: "picked_up",
      label: "Picked Up",
      description:
        "The dispatch has collected the shipment from the pickup location.",
    },
    {
      key: "in_transit",
      label: "In Transit",
      description:
        "The shipment is currently moving toward the delivery destination.",
    },
    {
      key: "out_for_delivery",
      label: "Out for Delivery",
      description:
        "The dispatch is completing the final part of the delivery journey.",
    },
    {
      key: "delivered",
      label: "Delivered",
      description:
        "The recipient has received the shipment and delivery has been completed.",
    },
  ];

  /*
  ============================================================
  TRACK SHIPMENT

  Temporary demo data.

  This will later be replaced with the Supabase shipment query.
  ============================================================
  */

  const handleTrack = async (event) => {
    event.preventDefault();

    const number = trackingNumber.trim().toUpperCase();

    if (!number) {
      setError("Please enter a tracking number.");
      return;
    }

    setLoading(true);
    setSearched(false);
    setShipment(null);
    setError("");

    setTimeout(() => {
      const demoShipment = {
        id: number,
        tracking_number: number,

        shipment_status: "in_transit",

        item_name: "Electronics",
        description: "Laptop in sealed package",

        pickup: "Lekki Phase 1, Lagos",
        destination: "Yaba, Lagos",

        recipient_name: "David Emmanuel",
        recipient_phone: "080XXXXXXXX",

        dispatch_name: "Michael A.",
        dispatch_vehicle: "Car",
        dispatch_rating: "4.9",

        delivery_fee: 5000,
        payment_by: "Vendor",
        payment_status: "HELD FOR DELIVERY",

        current_location: "Lagos Distribution Centre",

        created_at: new Date(
          Date.now() - 1000 * 60 * 60 * 48
        ).toISOString(),

        updated_at: new Date().toISOString(),

        status_note:
          "Your shipment is currently moving through the delivery network.",
      };

      setShipment(demoShipment);
      setSearched(true);
      setLoading(false);
    }, 700);
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
    ? getStatusIndex(shipment.shipment_status)
    : 0;

  const getStatusLabel = (status) => {
    const step = statusSteps.find(
      (item) => item.key === status
    );

    return step ? step.label : "Shipment Created";
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

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

            {/* ==================================================
                RESULT HEADER
            ================================================== */}

            <div className="result-header">

              <div>

                <span>
                  TRACKING NUMBER
                </span>

                <strong>
                  {shipment.tracking_number}
                </strong>

              </div>


              <div className="result-status">

                <i></i>

                {getStatusLabel(
                  shipment.shipment_status
                )}

              </div>

            </div>


            {/* ==================================================
                ROUTE
            ================================================== */}

            <div className="tracking-route">

              <div className="tracking-location">

                <span className="location-dot location-dot-start"></span>

                <div>

                  <small>
                    PICKUP
                  </small>

                  <strong>
                    {shipment.pickup}
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
                              12,
                              (
                                currentStatusIndex /
                                (statusSteps.length - 1)
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
                    currentStatusIndex >= 2
                      ? "location-dot-completed"
                      : "location-dot-end"
                  }`}
                ></span>

                <div>

                  <small>
                    DESTINATION
                  </small>

                  <strong>
                    {shipment.destination}
                  </strong>

                </div>

              </div>

            </div>


            {/* ==================================================
                CURRENT LOCATION
            ================================================== */}

            <div className="tracking-current-location">

              <div className="tracking-current-location-content">

                <span>
                  CURRENT LOCATION
                </span>

                <strong>
                  {shipment.current_location}
                </strong>

                <small>
                  Last updated{" "}
                  {formatDate(
                    shipment.updated_at
                  )}
                </small>

              </div>

            </div>


            {/* ==================================================
                SHIPMENT INFORMATION
            ================================================== */}

            <div className="tracking-info-grid">

              <div className="tracking-info-item">

                <span>
                  ITEM
                </span>

                <strong>
                  {shipment.item_name}
                </strong>

              </div>


              <div className="tracking-info-item">

                <span>
                  RECIPIENT
                </span>

                <strong>
                  {shipment.recipient_name}
                </strong>

              </div>


              <div className="tracking-info-item">

                <span>
                  DELIVERY FEE
                </span>

                <strong className="tracking-money">
                  ₦
                  {Number(
                    shipment.delivery_fee || 0
                  ).toLocaleString()}
                </strong>

              </div>


              <div className="tracking-info-item">

                <span>
                  PAYMENT
                </span>

                <strong className="tracking-payment-status">
                  {shipment.payment_status}
                </strong>

              </div>

            </div>


            {/* ==================================================
                ASSIGNED DISPATCH
            ================================================== */}

            {shipment.dispatch_name && (

              <div className="tracking-dispatch-card">

                <div className="tracking-dispatch-profile">

                  <div className="tracking-dispatch-avatar">
                    {shipment.dispatch_name.charAt(0)}
                  </div>

                  <div>

                    <span>
                      ASSIGNED DISPATCH
                    </span>

                    <strong>
                      {shipment.dispatch_name}
                    </strong>

                    <p>
                      {shipment.dispatch_vehicle}
                      <span className="dispatch-meta-separator">
                        ·
                      </span>
                      ★ {shipment.dispatch_rating}
                    </p>

                  </div>

                </div>


                <div className="tracking-dispatch-verified">
                  <span>✓</span>
                  VERIFIED DISPATCH
                </div>

              </div>

            )}


            {/* ==================================================
                TIMELINE
            ================================================== */}

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


            {/* ==================================================
                SHIPMENT UPDATE
            ================================================== */}

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