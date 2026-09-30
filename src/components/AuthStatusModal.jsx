import { useEffect } from "react";

const STATUS_CONTENT = {
  signupSuccess: {
    label: "ACCOUNT CREATED",
    title: "Welcome to SHIPORA.",
    message:
      "Your account has been created successfully. Please verify your email address to continue.",
    button: "Continue",
  },

  loginSuccess: {
    label: "SIGNED IN",
    title: "Welcome back.",
    message:
      "You have successfully signed in to your SHIPORA account.",
    button: "Continue",
  },

  emailVerificationSent: {
    label: "CHECK YOUR EMAIL",
    title: "Verification email sent.",
    message:
      "We've sent a verification link to your email address. Open the email and follow the link to verify your account.",
    button: "Continue",
  },

  emailVerified: {
    label: "EMAIL VERIFIED",
    title: "You're all set.",
    message:
      "Your email address has been verified successfully. You can now access SHIPORA.",
    button: "Continue",
  },

  passwordResetSent: {
    label: "CHECK YOUR EMAIL",
    title: "Reset instructions sent.",
    message:
      "We've sent password-reset instructions to your email address. Follow the secure link in the email to continue.",
    button: "Return to Sign In",
  },

  passwordChanged: {
    label: "PASSWORD UPDATED",
    title: "Password changed.",
    message:
      "Your password has been updated successfully. You can now sign in with your new password.",
    button: "Return to Sign In",
  },

  googleSuccess: {
    label: "SIGNED IN",
    title: "Google sign-in successful.",
    message:
      "You have successfully signed in to your SHIPORA account.",
    button: "Continue",
  },

  vendorVerificationPending: {
    label: "VERIFICATION SUBMITTED",
    title: "Vendor verification submitted.",
    message:
      "Your vendor information has been submitted successfully. Your NIN verification is being processed. You will receive access to the Vendor Workspace once the required verification is completed.",
    button: "Continue",
  },

  dispatchVerificationPending: {
    label: "VERIFICATION SUBMITTED",
    title: "Dispatcher verification submitted.",
    message:
      "Your dispatcher information has been submitted successfully. Your NIN and vehicle verification are being processed. Dispatcher Workspace access will remain locked until the required verification is completed.",
    button: "Continue",
  },

  bothVerificationPending: {
    label: "VERIFICATION SUBMITTED",
    title: "Verification submitted.",
    message:
      "Your Vendor and Dispatcher information has been submitted successfully. Vendor access depends on NIN verification, while Dispatcher access also requires vehicle verification.",
    button: "Continue",
  },

  verificationReviewRequired: {
    label: "MANUAL REVIEW REQUIRED",
    title: "Your verification needs review.",
    message:
      "Your verification could not be completed automatically and has been sent to the Shipora verification team for manual review. You do not need to submit the information again unless requested.",
    button: "Continue",
  },

  verificationRejected: {
    label: "VERIFICATION NOT APPROVED",
    title: "Verification was not approved.",
    message:
      "The submitted verification information could not be approved. Please review the information provided and follow the instructions available in your verification section.",
    button: "Continue",
    isError: true,
  },

  verificationVerified: {
    label: "VERIFIED",
    title: "Verification successful.",
    message:
      "Your verification has been completed successfully. Your available Shipora access will update according to your verified role.",
    button: "Continue",
  },

  error: {
    label: "SOMETHING WENT WRONG",
    title: "We couldn't complete that.",
    message:
      "Something went wrong. Please try again.",
    button: "Try Again",
    isError: true,
  },
};

function AuthStatusModal({
  type = "loginSuccess",
  email = "",
  onClose,
}) {
  const content =
    STATUS_CONTENT[type] || STATUS_CONTENT.loginSuccess;

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="auth-status-overlay"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        className={`auth-status-modal ${
          content.isError ? "auth-status-modal-error" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-status-title"
      >
        <button
          type="button"
          className="auth-status-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="auth-status-icon">
          {content.isError ? "!" : "✓"}
        </div>

        <span className="auth-status-label">
          {content.label}
        </span>

        <h2 id="auth-status-title">
          {content.title}
        </h2>

        <p>
          {content.message}
        </p>

        {email && (
          <div className="auth-status-email">
            {email}
          </div>
        )}

        {type === "passwordResetSent" && (
          <p className="auth-status-note">
            Check your spam or junk folder if you don't
            see the email shortly.
          </p>
        )}

        <button
          type="button"
          className="auth-status-button"
          onClick={onClose}
        >
          {content.button}
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

export default AuthStatusModal;