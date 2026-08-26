import { useNavigate } from "react-router-dom";
import "../index.css";

function VerifyRole() {
  const navigate = useNavigate();

  return (
    <main className="verify-role-page">

      <section className="verify-role-card">

        <div className="verify-role-eyebrow">
          <span></span>
          SHIPORA VERIFICATION
        </div>

        <h1>
          Choose how you want
          <span> to use Shipora.</span>
        </h1>

        <p className="verify-role-intro">
          Before you can manage shipments, choose the role
          you want to use. You can verify as a Vendor, Dispatch,
          or both.
        </p>

        <div className="verify-role-options">

          {/* VENDOR */}

          <button
            type="button"
            className="verify-role-option"
            onClick={() => navigate("/verify-role/VerifyVendor")}
          >
            <div className="verify-role-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 10L5.5 4H18.5L20 10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M4 10V19C4 19.55 4.45 20 5 20H19C19.55 20 20 19.55 20 19V10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />

                <path
                  d="M8 20V14H16V20"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="verify-role-content">
              <span className="verify-role-label">
                VENDOR
              </span>

              <strong>
                Create and manage shipments
              </strong>

              <p>
                Create shipments, manage deliveries and
                keep track of your outgoing packages.
              </p>
            </div>

            <span className="verify-role-arrow">
              →
            </span>
          </button>


          {/* DISPATCH */}

          <button
            type="button"
            className="verify-role-option"
            onClick={() => navigate("/verify-role/VerifyDispatch")}
          >
            <div className="verify-role-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6H15V17H3V6Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />

                <path
                  d="M15 10H18L21 13V17H15V10Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />

                <circle
                  cx="7"
                  cy="18"
                  r="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />

                <circle
                  cx="17"
                  cy="18"
                  r="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </div>

            <div className="verify-role-content">
              <span className="verify-role-label">
                DISPATCH
              </span>

              <strong>
                Manage and deliver shipments
              </strong>

              <p>
                Find available delivery jobs, manage
                assigned shipments and update delivery status.
              </p>
            </div>

            <span className="verify-role-arrow">
              →
            </span>
          </button>

        </div>


        {/* BOTH */}

        <button
          type="button"
          className="verify-both-button"
          onClick={() => navigate("/verify-role/both")}
        >
          Verify for both roles
          <span>→</span>
        </button>


        <div className="verify-role-note">
          <span>SECURE VERIFICATION</span>

          <p>
            Verification gives you access only to the
            Shipora features associated with the role you
            have been approved for.
          </p>
        </div>


        <button
          type="button"
          className="verify-back-button"
          onClick={() => navigate("/Home")}
        >
          ← Back to Home
        </button>

      </section>

    </main>
  );
}

export default VerifyRole;