import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  /*
   * FRONTEND DEMO DATA
   * Backend/Supabase will replace this later.
   */
  const shipments = [
    {
      id: "SHP-2048-921",
      item: "Electronics",
      pickup: "Lekki Phase 1",
      destination: "Yaba",
      status: "Available",
      payment: "HELD FOR DELIVERY",
      amount: 5000,
      role: "Vendor",
    },
    {
      id: "SHP-2048-817",
      item: "Documents",
      pickup: "Victoria Island",
      destination: "Ikeja",
      status: "In Transit",
      payment: "HELD FOR DELIVERY",
      amount: 3500,
      role: "Vendor",
    },
    {
      id: "SHP-2048-604",
      item: "Fashion Items",
      pickup: "Surulere",
      destination: "Lekki",
      status: "Delivered",
      payment: "RELEASED",
      amount: 4500,
      role: "Dispatch",
    },
  ];

  const statusClass = (status) => {
    return status.toLowerCase().replace(/\s+/g, "-");
  };

  /*
   * FILTER SHIPMENTS
   */
  const filteredShipments =
    statusFilter === "all"
      ? shipments
      : shipments.filter(
          (shipment) =>
            shipment.status.toLowerCase() ===
            statusFilter.toLowerCase()
        );

  /*
   * SUMMARY VALUES
   */
  const activeShipments = shipments.filter(
    (shipment) =>
      shipment.status !== "Delivered"
  ).length;

  const heldAmount = shipments
    .filter(
      (shipment) =>
        shipment.payment === "HELD FOR DELIVERY"
    )
    .reduce(
      (total, shipment) =>
        total + shipment.amount,
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
</button> <br /> <br />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="my-shipments-header">

        <div>

          <span className="my-shipments-eyebrow">
            SHIPMENT MANAGEMENT
          </span>

          <h1>
            My Shipments
          </h1>

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

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="shipment-filter">

        <FilterIcon />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >

          <option value="all">
            All Status
          </option>

          <option value="available">
            Pending
          </option>

          <option value="in transit">
            In Transit
          </option>

          <option value="delivered">
            Delivered
          </option>

        </select>

      </div>


      {/* =====================================================
          SHIPMENT LIST
      ===================================================== */}

      <main className="my-shipments-list">

        {filteredShipments.length === 0 ? (

          <div className="shipment-empty-state">

            <div className="shipment-empty-icon">
              📦
            </div>

            <h2>
              No shipments found
            </h2>

            <p>
              There are no shipments matching
              the selected status.
            </p>

            <button
              onClick={() =>
                setStatusFilter("all")
              }
            >
              View All Shipments
            </button>

          </div>

        ) : (

          filteredShipments.map(
            (shipment) => (

              <article
                className="my-shipment-card"
                key={shipment.id}
                onClick={() =>
                  navigate(
                    `/shipment/${shipment.id}`
                  )
                }
              >

                {/* =========================
                    CARD HEADER
                ========================= */}

                <div className="my-shipment-top">

                  <div>

                    <span className="shipment-number">
                      {shipment.id}
                    </span>

                    <h2>
                      {shipment.item}
                    </h2>

                  </div>

                  <span
                    className={`shipment-status-badge ${statusClass(
                      shipment.status
                    )}`}
                  >

                    <i></i>

                    {shipment.status}

                  </span>

                </div>


                {/* =========================
                    ROUTE
                ========================= */}

                <div className="my-shipment-route">

                  <div className="my-route-point">

                    <span className="my-route-dot pickup"></span>

                    <div>

                      <small>
                        PICKUP
                      </small>

                      <strong>
                        {shipment.pickup}
                      </strong>

                    </div>

                  </div>


                  <div className="my-route-line"></div>


                  <div className="my-route-point">

                    <span className="my-route-dot destination"></span>

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


                {/* =========================
                    FOOTER
                ========================= */}

                <div className="my-shipment-footer">

                  <div>

                    <span className="shipment-role-label">
                      {shipment.role}
                    </span>

                    <strong>
                      ₦
                      {shipment.amount.toLocaleString()}
                    </strong>

                  </div>


                  <div className="shipment-payment-label">
                    {shipment.payment}
                  </div>


                  <button
                    className="view-shipment-button"
                    onClick={(event) => {

                      event.stopPropagation();

                      navigate(
                        `/shipment/${shipment.id}`
                      );

                    }}
                  >
                    View Shipment
                    <span>→</span>
                  </button>

                </div>

              </article>

            )
          )

        )}

      </main>


      {/* =====================================================
          CREATE SHIPMENT NOTE
      ===================================================== */}

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
            arrangement. Verified dispatches can
            then apply or accept the delivery.
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


      {/* =====================================================
          BOTTOM NAVIGATION
      ===================================================== */}

      <nav className="bottom-nav">

        {/* HOME */}

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

          <span>
            Home
          </span>

        </button>


        {/* SHIPMENTS */}

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

          <span>
            Shipments
          </span>

        </button>


        {/* TRACKING */}

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

          <span>
            Tracking
          </span>

        </button>


        {/* DASHBOARD */}

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

          <span>
            Dashboard
          </span>

        </button>

      </nav>

    </div>
  );
}

export default MyShipments;