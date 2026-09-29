import { useState } from "react";
import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1.0";

function ChangePassword() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/profile/change-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to change your password."
        );
      }

      setMessage(
        data?.message || "Your password has been changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate(-1);
      }, 1200);
    } catch (err) {
      setError(
        err.message || "Something went wrong while changing your password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">

      <header className="change-password-header">

        <button
          type="button"
          className="change-password-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>

        <img
          src={shiporaLogo}
          alt="Shipora"
          className="change-password-logo"
        />

        <span className="change-password-label">
          CHANGE PASSWORD
        </span>

      </header>

      <main className="change-password-content">

        <section className="change-password-intro">

          <span className="change-password-eyebrow">
            ACCOUNT SECURITY
          </span>

          <h1>
            Change your
            <span>password.</span>
          </h1>

          <p>
            Update your Shipora account password securely.
            Your current password is required before a new
            password can be created.
          </p>

        </section>

        <section className="change-password-notice">

          <strong>Password security</strong>

          <p>
            Choose a password that is difficult to guess and
            different from passwords you use on other services.
          </p>

        </section>

        <form
          className="change-password-form"
          onSubmit={handleChangePassword}
        >

          <div className="change-password-field">

            <label htmlFor="current-password">
              CURRENT PASSWORD
            </label>

            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              placeholder="Enter your current password"
              autoComplete="current-password"
              disabled={loading}
            />

          </div>

          <div className="change-password-field">

            <label htmlFor="new-password">
              NEW PASSWORD
            </label>

            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              placeholder="Enter your new password"
              autoComplete="new-password"
              disabled={loading}
            />

            <small>
              Use at least 8 characters.
            </small>

          </div>

          <div className="change-password-field">

            <label htmlFor="confirm-password">
              CONFIRM NEW PASSWORD
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm your new password"
              autoComplete="new-password"
              disabled={loading}
            />

          </div>

          {error && (
            <div className="change-password-message error">
              {error}
            </div>
          )}

          {message && (
            <div className="change-password-message success">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="change-password-primary"
            disabled={loading}
          >
            {loading ? (
              "Updating..."
            ) : (
              <>
                Change Password
                <span>→</span>
              </>
            )}
          </button>

        </form>

        <div className="change-password-footer">

          <span>
            Forgot your current password?
          </span>

          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
          >
            Reset password →
          </button>

        </div>

      </main>

    </div>
  );
}

export default ChangePassword;