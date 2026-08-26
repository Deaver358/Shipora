import { useNavigate } from "react-router-dom";
import "../index.css";

function Vendor() {
  const navigate = useNavigate();

  return (
    <div className="vendor-page">

      <header className="vendor-header">
        <button
          className="vendor-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>

        <div>
          <span>VENDOR PORTAL</span>
          <h1>Manage your shipments.</h1>
        </div>
      </header>

      <main className="vendor-content">

        <section className="vendor-intro">
          <span className="vendor-eyebrow">
            SHIPORA VENDOR
          </span>

          <h2>
            Move your deliveries
            <span>with confidence.</span>
          </h2>

          <p>
            Create new delivery requests, review your existing
            shipments and find verified dispatches available
            for your routes.
          </p>
        </section>


        <section className="vendor-actions">

          <article className="vendor-action-card">

            <div className="vendor-action-number">
              01
            </div>

            <div className="vendor-action-icon">
              +
            </div>

            <div className="vendor-action-content">

              <h3>
                Create Shipment
              </h3>

              <p>
                Start a new delivery request by providing the
                item, pickup location, destination, recipient
                details and delivery arrangement.
              </p>

              <button
                onClick={() =>
                  navigate("/CreateShipment")
                }
              >
                Create Shipment
                <span>→</span>
              </button>

            </div>

          </article>


          <article className="vendor-action-card">

            <div className="vendor-action-number">
              02
            </div>

            <div className="vendor-action-icon">
              ◈
            </div>

            <div className="vendor-action-content">

              <h3>
                My Shipments
              </h3>

              <p>
                Review shipments you have created, check their
                current status, view payment arrangements and
                open individual shipment details.
              </p>

              <button
                onClick={() =>
                  navigate("/MyShipments")
                }
              >
                View My Shipments
                <span>→</span>
              </button>

            </div>

          </article>


          <article className="vendor-action-card">

            <div className="vendor-action-number">
              03
            </div>

            <div className="vendor-action-icon">
              🚚
            </div>

            <div className="vendor-action-content">

              <h3>
                Find Dispatch
              </h3>

              <p>
                Discover verified dispatch users available for
                your route and review their vehicle, experience,
                rating and delivery rate before selecting one.
              </p>

              <button
                onClick={() =>
                  navigate("/FindDispatch")
                }
              >
                Find Dispatch
                <span>→</span>
              </button>

            </div>

          </article>

        </section>

      </main>

            {/* ================= BOTTOM NAVIGATION ================= */}

      <nav className="bottom-nav">

        <button
          type="button"
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

          <span>
            Home
          </span>

        </button>


        <button
          type="button"
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

          <span>
            Shipments
          </span>

        </button>


        <button
          type="button"
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

          <span>
            Tracking
          </span>

        </button>


        <button
          type="button"
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

          <span>
            Dashboard
          </span>

        </button>

      </nav>

    </div>
  );
}

export default Vendor;