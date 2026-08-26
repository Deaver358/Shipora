import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AuthStatusModal from "../components/AuthStatusModal";
import "../index.css";
import logo from "../assets/shipora-logo.jpeg";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");

  const [authModal, setAuthModal] = useState({
    open: false,
    type: "signupSuccess",
    email: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    setError("");

    if (!acceptedTerms) {
      setError(
        "Please read and accept the Terms of Service and Privacy Policy."
      );
      return;
    }

    if (formData.password.length < 8) {
      setError(
        "Your password must be at least 8 characters."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const email = formData.email.trim();

      const redirectUrl = `${window.location.origin}/`;

      const { data, error: signupError } =
        await supabase.auth.signUp({
          email,
          password: formData.password,

          options: {
            emailRedirectTo: redirectUrl,

            data: {
              full_name: formData.fullName.trim(),
              phone: formData.phone.trim(),
              terms_accepted: true,
              terms_version: "1.0",
            },
          },
        });

      if (signupError) {
        throw signupError;
      }

      /*
       * If email confirmation is disabled,
       * Supabase gives us a session immediately.
       */
      if (data.session) {
        setAuthModal({
          open: true,
          type: "signupSuccess",
          email,
        });

        return;
      }

      /*
       * If email confirmation is enabled,
       * show the email verification modal.
       */
      setAuthModal({
        open: true,
        type: "emailVerificationSent",
        email,
      });

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });

      setAcceptedTerms(false);

    } catch (signupError) {
      console.error("Signup error:", signupError);

      setError(
        signupError.message ||
          "We couldn't create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");

    if (!acceptedTerms) {
      setError(
        "Please read and accept the Terms of Service and Privacy Policy before continuing with Google."
      );
      return;
    }

    setGoogleLoading(true);

    try {
      const { error: googleError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",

          options: {
            redirectTo: `${window.location.origin}/`,

            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });

      if (googleError) {
        throw googleError;
      }

    } catch (googleError) {
      console.error(
        "Google signup error:",
        googleError
      );

      setError(
        googleError.message ||
          "Google sign-in could not be started. Please try again."
      );

      setGoogleLoading(false);
    }
  };

  const handleModalClose = () => {
  const modalType = authModal.type;

  setAuthModal({
    open: false,
    type: "signupSuccess",
    email: "",
  });

  if (
    modalType === "signupSuccess" ||
    modalType === "emailVerificationSent"
  ) {
    navigate("/login");
  }
};

  return (
    <main className="auth-page">

      <div className="auth-background"></div>

      <section className="auth-card">

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

          <span>CREATE ACCOUNT</span>

          <h1>Welcome to SHIPORA.</h1>

          <p>
            Create your account to send deliveries,
            manage shipments and access SHIPORA services.
          </p>

        </div>


        {/* Error */}
        {error && (
          <div className="auth-message auth-error">
            {error}
          </div>
        )}


        {/* Signup Form */}
        <form
          className="auth-form"
          onSubmit={handleSignup}
        >

          {/* Full Name */}
          <div className="auth-form-field">

            <label htmlFor="signup-name">
              Full Name
            </label>

            <input
              id="signup-name"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />

          </div>


          {/* Email */}
          <div className="auth-form-field">

            <label htmlFor="signup-email">
              Email Address
            </label>

            <input
              id="signup-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />

          </div>


          {/* Phone */}
          <div className="auth-form-field">

            <label htmlFor="signup-phone">
              Phone Number
            </label>

            <input
              id="signup-phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+234 800 000 0000"
              autoComplete="tel"
              required
            />

          </div>


          {/* Password Grid */}
          <div className="auth-form-grid">

            {/* Password */}
            <div className="auth-form-field">

              <label htmlFor="signup-password">
                Password
              </label>

              <div className="password-input-wrapper">

                <input
                  id="signup-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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

              <label htmlFor="signup-confirm-password">
                Confirm Password
              </label>

              <div className="password-input-wrapper">

                <input
                  id="signup-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
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

          </div>


          {/* Terms */}
          <label className="auth-terms">

            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) =>
                setAcceptedTerms(
                  event.target.checked
                )
              }
            />

            <span>
              I have read and agree to the{" "}

              <Link to="/terms">
                Terms of Service
              </Link>{" "}

              and{" "}

              <Link to="/privacy">
                Privacy Policy
              </Link>.
            </span>

          </label>


          {/* Create Account */}
          <button
            type="submit"
            className="auth-primary-button"
            disabled={
              loading ||
              googleLoading
            }
          >

            {loading
              ? "Creating Account..."
              : "Create Account"}

            {!loading && (
              <span>→</span>
            )}

          </button>

        </form>


        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>


        {/* Google */}
        <button
          type="button"
          className="google-auth-button"
          onClick={handleGoogleSignup}
          disabled={
            loading ||
            googleLoading
          }
        >

          <span className="google-icon">

            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >

              <path
                fill="#4285F4"
                d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
              />

              <path
                fill="#34A853"
                d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z"
              />

              <path
                fill="#FBBC05"
                d="M6.54 13.83A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.83V7.64H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.36l3.24-2.53Z"
              />

              <path
                fill="#EA4335"
                d="M12 6.14c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.23 14.63 2.25 12 2.25A9.75 9.75 0 0 0 3.3 7.64l3.24 2.53C7.31 7.86 9.46 6.14 12 6.14Z"
              />

            </svg>

          </span>

          {googleLoading
            ? "Connecting to Google..."
            : "Continue with Google"}

        </button>


        {/* Login */}
        <p className="auth-switch">

          Already have a SHIPORA account?

          {" "}

          <Link to="/login">
            Sign in
          </Link>

        </p>

      </section>


      {/* Footer */}
      <footer className="auth-footer">

        <span>SHIPORA</span>

        <p>
          Logistics &amp; Forwarding
        </p>

      </footer>


      {/* Authentication Status Modal */}
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

export default Signup;