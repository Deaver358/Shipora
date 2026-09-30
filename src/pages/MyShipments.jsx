import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";
import "../index.css";

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 12H17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 18H14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MyShipments() {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("all");
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("shipments/mine");

      setShipments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load shipments:", err);

    const backendMessage =
  err?.response?.data?.detail ||
  err?.response?.data?.message ||
  "";

if (
  backendMessage
    .toString()
    .toLowerCase()
    .includes("missing access token")
) {
  setError(
    "Your session has expired. Please sign in again to view your shipments."
  );
} else {
  setError(
    Array.isArray(backendMessage)
      ? backendMessage.map((item) => item.msg).join(", ")
      : backendMessage || "Unable to load your shipments."
  );
}
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Pending";

    return status
      .toString()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const statusClass = (status) => {
    return (status || "pending")
      .toString()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/\s+/g, "-");
  };

  const getPaymentLabel = (shipment) => {
    const paymentStatus = shipment.payment_status
      ?.toString()
      .toLowerCase();

    if (
      paymentStatus === "paid" ||
      paymentStatus === "held"
    ) {
      return "HELD FOR DELIVERY";
    }

    if (
      paymentStatus === "released" ||
      paymentStatus === "completed"
    ) {
      return "RELEASED";
    }

    if (
      paymentStatus === "refunded"
    ) {
      return "REFUNDED";
    }

    return formatStatus(shipment.payment_status);
  };

  const getAmount = (shipment) => {
    const deliveryFee = Number(shipment.delivery_fee || 0);
    const serviceFee = Number(shipment.service_fee || 0);

    return deliveryFee + serviceFee;
  };

  const filteredShipments =
    statusFilter === "all"
      ? shipments
      : shipments.filter(
          (shipment) =>
            shipment.status
              ?.toString()
              .toLowerCase()
              .replace(/_/g, " ") ===
            statusFilter.toLowerCase()
        );

  const activeShipments = shipments.filter(
    (shipment) =>
      shipment.status?.toString().toLowerCase() !==
      "delivered"
  ).length;

  const heldAmount = shipments
    .filter((shipment) => {
      const payment = shipment.payment_status
        ?.toString()
        .toLowerCase();

      return (
        payment === "held" ||
        payment === "paid"
      );
    })
    .reduce(
      (total, shipment) =>
        total + getAmount(shipment),
      0
    );

  return (
    <div className="my-shipments-page">
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

      <header className="my-shipments-header">
        <div>
          <span className="my-shipments-eyebrow">
            SHIPMENT MANAGEMENT
          </span>

          <h1>My Shipments</h1>

          <p>
            View, manage and track your shipments
            from one place.
          </p>
        </div>

        <button
          className="my-shipments-create-button"
          onClick={() =>
            navigate("/CreateShipment")
          }
        >
          Create Shipment
          <span>+</span>
        </button>
      </header>

      {/* SUMMARY */}
      <div className="shipment-summary-row">
        <div className="shipment-summary-card">
          <span>ACTIVE SHIPMENTS</span>
          <strong>{activeShipments}</strong>
        </div>

        <div className="shipment-summary-card">
          <span>HELD AMOUNT</span>
          <strong>
            ₦{heldAmount.toLocaleString()}
          </strong>
        </div>
      </div>

      {/* FILTER */}
      <div className="shipment-filter">
        <FilterIcon />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">
            All Status
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="open">
            Open
          </option>

          <option value="assigned">
            Assigned
          </option>

          <option value="picked up">
            Picked Up
          </option>

          <option value="in transit">
            In Transit
          </option>

          <option value="out for delivery">
            Out for Delivery
          </option>

          <option value="delivered">
            Delivered
          </option>

          <option value="held for delivery">
            Held for Delivery
          </option>
        </select>
      </div>

      {/* CONTENT */}
      <main className="my-shipments-list">
        {loading ? (
          <div className="shipment-empty-state">
            <div className="shipment-empty-icon">
              📦
            </div>

            <h2>
              Loading shipments...
            </h2>

            <p>
              We're getting your latest shipment
              information.
            </p>
          </div>
        ) : error ? (
          <div className="shipment-empty-state">
            <div className="shipment-error-icon">
              !
            </div>

            <h2>
              Could not load shipments
            </h2>

            <p>{error}</p>

            <button onClick={loadShipments}>
              Try Again
            </button>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="shipment-empty-state">
            <div className="shipment-empty-icon">
              📦
            </div>

            <h2>
              {shipments.length === 0
                ? "No shipments yet"
                : "No shipments found"}
            </h2>

            <p>
              {shipments.length === 0
                ? "Create your first shipment to get started."
                : "There are no shipments matching the selected status."}
            </p>

            {shipments.length === 0 ? (
              <button
                onClick={() =>
                  navigate("/CreateShipment")
                }
              >
                Create Shipment
              </button>
            ) : (
              <button
                onClick={() =>
                  setStatusFilter("all")
                }
              >
                View All Shipments
              </button>
            )}
          </div>
        ) : (
          filteredShipments.map((shipment) => (
            <article
              className="my-shipment-card"
              key={shipment.shipment_id}
              onClick={() =>
                navigate(
                  `/shipment/${shipment.public_token}`
                )
              }
            >
              {/* HEADER */}
              <div className="my-shipment-top">
                <div>
                  <span className="shipment-number">
                    {shipment.tracking_number}
                  </span>

                  <h2>
                    {shipment.item_name}
                  </h2>
                </div>

                <span
                  className={`shipment-status-badge ${statusClass(
                    shipment.status
                  )}`}
                >
                  <i></i>

                  {formatStatus(
                    shipment.status
                  )}
                </span>
              </div>

              {/* ROUTE */}
              <div className="my-shipment-route">
                <div className="my-route-point">
                  <span className="my-route-dot pickup"></span>

                  <div>
                    <small>PICKUP</small>

                    <strong>
                      {shipment.pickup}
                    </strong>
                  </div>
                </div>

                <div className="my-route-line"></div>

                <div className="my-route-point">
                  <span className="my-route-dot destination"></span>

                  <div>
                    <small>DESTINATION</small>

                    <strong>
                      {shipment.destination}
                    </strong>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="my-shipment-footer">
                <div>
                  <span className="shipment-role-label">
                    Vendor
                  </span>

                  <strong>
                    ₦
                    {getAmount(
                      shipment
                    ).toLocaleString()}
                  </strong>
                </div>

                <div className="shipment-payment-label">
                  {getPaymentLabel(
                    shipment
                  )}
                </div>

                <button
                  className="view-shipment-button"
                  onClick={(event) => {
                    event.stopPropagation();

                    navigate(
                      `/shipment/${shipment.public_token}`
                    );
                  }}
                >
                  View Shipment
                  <span>→</span>
                </button>
              </div>
            </article>
          ))
        )}
      </main>

      {/* NOTE */}
      <section className="shipment-list-note">
        <div className="shipment-list-note-icon">
          +
        </div>

        <div>
          <strong>
            Need to send something?
          </strong>

          <p>
            Create a shipment with your pickup
            location, destination and delivery
            arrangement. Verified dispatchers can
            then apply for the delivery.
          </p>
        </div>

        <button
          onClick={() =>
            navigate("/CreateShipment")
          }
        >
          Create Shipment
        </button>
      </section>

      {/* BOTTOM NAVIGATION */}
      <nav className="bottom-nav">
        <button
          className="bottom-nav-item"
          onClick={() =>
            navigate("/Home")
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

          <span>Home</span>
        </button>

        <button
          className="bottom-nav-item active"
          onClick={() =>
            navigate("/shipments")
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

          <span>Shipments</span>
        </button>

        <button
          className="bottom-nav-item"
          onClick={() =>
            navigate("/tracking")
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

          <span>Tracking</span>
        </button>

        <button
          className="bottom-nav-item"
          onClick={() =>
            navigate("/dashboard")
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

          <span>Dashboard</span>
        </button>
      </nav>
    </div>
  );
}

export default MyShipments;