import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthStatusModal from "../components/AuthStatusModal";
import "../index.css";
import logo from "../assets/shipora-logo.jpeg";

function EmailVerification() {
  const navigate = useNavigate();

  const [authModal, setAuthModal] = useState({
    open: true,
    type: "emailVerified",
    email: "",
  });

  const handleModalClose = () => {
    setAuthModal({
      open: false,
      type: "emailVerified",
      email: "",
    });

    navigate("/login");
  };

  return (
    <main className="auth-page">

      <div className="auth-background"></div>

      <section className="auth-card verification-card">

        {/* Brand */}
        <Link to="/" className="auth-brand">

          <img
            src={logo}
            alt="SHIPORA"
          />

          <div>
            <strong>SHIPORA</strong>

            <span>
              LOGISTICS &amp; FORWARDING
            </span>
          </div>

        </Link>


        {/* Verified Content */}
        <div className="verification-content">

          <div className="verification-icon">
            <span>✓</span>
          </div>

          <span className="verification-label">
            EMAIL VERIFIED
          </span>

          <h1>
            You're all set.
          </h1>

          <p className="verification-main-text">
            Your email address has been successfully
            verified.
          </p>

          <p>
            Your SHIPORA account is now ready to use.
          </p>


          <Link
            to="/login"
            className="auth-primary-button auth-button-link"
          >
            Continue to Sign In
            <span>→</span>
          </Link>


          <Link
            to="/"
            className="verification-home-link"
          >
            Back to SHIPORA
          </Link>

        </div>

      </section>


      {/* Footer */}
      <footer className="auth-footer">

        <span>
          SHIPORA
        </span>

        <p>
          Logistics &amp; Forwarding
        </p>

      </footer>


      {/* Email Verified Modal */}
      {authModal.open && (
        <AuthStatusModal
          type={authModal.type}
          email={authModal.email}
          onClose={handleModalClose}
        />
      )}

    </main>
  );
}

export default EmailVerification;