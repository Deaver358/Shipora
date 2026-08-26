import { useNavigate } from "react-router-dom";
import "../index.css";

function Rejected() {
  const navigate = useNavigate();

  return (
    <main className="verification-status-page">

      <section className="verification-status-card rejected-card">

        <div className="status-stamp rejected-stamp">
          <span className="status-icon">✕</span>
          <strong>REJECTED</strong>
        </div>

        <div className="status-content">

          <span className="status-eyebrow rejected-eyebrow">
            VERIFICATION STATUS
          </span>

          <h1>
            Your verification was not approved.
          </h1>

          <p>
            We were unable to approve your account verification at this time.
            Please review your information and submit your details again.
          </p>

          <div className="status-info-box rejected-info-box">

            <div className="status-info-dot rejected-dot"></div>

            <div>
              <strong>
                Verification needs attention
              </strong>

              <span>
                Some of the information or documents submitted may need to
                be updated before you can continue.
              </span>
            </div>

          </div>

          <p className="status-small-text">
            Make sure your information is correct and your documents are
            clear before submitting again.
          </p>

        </div>

        <button
          type="button"
          className="reverify-button"
          onClick={() => navigate("/verify-role")}
        >
          Re-verify Account
          <span>→</span>
        </button>

      </section>

    </main>
  );
}

export default Rejected;