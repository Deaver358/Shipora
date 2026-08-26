import { useState } from "react";
import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

function ChangePassword() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendCode = () => {
    setError("");
    setMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }

    setCodeSent(true);
    setMessage(
      "A verification code has been sent to your registered email address."
    );
  };

  const handleChangePassword = (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!verificationCode) {
      setError("Please enter the verification code.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    // Backend password change will be connected later.
    setMessage("Your password has been changed successfully.");

    setTimeout(() => {
      navigate(-1);
    }, 1200);
  };

  return (
    <div className="change-password-page">

      {/* ================= HEADER ================= */}

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


      {/* ================= CONTENT ================= */}

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


        {/* ================= SECURITY NOTICE ================= */}

        <section className="change-password-notice">

          <strong>Password security</strong>

          <p>
            Choose a password that is difficult to guess and
            different from passwords you use on other services.
          </p>

        </section>


        {/* ================= FORM ================= */}

        <form
          className="change-password-form"
          onSubmit={handleChangePassword}
        >

          {/* CURRENT PASSWORD */}

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
            />

          </div>


          {/* NEW PASSWORD */}

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
            />

            <small>
              Use at least 8 characters.
            </small>

          </div>


          {/* CONFIRM PASSWORD */}

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
            />

          </div>


          {/* VERIFICATION */}

          {codeSent && (

            <div className="change-password-verification">

              <div>

                <span className="change-password-eyebrow">
                  EMAIL VERIFICATION
                </span>

                <h2>
                  Verify the change.
                </h2>

                <p>
                  Enter the verification code sent to your
                  registered email address.
                </p>

              </div>

              <div className="change-password-field">

                <label htmlFor="verification-code">
                  VERIFICATION CODE
                </label>

                <input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(event) =>
                    setVerificationCode(event.target.value)
                  }
                  placeholder="Enter verification code"
                  autoComplete="one-time-code"
                />

              </div>

            </div>

          )}


          {/* ERROR */}

          {error && (
            <div className="change-password-message error">
              {error}
            </div>
          )}


          {/* SUCCESS */}

          {message && (
            <div className="change-password-message success">
              {message}
            </div>
          )}


          {/* BUTTON */}

          {!codeSent ? (

            <button
              type="button"
              className="change-password-primary"
              onClick={handleSendCode}
            >
              Continue
              <span>→</span>
            </button>

          ) : (

            <button
              type="submit"
              className="change-password-primary"
            >
              Change Password
              <span>→</span>
            </button>

          )}

        </form>


        {/* ================= FORGOT PASSWORD ================= */}

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