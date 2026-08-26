import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AuthStatusModal from "../components/AuthStatusModal";
import "../index.css";
import logo from "../assets/shipora-logo.jpeg";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [modalType, setModalType] = useState(null);

  const closeModal = () => {
    setModalType(null);
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    setModalType(null);
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.session) {
        throw new Error(
          "Your account could not be signed in. Please verify your email first."
        );
      }

      setModalType("loginSuccess");
    } catch (loginError) {
      console.error("Login error:", loginError);

      setModalType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setModalType(null);
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
      console.error("Google login error:", googleError);

      setModalType("error");
      setGoogleLoading(false);
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
            <span>LOGISTICS &amp; FORWARDING</span>
          </div>

        </Link>


        {/* Heading */}
        <div className="auth-heading">

          <span>WELCOME BACK</span>

          <h1>Sign in to SHIPORA.</h1>

          <p>
            Access your deliveries, shipments and
            SHIPORA services.
          </p>

        </div>


        {/* Login Form */}
        <form
          className="auth-form"
          onSubmit={handleLogin}
        >

          {/* Email */}
          <div className="auth-form-field">

            <label htmlFor="login-email">
              Email Address
            </label>

            <input
              id="login-email"
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


          {/* Password */}
          <div className="auth-form-field">

            <div className="auth-label-row">

              <label htmlFor="login-password">
                Password
              </label>

              <Link
                to="/forgot-password"
                className="auth-forgot-button"
              >
                Forgot password?
              </Link>

            </div>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

          </div>


          {/* Sign In */}
          <button
            type="submit"
            className="auth-primary-button"
            disabled={loading || googleLoading}
          >

            {loading
              ? "Signing In..."
              : "Sign In"}

            {!loading && <span>→</span>}

          </button>

        </form>


        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>


        {/* Google Login */}
        <button
          type="button"
          className="google-auth-button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
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


        {/* Signup */}
        <p className="auth-switch">

          Don't have a SHIPORA account?

          {" "}

          <Link to="/signup">
            Create account
          </Link>

        </p>


        {/* Legal */}
        <p className="auth-legal">

          By continuing, you agree to SHIPORA's{" "}

          <Link to="/terms">
            Terms of Service
          </Link>{" "}

          and{" "}

          <Link to="/privacy">
            Privacy Policy
          </Link>.

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
      {modalType && (
        <AuthStatusModal
          type={modalType}
          onClose={() => {
            if (modalType === "loginSuccess") {
              closeModal();
              navigate("/");
              return;
            }

            closeModal();
          }}
        />
      )}

    </main>
  );
}

export default Login;
