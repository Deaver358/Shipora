import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthStatusModal from "../components/AuthStatusModal";
import "../index.css";
import logo from "../assets/shipora-logo.jpeg";

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [authModal, setAuthModal] = useState({
    open: false,
    type: "passwordChanged",
    email: "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError(
        "Your new password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    /*
     * Frontend-only for now.
     *
     * The actual Supabase/FastAPI password update
     * will be connected when the reset backend flow
     * is completed.
     */
    setTimeout(() => {
      setLoading(false);

      setAuthModal({
        open: true,
        type: "passwordChanged",
        email: "",
      });
    }, 1200);
  };

  const handleModalClose = () => {
    setAuthModal({
      open: false,
      type: "passwordChanged",
      email: "",
    });

    navigate("/login");
  };

  return (
    <main className="auth-page">

      <div className="auth-background"></div>

      <section className="auth-card reset-password-card">

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
            Create a new password.
          </h1>

          <p>
            Choose a new password for your SHIPORA
            account. Make sure it is at least 8
            characters long.
          </p>

        </div>


        {/* Error */}
        {error && (
          <div className="auth-message auth-error">
            {error}
          </div>
        )}


        {/* Reset Form */}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          {/* New Password */}
          <div className="auth-form-field">

            <label htmlFor="reset-password">
              New Password
            </label>

            <div className="password-input-wrapper">

              <input
                id="reset-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

          </div>


          {/* Confirm Password */}
          <div className="auth-form-field">

            <label htmlFor="reset-confirm-password">
              Confirm New Password
            </label>

            <div className="password-input-wrapper">

              <input
                id="reset-confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(
                    event.target.value
                  );
                  setError("");
                }}
                placeholder="Repeat your new password"
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) => !previous
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

          </div>


          {/* Update Password */}
          <button
            type="submit"
            className="auth-primary-button"
            disabled={loading}
          >

            {loading
              ? "Updating Password..."
              : "Update Password"}

            {!loading && (
              <span>→</span>
            )}

          </button>

        </form>


        {/* Sign In */}
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


      {/* Password Updated Modal */}
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

export default ResetPassword;