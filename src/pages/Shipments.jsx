import { useLocation, useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

/* =========================================================
   ICONS
========================================================= */

function HomeIcon() {
  return (
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
  );
}

function ShipmentIcon() {
  return (
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
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrackingIcon() {
  return (
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
  );
}

function DashboardIcon() {
  return (
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
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AvailabilityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 7V12L15 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   SHIPMENTS PAGE
========================================================= */

function Shipments() {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome =
    location.pathname === "/Home" ||
    location.pathname === "/home";

  const isShipments =
    location.pathname === "/shipments";

  const isTracking =
    location.pathname === "/tracking";

  const isDashboard =
    location.pathname === "/Dashboard" ||
    location.pathname === "/dashboard";

  return (
    <main className="shipments-page">

      {/* =====================================================
          TOP LOGO
      ===================================================== */}

      <header className="app-topbar">

        <button
          type="button"
          className="app-logo"
          onClick={() => navigate("/Home")}
          aria-label="Go to Home"
        >
          <img
            src={shiporaLogo}
            alt="Shipora"
          />
        </button>

      </header>


      {/* =====================================================
          DISPATCH WORKSPACE
      ===================================================== */}

      <section className="shipments-content">

        <div className="shipments-header-row">

          <div className="shipments-heading">

            <span className="shipments-eyebrow">
              <span></span>
              SHIPMENT
            </span>

            <h1>
              Get started with Logistics today.
            </h1>

            <p>
              Move shipments seamlessly, Connect with delivery opportunities and manage your availability—all through one trusted logistics platform.
            </p>

          </div>


          <button
            type="button"
            className="create-shipment-button"
            onClick={() =>
              navigate("/Help")
            }
          >
            <span>
              Platform Overview
            </span>

          </button>

        </div>


        {/* =====================================================
            DISPATCH WORKSPACE LABEL
        ===================================================== */}

        <div className="shipment-mode-area">

          <span className="mode-description">
            Shipora workspace
          </span>

        </div>


        {/* =====================================================
            QUICK ACTIONS
        ===================================================== */}

        <div className="shipment-quick-actions">

          <button
            type="button"
            className="shipment-quick-action"
            onClick={() =>
              navigate("/Vendor")
            }
          >

            <div className="shipment-quick-icon">
              <AvailabilityIcon />
            </div>


            <div>

              <strong>
                Become a Vendor 
              </strong>

              <span>
                List your shipments, manage deliveries, and connect with reliable dispatch riders.
              </span>

            </div>


            <ArrowIcon />

          </button>


          <button
            type="button"
            className="shipment-quick-action"
            onClick={() =>
              navigate("/Dispatch")
            }
          >

            <div className="shipment-quick-icon">
              <ShipmentIcon />
            </div>


            <div>

              <strong>
                Become a Dispatch Rider
              </strong>

              <span>
                Discover delivery opportunities, manage your availability, and deliver shipments with ease.
              </span>

            </div>


            <ArrowIcon />

          </button>

        </div>

      </section>


      {/* =====================================================
          BOTTOM NAVIGATION
      ===================================================== */}

      <nav className="bottom-nav">

        <button
          type="button"
          className={`bottom-nav-item ${
            isHome ? "active" : ""
          }`}
          onClick={() => navigate("/Home")}
        >

          <HomeIcon />

          <span>
            Home
          </span>

        </button>


        <button
          type="button"
          className={`bottom-nav-item ${
            isShipments ? "active" : ""
          }`}
          onClick={() => navigate("/shipments")}
        >

          <ShipmentIcon />

          <span>
            Shipments
          </span>

        </button>


        <button
          type="button"
          className={`bottom-nav-item ${
            isTracking ? "active" : ""
          }`}
          onClick={() => navigate("/tracking")}
        >

          <TrackingIcon />

          <span>
            Tracking
          </span>

        </button>


        <button
          type="button"
          className={`bottom-nav-item ${
            isDashboard ? "active" : ""
          }`}
          onClick={() => navigate("/Dashboard")}
        >

          <DashboardIcon />

          <span>
            Dashboard
          </span>

        </button>

      </nav>

    </main>
  );
}

export default Shipments;