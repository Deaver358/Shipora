import { useNavigate } from "react-router-dom";
import "../index.css";

function Verified() {
  const navigate = useNavigate();

  return (
    <main className="verification-status-page">

      <section className="verification-status-card verified-card">

        {/* SUCCESS GRAPHIC */}

        <div className="verified-success-area">

          <div className="verified-glow"></div>

          <div className="verified-ring verified-ring-one"></div>
          <div className="verified-ring verified-ring-two"></div>

          <div className="status-stamp verified-stamp">

            <div className="verified-check">
              ✓
            </div>

            <strong>
              VERIFIED
            </strong>

          </div>

        </div>


        {/* CONTENT */}

        <div className="status-content">

          <span className="status-eyebrow verified-eyebrow">
            ACCOUNT VERIFIED
          </span>

          <h1>
            You're officially verified.
          </h1>

          <p>
            Your account has been successfully verified and you now have
            access to Shipora's delivery and logistics services.
          </p>


          {/* SUCCESS INFO */}

          <div className="status-info-box verified-info-box">

            <div className="status-info-dot verified-dot"></div>

            <div>

              <strong>
                Verification complete
              </strong>

              <span>
                Your account is active and ready to use.
              </span>

            </div>

          </div>


          {/* BENEFITS */}

          <div className="verified-benefits">

            <div className="verified-benefit">

              <span className="verified-benefit-icon">
                ✓
              </span>

              <span>
                Access your Shipora workspace
              </span>

            </div>

            <div className="verified-benefit">

              <span className="verified-benefit-icon">
                ✓
              </span>

              <span>
                Create and manage deliveries
              </span>

            </div>

            <div className="verified-benefit">

              <span className="verified-benefit-icon">
                ✓
              </span>

              <span>
                Connect with verified users
              </span>

            </div>

          </div>

        </div>


        {/* CONTINUE */}

        <button
          type="button"
          className="verified-continue-button"
          onClick={() => navigate("/Home")}
        >

          <span>
            Continue to Shipora
          </span>

          <span className="verified-button-arrow">
            →
          </span>

        </button>


        <p className="verified-footer-text">
          Welcome to a smarter way to move what matters.
        </p>

      </section>

    </main>
  );
}

export default Verified;