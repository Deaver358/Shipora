import shiporaLogo from "../assets/shipora-logo.jpeg";
import { useNavigate, NavLink } from "react-router-dom";
import "../index.css";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 8C18 5.79 16.21 4 14 4H10C7.79 4 6 5.79 6 8V11.5C6 12.5 5.6 13.46 4.9 14.18L4 15.1C3.58 15.53 3.88 16.25 4.47 16.25H19.53C20.12 16.25 20.42 15.53 20 15.1L19.1 14.18C18.4 13.46 18 12.5 18 11.5V8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 19C10.05 19.62 10.93 20 12 20C13.07 20 13.95 19.62 14.5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 20C5.8 16.7 8.25 15 12 15C15.75 15 18.2 16.7 19 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function Home() {
  const navigate = useNavigate();

  return (
    <div className="shipora-app">

      {/* ================= TOP BAR ================= */}
      <header className="app-topbar">
        <button
          className="app-logo-button"
          onClick={() => navigate("/")}
          aria-label="Go to Home"
        >
          <img src={shiporaLogo} alt="Shipora" className="app-logo" />
        </button>

        <div className="topbar-actions">

          {/* Notifications */}
          <button
  className="icon-button notification-button"
  onClick={() => navigate("/notifications")}
  aria-label="Notifications"
>
  <BellIcon />

  <span className="notification-dot"></span>
</button>

          {/* Profile */}
          <button
  className="profile-button"
  onClick={() => navigate("/profile")}
  aria-label="Open profile"
>
  <UserIcon />
</button>
        </div>
      </header>
      
      <section className="home-hero-image">
  <div className="home-hero-image-frame">
    <img
      src="shipora-logo.jpeg"
      alt="Shipora logistics"
    />
  </div>
</section>


      {/* ================= MAIN CONTENT ================= */}
      <main className="app-main">

        {/* HERO */}
        <section className="hero" id="home">

          <div className="hero-content">

            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              LOGISTICS & FORWARDING
            </div>

            <h1>
              Moving what matters.
              <span>Tracking every step.</span>
            </h1>

            <p className="hero-text">
              Shipora connects logistics and forwarding with clear,
              dependable shipment tracking — from dispatch to destination.
            </p>

            <div className="hero-actions">

              <button
                className="primary-button"
                onClick={() => navigate("/tracking")}
              >
                Track Your Shipment
                <span>→</span>
              </button>

              <button
                className="secondary-button"
                onClick={() => navigate("/shipments")}
              >
                Explore Shipments
              </button>

            </div>

            <div className="hero-trust">

              <div className="trust-item">
                <strong>01</strong>
                <span>Secure Tracking</span>
              </div>

              <div className="trust-line"></div>

              <div className="trust-item">
                <strong>02</strong>
                <span>Clear Updates</span>
              </div>

              <div className="trust-line"></div>

              <div className="trust-item">
                <strong>03</strong>
                <span>Reliable Delivery</span>
              </div>

            </div>

          </div>


          {/* HERO VISUAL */}
          <div className="hero-visual">

            <div className="visual-glow"></div>

            <div className="shipment-card">

              <div className="shipment-card-top">
                <span>SHIPMENT STATUS</span>

                <span className="status-live">
                  <i></i> LIVE
                </span>
              </div>

              <div className="shipment-number">
                <span>Tracking Number</span>
                <strong>SP-2048-921</strong>
              </div>

              <div className="route">

                <div className="route-point">
                  <span className="route-dot active"></span>

                  <div>
                    <small>ORIGIN</small>
                    <strong>Lagos, NG</strong>
                  </div>
                </div>

                <div className="route-line">
                  <span></span>
                </div>

                <div className="route-point destination">

                  <span className="route-dot"></span>

                  <div>
                    <small>DESTINATION</small>
                    <strong>New York, US</strong>
                  </div>

                </div>

              </div>

              <div className="shipment-status">

                <div>
                  <span>Current Status</span>
                  <strong>In Transit</strong>
                </div>

                <button
                  className="status-arrow"
                  onClick={() => navigate("/tracking")}
                  aria-label="View tracking"
                >
                  →
                </button>

              </div>

            </div>


            <div className="floating-card floating-card-one">

              <span className="floating-icon">✓</span>

              <div>
                <strong>Shipment secured</strong>
                <small>Tracking active</small>
              </div>

            </div>


            <div className="floating-card floating-card-two">

              <span className="orange-dot"></span>

              <div>
                <strong>In Transit</strong>
                <small>Updated just now</small>
              </div>

            </div>

          </div>

        </section>

        {/* ================= TRACKING ================= */}
        <section className="tracking-section" id="tracking">

          <div className="section-heading centered">

            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              SHIPMENT TRACKING
            </div>

            <h2>Where is your shipment?</h2>

            <p>
              Enter your tracking number to view the latest shipment status
              and delivery information.
            </p>

          </div>


          <div className="tracking-box">

            <div className="tracking-input-wrapper">

              <label htmlFor="tracking-number">
                <div className="eyebrow">
                  <span className="eyebrow-dot"></span>
                  <h2>Tracking today</h2>
                </div>
                 <br />
                <p>If you already have a shipment with Shipora, you can check its latest status, location, and delivery progress anytime....Have a shipment already?</p>
                
              </label>
            </div>

            <button
              className="track-button"
              onClick={() => navigate("/tracking")}
            >
              Track Shipment
              <span>→</span>
            </button>

          </div>

        </section>


        {/* ================= SERVICES ================= */}
        <section className="services-section" id="services">

          <div className="section-heading">

            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              WHAT WE DO
            </div>

            <h2>Logistics built around movement.</h2>

            <p>
              From forwarding to final delivery, Shipora keeps every part
              of the shipment journey organized and visible.
            </p>

          </div>


          <div className="service-grid">

  <article className="service-card">

    <span className="service-number">01</span>

    <div className="service-icon">↗</div>

    <h3>Freight Forwarding</h3>

    <p>
      Coordinate the movement of your goods across destinations
      with a streamlined dispatch process designed to keep every
      shipment organized and on schedule.
    </p>

    <button onClick={() => navigate("/shipments")}>
      Dispatch Shipment →
    </button>

  </article>


  <article className="service-card featured">

    <span className="service-number">02</span>

    <div className="service-icon">◈</div>

    <h3>Shipment Tracking</h3>

    <p>
      Keep customers informed with accessible tracking and clear
      shipment status updates throughout the delivery journey.
    </p>

    <button onClick={() => navigate("/tracking")}>
      Track Shipment →
    </button>

  </article>


  <article className="service-card">

    <span className="service-number">03</span>

    <div className="service-icon">⌁</div>

    <h3>Delivery Management</h3>

    <p>
      Create and manage delivery requests with the destination
      and shipment details needed to move goods efficiently
      through to final delivery.
    </p>

    <button onClick={() => navigate("/shipments")}>
      Create Shipment →
    </button>

  </article>

</div>
        </section>


        {/* ================= SHIPORA FEATURES ================= */}
        <section className="process-section" id="how-it-works">

          <div className="section-heading centered">

            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              THE PROCESS
            </div>

            <h2>Everything connected in one place.</h2>

          </div>


          <div className="process-grid">

            <div className="process-step">

              <span>01</span>

              <div>
                <h3>Create a Shipment</h3>
                <p>
                  Vendors can create and manage delivery requests directly
                  through Shipora.
                </p>
              </div>

            </div>


            <div className="process-step">

              <span>02</span>

              <div>
                <h3>Find a Dispatch</h3>
                <p>
                  Eligible dispatch users can discover and claim available
                  delivery opportunities.
                </p>
              </div>

            </div>


            <div className="process-step">

              <span>03</span>

              <div>
                <h3>Track the Journey</h3>
                <p>
                  Follow shipment progress from pickup through transit and
                  final delivery.
                </p>
              </div>

            </div>


            <div className="process-step">

              <span>04</span>

              <div>
                <h3>Complete Delivery</h3>
                <p>
                  Delivery status is updated and the completed shipment
                  remains available in your records.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* ================= ABOUT ================= */}
        <section className="about-section" id="about">

          <div className="about-content">

            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              ABOUT SHIPORA
            </div>

            <h2>
              Making logistics
              <span>easier to follow.</span>
            </h2>

            <p>
              Shipora brings vendors, dispatch users and shipment tracking
              together in one connected logistics platform.
            </p>

            <p>
              From creating a delivery request to tracking a shipment and
              completing delivery, every stage is designed to remain clear
              and accessible.
            </p>

          </div>


          <div className="about-highlight">

            <span>SHIPORA</span>

            <strong>Moving forward.</strong>

            <p>Logistics & Forwarding</p>

          </div>

        </section>


        {/* ================= CTA ================= */}
        <section className="cta-section" id="contact">

          <div>

            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              SHIPORA
            </div>

            <h2>Ready to move something?</h2>

            <p>
              Create a shipment, find a dispatch or track an existing
              delivery from one connected platform.
            </p>

          </div>


          <button
            className="primary-button"
            onClick={() => navigate("/shipments")}
          >
            Get Started
            <span>→</span>
          </button>

        </section>

      </main>


{/* ================= BOTTOM NAVIGATION ================= */}
<nav className="bottom-nav">

  <NavLink
    to="/Home"
    className={({ isActive }) =>
      `bottom-nav-item ${isActive ? "active" : ""}`
    }
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
  </NavLink>


  <NavLink
    to="/shipments"
    className={({ isActive }) =>
      `bottom-nav-item ${isActive ? "active" : ""}`
    }
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
  </NavLink>


  <NavLink
    to="/tracking"
    className={({ isActive }) =>
      `bottom-nav-item ${isActive ? "active" : ""}`
    }
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
  </NavLink>


  <NavLink
    to="/dashboard"
    className={({ isActive }) =>
      `bottom-nav-item ${isActive ? "active" : ""}`
    }
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
  </NavLink>

</nav>


      {/* ================= FOOTER ================= */}
      <footer className="footer">

        <div className="footer-brand">

          <a href="/" className="brand">
            <img
              src={shiporaLogo}
              alt="Shipora"
              className="brand-logo"
            />
          </a>

          <p>Logistics & Forwarding</p>

        </div>


        <div className="footer-contact">

          <h4>Contact</h4>

          <a href="mailto:deaver.techh@gmail.com">
            deaver.techh@gmail.com
          </a>

          <a
            href="https://x.com/xx_deaver"
            target="_blank"
            rel="noreferrer"
          >
            𝕏 / Twitter
          </a>

        </div>


        <div className="footer-bottom">

          <span>© 2026 Shipora. All rights reserved.</span>

          <span>Moving what matters.</span>

        </div>

      </footer>

    </div>
  );
}

export default Home;