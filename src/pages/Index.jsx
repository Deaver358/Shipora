import { Link } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import shipora1 from "../assets/shipora1.jpeg";
import animation from "../assets/animate.mp4";
import "../index.css";

function Index() {
  return (
    <main className="landing-page">

      {/* Background atmosphere */}
      <div className="landing-orb landing-orb-orange"></div>
      <div className="landing-orb landing-orb-blue"></div>


      {/* Navigation */}

      <header className="landing-navbar">

        <Link to="/" className="landing-brand">

          <img
            src={shiporaLogo}
            alt="SHIPORA"
          />

          <div>
            <strong>SHIPORA</strong>
            <span>LOGISTICS &amp; FORWARDING</span>
          </div>

        </Link>


        <div className="landing-nav-actions">

          <span className="landing-nav-question">
            Already have an account?
          </span>

          <Link
            to="/login"
            className="landing-login-button"
          >
            Sign in
          </Link>

        </div>

      </header>


      {/* Hero */}

      <section className="landing-hero">

        <div className="landing-hero-content">

          <div className="landing-eyebrow">

            <span></span>

            LOGISTICS, CONNECTED

          </div>


          <h1>

            Moving what matters.

            <span>
              Made simpler.
            </span>

          </h1>


          <p>

            SHIPORA brings vendors, dispatch riders and
            delivery services together in one connected
            logistics platform.

          </p>


          <div className="landing-actions">

            <Link
              to="/signup"
              className="landing-primary-button"
            >
              Create your account
              <span>→</span>
            </Link>


            <Link
              to="/login"
              className="landing-secondary-button"
            >
              Sign in
            </Link>

          </div>


          <div className="landing-trust">

            <div>

              <strong>01</strong>

              <span>
                Create your account
              </span>

            </div>


            <div className="landing-trust-line"></div>


            <div>

              <strong>02</strong>

              <span>
                Choose how you use SHIPORA
              </span>

            </div>


            <div className="landing-trust-line"></div>


            <div>

              <strong>03</strong>

              <span>
                Move what matters
              </span>

            </div>

          </div>

        </div>


        {/* Animation */}

        <div className="landing-visual">

          <div className="landing-visual-glow"></div>


          <div className="landing-video-card">

            <video
              src={animation}
              autoPlay
              muted
              loop
              playsInline
            />

          </div>


          <div className="landing-floating landing-floating-one">

            <span className="landing-floating-dot"></span>

            <div>

              <strong>
                Connected logistics
              </strong>

              <small>
                One platform
              </small>

            </div>

          </div>


          <div className="landing-floating landing-floating-two">

            <span className="landing-check">
              ✓
            </span>

            <div>

              <strong>
                Shipment visibility
              </strong>

              <small>
                Every step matters
              </small>

            </div>

          </div>

        </div>

      </section>


      {/* Small introduction */}

      <section className="landing-introduction">

        <div className="landing-section-heading">

          <div className="landing-eyebrow">

            <span></span>

            ABOUT SHIPORA

          </div>


          <h2>
            Logistics should feel
            <span>connected.</span>
          </h2>

        </div>


        <div className="landing-introduction-content">

          <p>

            Whether you're sending goods, managing deliveries
            or providing dispatch services, SHIPORA is designed
            to bring the entire delivery journey together.

          </p>


        <div className="landing-image-showcase">
  <img
    src={shipora1}
    alt="Shipora logistics"
    className="landing-main-image"
  />

  <div className="landing-image-label">
    <span></span>
    SHIPORA LOGISTICS
  </div>
</div>

        </div>

      </section>


      {/* Final CTA */}

      <section className="landing-final">

        <div>

          <span className="landing-eyebrow">

            <span></span>

            SHIPORA

          </span>


          <h2>
            Ready to move
            <span>what matters?</span>
          </h2>


          <p>
            Create your SHIPORA account and get started.
          </p>

        </div>


        <Link
          to="/signup"
          className="landing-primary-button"
        >
          Get started
          <span>→</span>
        </Link>

      </section>


      {/* Footer */}

      <footer className="landing-footer">

        <div className="landing-footer-brand">

          <img
            src={shiporaLogo}
            alt="SHIPORA"
          />

          <div>

            <strong>SHIPORA</strong>

            <span>
              Logistics &amp; Forwarding
            </span>

          </div>

        </div>


        <div className="landing-footer-links">

          <Link to="/login">
            Sign in
          </Link>

          <Link to="/signup">
            Create account
          </Link>

          <Link to="/terms">
            Terms
          </Link>

          <Link to="/privacy">
            Privacy
          </Link>

        </div>


        <div className="landing-footer-bottom">

          <span>
            © 2026 SHIPORA. All rights reserved.
          </span>

          <span>
            Moving what matters.
          </span>

        </div>

      </footer>

    </main>
  );
}

export default Index;