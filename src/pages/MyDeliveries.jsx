import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";
import "../styles/change.css";

function MyDeliveries() {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("shipments/deliveries");

      const records = Array.isArray(response.data)
        ? response.data
        : [];

      setDeliveries(records);
    } catch (err) {
      console.error("Failed to load deliveries:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load your deliveries."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return String(status)
      .toLowerCase()
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

  const normalizeStatus = (status) => {
    return String(status || "")
      .toLowerCase()
      .replace(/_/g, " ")
      .trim();
  };

  const formatFee = (fee) => {
    const amount = Number(fee || 0) / 100;

    return amount.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    const today = new Date();

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return "Today";
    }

    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getVehicle = (delivery) => {
    return (
      delivery.vehicle_preference ||
      delivery.vehicle_type ||
      "Not specified"
    );
  };

  const getItem = (delivery) => {
    return (
      delivery.item_name ||
      "Delivery"
    );
  };

  const getPickup = (delivery) => {
    return delivery.pickup || "Not specified";
  };

  const getDestination = (delivery) => {
    return delivery.destination || "Not specified";
  };

  const filteredDeliveries = useMemo(() => {
    if (statusFilter === "all") {
      return deliveries;
    }

    return deliveries.filter((delivery) => {
      const status = normalizeStatus(delivery.status);

      return status === statusFilter;
    });
  }, [deliveries, statusFilter]);

  const statusClass = (status) =>
    String(status || "")
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/\s+/g, "-");

  const pendingCount = deliveries.filter((delivery) => {
    const status = normalizeStatus(delivery.status);

    return (
      status === "pending" ||
      status === "pending payment"
    );
  }).length;

  const assignedCount = deliveries.filter((delivery) => {
    return normalizeStatus(delivery.status) === "assigned";
  }).length;

  const deliveredCount = deliveries.filter((delivery) => {
    return normalizeStatus(delivery.status) === "delivered";
  }).length;

  const totalFees = deliveries.reduce(
    (total, delivery) =>
      total + Number(delivery.delivery_fee || 0),
    0
  );

  const filterOptions = [
    { value: "all", label: "All Deliveries" },
    { value: "pending", label: "Pending" },
    { value: "assigned", label: "Assigned" },
    { value: "delivered", label: "Delivered" },
  ];

  return (
    <div className="my-deliveries-page">

      <header className="my-deliveries-header">
        <button
          className="delivery-details-back"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <div>
          <span className="my-deliveries-eyebrow">
            DISPATCH MANAGEMENT
          </span>

          <h1>My Deliveries</h1>

          <p>
            Manage your delivery assignments, active tasks and
            completed deliveries from one place.
          </p>
        </div>

        <button
          className="my-deliveries-jobs-button"
          onClick={() => navigate("/dispatch-jobs")}
        >
          Find Delivery Jobs
          <span>→</span>
        </button>
      </header>

      <section className="my-deliveries-summary">

        <div>
          <span>PENDING</span>
          <strong>{pendingCount}</strong>
        </div>

        <div>
          <span>ASSIGNED</span>
          <strong>{assignedCount}</strong>
        </div>

        <div>
          <span>DELIVERED</span>
          <strong>{deliveredCount}</strong>
        </div>

        <div>
          <span>DELIVERY FEES</span>
          <strong>
            ₦{formatFee(totalFees)}
          </strong>
        </div>

      </section>

      <div className="my-deliveries-toolbar">

        <div>
          <span>YOUR DELIVERY RECORD</span>
          <h2>Delivery History</h2>
        </div>

        <div className="my-deliveries-filter-wrapper">

          <button
            type="button"
            className={`my-deliveries-filter ${
              filterOpen ? "open" : ""
            }`}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <span>Filter</span>
            <span>{filterOpen ? "⌃" : "⌄"}</span>
          </button>

          {filterOpen && (
            <div className="my-deliveries-filter-menu">
              {filterOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={
                    statusFilter === option.value
                      ? "selected"
                      : ""
                  }
                  onClick={() => {
                    setStatusFilter(option.value);
                    setFilterOpen(false);
                  }}
                >
                  <span>{option.label}</span>

                  {statusFilter === option.value && (
                    <strong>✓</strong>
                  )}
                </button>
              ))}
            </div>
          )}

        </div>

      </div>

      <main className="my-deliveries-list">

        {loading ? (
          <div className="my-deliveries-empty">
            <div>🚚</div>

            <h3>Loading deliveries...</h3>

            <p>
              Getting your assigned deliveries.
            </p>
          </div>
        ) : error ? (
          <div className="my-deliveries-empty">
            <div>⚠️</div>

            <h3>Unable to load deliveries</h3>

            <p>{error}</p>

            <button onClick={loadDeliveries}>
              Try Again
            </button>
          </div>
        ) : filteredDeliveries.length > 0 ? (
          filteredDeliveries.map((delivery) => (
            <article
              className="my-delivery-card"
              key={delivery.shipment_id}
              onClick={() =>
                navigate(
                  `/delivery-details/${delivery.shipment_id}`
                )
              }
            >

              <div className="my-delivery-card-top">

                <div className="my-delivery-icon">
                  📦
                </div>

                <div className="my-delivery-title">
                  <span>
                    {delivery.tracking_number ||
                      delivery.shipment_id}
                  </span>

                  <h3>
                    {getItem(delivery)}
                  </h3>
                </div>

                <span
                  className={`my-delivery-status ${statusClass(
                    delivery.status
                  )}`}
                >
                  <i></i>

                  {formatStatus(delivery.status)}
                </span>

              </div>

              <div className="my-delivery-route">

                <div className="my-delivery-route-point">
                  <span className="my-delivery-route-dot pickup"></span>

                  <div>
                    <small>PICKUP AREA</small>

                    <strong>
                      {getPickup(delivery)}
                    </strong>
                  </div>
                </div>

                <div className="my-delivery-route-line"></div>

                <div className="my-delivery-route-point">
                  <span className="my-delivery-route-dot destination"></span>

                  <div>
                    <small>DESTINATION AREA</small>

                    <strong>
                      {getDestination(delivery)}
                    </strong>
                  </div>
                </div>

              </div>

              <div className="my-delivery-card-footer">

                <div>
                  <span>DELIVERY FEE</span>

                  <strong>
                    ₦{formatFee(delivery.delivery_fee)}
                  </strong>
                </div>

                <div>
                  <span>VEHICLE</span>

                  <strong>
                    {getVehicle(delivery)}
                  </strong>
                </div>

                <div>
                  <span>DATE</span>

                  <strong>
                    {formatDate(delivery.created_at)}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();

                    navigate(
                      `/delivery-details/${delivery.shipment_id}`
                    );
                  }}
                >
                  View Details
                  <span>→</span>
                </button>

              </div>

            </article>
          ))
        ) : (
          <div className="my-deliveries-empty">
            <div>🚚</div>

            <h3>No deliveries found</h3>

            <p>
              There are no deliveries matching the selected
              status.
            </p>

            <button
              onClick={() => setStatusFilter("all")}
            >
              View All Deliveries
            </button>
          </div>
        )}

      </main>

      <section className="my-deliveries-cta">

        <div>
          <span>LOOKING FOR MORE WORK?</span>

          <h2>Find available delivery jobs.</h2>

          <p>
            Browse delivery opportunities posted by vendors
            and apply for jobs that match your availability.
          </p>
        </div>

        <button
          onClick={() => navigate("/dispatch-jobs")}
        >
          Browse Jobs
          <span>→</span>
        </button>

      </section>

      {/* ================= BOTTOM NAV ================= */}

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

export default MyDeliveries;
