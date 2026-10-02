import { useState } from "react";
import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

function AdminLogin() {
  const navigate = useNavigate();

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000/api/v1.0";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Enter your admin email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/admin-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Invalid admin credentials."
        );
      }

      // The backend stores the access token in an HttpOnly cookie.
      // Do not put the admin token in localStorage.
      navigate("/admin-kyc", { replace: true });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">

        <button
          type="button"
          className="admin-login-logo"
          onClick={() => navigate("/")}
          aria-label="Back to Shipora"
        >
          <img
            src={shiporaLogo}
            alt="Shipora"
          />
        </button>

        <div className="admin-login-heading">
          <span>SHIPORA ADMIN</span>

          <h1>Admin sign in</h1>

          <p>
            Secure access to Shipora administration and
            verification tools.
          </p>
        </div>

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="admin-email">
            Admin email
          </label>

          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="admin@shipora.com"
            autoComplete="username"
            disabled={loading}
          />

          <label htmlFor="admin-password">
            Password
          </label>

          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading}
          />

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          className="admin-login-back"
          onClick={() => navigate("/")}
        >
          ← Back to Shipora
        </button>

      </div>
    </main>
  );
}

export default AdminLogin;
