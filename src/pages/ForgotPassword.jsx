import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthStatusModal from "../components/AuthStatusModal";
import "../index.css";
import logo from "../assets/shipora-logo.jpeg";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [authModal, setAuthModal] = useState({
    open: false,
    type: "passwordResetSent",
    email: "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setLoading(true);

    /*
     * Frontend demonstration only.
     *
     * The actual password-reset email will be connected
     * to the FastAPI backend later.
     */
    setTimeout(() => {
      setLoading(false);

      setAuthModal({
        open: true,
        type: "passwordResetSent",
        email: email.trim(),
      });
    }, 1200);
  };

  const handleModalClose = () => {
    setAuthModal({
      open: false,
      type: "passwordResetSent",
      email: "",
    });

    // Return directly to Sign In
    navigate("/login");
  };

  return (
    <main className="auth-page">

      <div className="auth-background"></div>

      <section className="auth-card forgot-password-card">

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


        {/* Heading */}
        <div className="auth-heading">

          <span>ACCOUNT RECOVERY</span>

          <h1>
            Forgot your password?
          </h1>

          <p>
            Enter the email address connected to your
            SHIPORA account and we'll help you regain
            access.
          </p>

        </div>


        {/* Form */}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <div className="auth-form-field">

            <label htmlFor="forgot-email">
              Email Address
            </label>

            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

          </div>


          <button
            type="submit"
            className="auth-primary-button"
            disabled={loading}
          >

            {loading
              ? "Sending..."
              : "Send Reset Instructions"}

            {!loading && (
              <span>→</span>
            )}

          </button>

        </form>


        {/* Return to Login */}
        <p className="auth-switch">

          Remember your password?

          {" "}

          <Link to="/login">
            Sign in
          </Link>

        </p>

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


      {/* Password Reset Modal */}
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

export default ForgotPassword;
