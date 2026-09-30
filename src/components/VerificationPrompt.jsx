import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";
import "../index.css";

function isTrue(value) {
  return value === true || value === "true";
}

function getVerificationRequired(profile) {
  const role = String(profile?.role || "").toLowerCase();

  if (role === "vendor") {
    return !isTrue(profile?.vendor?.nin_verified);
  }

  if (role === "dispatcher") {
    return (
      !isTrue(profile?.dispatcher?.nin_verified) ||
      !isTrue(profile?.dispatcher?.vehicle_verified)
    );
  }

  if (
    role === "both" ||
    role === "both_roles" ||
    role === "bothroles"
  ) {
    return (
      !isTrue(profile?.vendor?.nin_verified) ||
      !isTrue(profile?.dispatcher?.vehicle_verified)
    );
  }

  /*
   * A normal Shipora account that has not selected/completed
   * a role should also be allowed to see the verification prompt.
   */
  return true;
}

function VerificationPrompt() {
  const navigate = useNavigate();

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userKey, setUserKey] = useState("");

  useEffect(() => {
    let cancelled = false;

    const checkVerification = async () => {
      try {
        const response = await api.get("profile/me", {
          withCredentials: true,
        });

        const profile = response?.data;

        if (cancelled || !profile) {
          return;
        }

        const uid =
          profile.uid ||
          profile.user_uid ||
          profile.id;

        if (!uid) {
          return;
        }

        const promptKey =
          `shipora_verification_prompt_${uid}`;

        setUserKey(promptKey);

        const alreadyHandled =
          localStorage.getItem(promptKey);

        if (alreadyHandled === "handled") {
          return;
        }

        if (getVerificationRequired(profile)) {
          setVisible(true);
        }
      } catch (error) {
        /*
         * Do not interrupt the user's normal Home experience
         * if the profile request fails.
         */
        console.error(
          "Verification prompt profile check failed:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkVerification();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLater = () => {
    if (userKey) {
      localStorage.setItem(userKey, "handled");
    }

    setVisible(false);
  };

  const handleVerify = () => {
    if (userKey) {
      localStorage.setItem(userKey, "handled");
    }

    setVisible(false);
    navigate("/verify-role");
  };

  if (loading || !visible) {
    return null;
  }

  return (
    <div
      className="verification-prompt-overlay"
      role="presentation"
    >
      <section
        className="verification-prompt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-prompt-title"
      >
        <button
          type="button"
          className="verification-prompt-close"
          onClick={handleLater}
          aria-label="Close"
        >
          ×
        </button>

        <div className="verification-prompt-icon">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M12 3.5 5.5 6v5.1c0 4.25 2.55 7.9 6.5 9.4 3.95-1.5 6.5-5.15 6.5-9.4V6L12 3.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            <path
              d="m8.8 12 2.15 2.15 4.3-4.45"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <span className="verification-prompt-label">
          ACCOUNT VERIFICATION
        </span>

        <h2 id="verification-prompt-title">
          Complete your verification.
        </h2>

        <p>
          Verify your SHIPORA account to unlock the
          features available for your selected role.
        </p>

        <div className="verification-prompt-actions">
          <button
            type="button"
            className="verification-prompt-primary"
            onClick={handleVerify}
          >
            Verify Now
            <span>→</span>
          </button>

          <button
            type="button"
            className="verification-prompt-later"
            onClick={handleLater}
          >
            Later
          </button>
        </div>

        <small>
          You can complete verification anytime from
          Settings.
        </small>
      </section>
    </div>
  );
}

export default VerificationPrompt;
