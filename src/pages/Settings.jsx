import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

function SettingsIcon({ type }) {
  if (type === "password") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <rect
          x="4"
          y="10"
          width="16"
          height="10"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M8 10V7.5C8 5.29 9.79 3.5 12 3.5C14.21 3.5 16 5.29 16 7.5V10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "verification") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3L19 6V11.5C19 16 16.2 19.5 12 21C7.8 19.5 5 16 5 11.5V6L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 12L11 14.5L16 9.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "help") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M9.5 9C9.7 7.8 10.65 7 12 7C13.45 7 14.5 7.9 14.5 9.15C14.5 10.4 13.7 11.05 12.75 11.65C11.9 12.2 11.5 12.7 11.5 13.6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="11.5" cy="16.5" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (type === "contact") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <rect
          x="3.5"
          y="5"
          width="17"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M4.5 7L12 13L19.5 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "dispute") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 8v4M12 16h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10.3 4.5 3.6 16a2 2 0 0 0 1.74 3h13.32a2 2 0 0 0 1.74-3L13.7 4.5a2 2 0 0 0-3.4 0Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (type === "terms") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M6 3.5H15L19 7.5V20.5H6V3.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M15 3.5V7.5H19"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M9 11H16M9 14.5H16M9 18H13"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "privacy") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3L19 6V11.5C19 16 16.2 19.5 12 21C7.8 19.5 5 16 5 11.5V6L12 3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9 12L11 14L15.5 9.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return null;
}

function Settings() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="account-page settings-page">
      <header className="account-topbar">
        <button
          className="account-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>

        <img src={shiporaLogo} alt="Shipora" className="app-logo" />

        <div className="account-page-label">SETTINGS</div>
      </header>

      <main className="account-content settings-content">
        <section className="settings-intro">
          <span className="account-eyebrow">ACCOUNT SETTINGS</span>

          <h1>Settings</h1>

          <p>
            Manage your account access, verification, support options and
            Shipora information.
          </p>
        </section>

        <section className="settings-group">
          <div className="settings-group-heading">
            <span>ACCOUNT</span>
            <h2>Account access</h2>
          </div>

          <button
            className="settings-option"
            onClick={() => navigate("/verify-role")}
          >
            <span className="settings-option-icon">
              <SettingsIcon type="verification" />
            </span>

            <span className="settings-option-content">
              <strong>Verification & KYC</strong>
              <small>
                Complete or update the verification required for your Shipora
                role.
              </small>
            </span>

            <span className="settings-option-arrow">→</span>
          </button>

          <button
            className="settings-option"
            onClick={() => navigate("/Change-Password")}
          >
            <span className="settings-option-icon">
              <SettingsIcon type="password" />
            </span>

            <span className="settings-option-content">
              <strong>Change Password</strong>
              <small>
                Update the password used to access your account.
              </small>
            </span>

            <span className="settings-option-arrow">→</span>
          </button>
        </section>

        <section className="settings-group">
          <div className="settings-group-heading">
            <span>SUPPORT</span>
            <h2>Need assistance?</h2>
          </div>

          <button
            className="settings-option"
            onClick={() => navigate("/disputes")}
          >
            <span className="settings-option-icon">
              <SettingsIcon type="dispute" />
            </span>

            <span className="settings-option-content">
              <strong>Report a Shipment Issue</strong>
              <small>View or report an issue with a shipment</small>
            </span>

            <span className="settings-option-arrow">›</span>
          </button>

          <button
            className="settings-option"
            onClick={() => navigate("/help")}
          >
            <span className="settings-option-icon">
              <SettingsIcon type="help" />
            </span>

            <span className="settings-option-content">
              <strong>Help Center</strong>
              <small>
                Find answers and guidance for using Shipora.
              </small>
            </span>

            <span className="settings-option-arrow">→</span>
          </button>

          <button
            className="settings-option"
            onClick={() => navigate("/contact")}
          >
            <span className="settings-option-icon">
              <SettingsIcon type="contact" />
            </span>

            <span className="settings-option-content">
              <strong>Contact Support</strong>
              <small>
                Send a message to the Shipora support team.
              </small>
            </span>

            <span className="settings-option-arrow">→</span>
          </button>
        </section>

        <section className="settings-group">
          <div className="settings-group-heading">
            <span>LEGAL</span>
            <h2>Shipora information</h2>
          </div>

          <button
            className="settings-option"
            onClick={() => navigate("/terms")}
          >
            <span className="settings-option-icon">
              <SettingsIcon type="terms" />
            </span>

            <span className="settings-option-content">
              <strong>Terms of Service</strong>
              <small>
                Review the terms governing use of Shipora.
              </small>
            </span>

            <span className="settings-option-arrow">→</span>
          </button>

          <button
            className="settings-option"
            onClick={() => navigate("/privacy")}
          >
            <span className="settings-option-icon">
              <SettingsIcon type="privacy" />
            </span>

            <span className="settings-option-content">
              <strong>Privacy Policy</strong>
              <small>
                Learn how Shipora handles account information.
              </small>
            </span>

            <span className="settings-option-arrow">→</span>
          </button>
        </section>

        <section className="logout-card">
          <div>
            <span>ACCOUNT</span>
            <strong>Sign out of Shipora</strong>
            <p>
              You can sign back in whenever you need access to your account.
            </p>
          </div>

          <button onClick={handleLogout}>Log Out</button>
        </section>
      </main>
    </div>
  );
}

export default Settings;