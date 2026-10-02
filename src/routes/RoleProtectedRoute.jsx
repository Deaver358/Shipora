import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";
import "../styles/change.css";

function normalizeStatus(value) {
  if (value === true) return "verified";

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["verified", "true", "success", "successful", "approved"].includes(normalized)) {
      return "verified";
    }

    if (["rejected", "review_required", "pending"].includes(normalized)) {
      return normalized;
    }
  }

  return "pending";
}

function getVerificationStatus(...values) {
  for (const value of values) {
    const status = normalizeStatus(value);

    if (status === "verified") return "verified";
    if (status === "rejected") return "rejected";
    if (status === "review_required") return "review_required";
    if (status === "pending") return "pending";
  }

  return "pending";
}

function VerificationIcon() {
  return (
    <div className="workspace-verification-icon">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 3.5L19 6.8V11.5C19 16.1 16.1 19.2 12 20.5C7.9 19.2 5 16.1 5 11.5V6.8L12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M8.8 12L10.9 14.1L15.4 9.7"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function VerificationGate({ role, status, onLater }) {
  const navigate = useNavigate();

  const roleName =
    role === "vendor"
      ? "Vendor"
      : role === "dispatcher"
        ? "Dispatch"
        : "Shipora";

  const handleVerifyNow = () => {
    if (role === "vendor") {
      navigate("/verify-role/VerifyVendor");
      return;
    }

    if (role === "dispatcher") {
      navigate("/verify-role/VerifyDispatch");
      return;
    }

    if (role === "both") {
      navigate("/verify-role/both");
    }
  };

  const getTitle = () => {
    if (status === "rejected") {
      return "Verification needs attention";
    }

    if (status === "review_required") {
      return "Verification under review";
    }

    return "Verification required";
  };

  const getDescription = () => {
    if (status === "rejected") {
      return `Your ${roleName} verification was not approved. Review your information and submit it again to continue.`;
    }

    if (status === "review_required") {
      return `Your ${roleName} verification requires additional review before this workspace can be accessed.`;
    }

    return `Complete the required verification to access your ${roleName} workspace.`;
  };

  const getProcessText = () => {
    if (status === "review_required") {
      return "Your information is being reviewed by Shipora. Workspace access will become available once the required checks are completed.";
    }

    if (status === "rejected") {
      return "You can return to verification, correct the required information and submit it again.";
    }

    return "Complete the verification steps and Shipora will process the required checks for your account.";
  };

  return (
    <div className="workspace-gate-overlay">
      <div className="workspace-gate-card">
        <div className="workspace-gate-top">
          <VerificationIcon />

          <span className="workspace-gate-label">
            SHIPORA SECURITY
          </span>
        </div>

        <h1>{getTitle()}</h1>

        <p className="workspace-gate-description">
          {getDescription()}
        </p>

        <div className="workspace-gate-info">
          <div className="workspace-gate-info-icon">
            ✓
          </div>

          <div>
            <strong>What happens next?</strong>

            <p>{getProcessText()}</p>
          </div>
        </div>

        <div className="workspace-gate-actions">
          <button
            type="button"
            className="workspace-gate-primary"
            onClick={handleVerifyNow}
          >
            {status === "rejected" ? "Verify Again" : "Verify Now"}
            <span>→</span>
          </button>

          <button
            type="button"
            className="workspace-gate-secondary"
            onClick={onLater}
          >
            Maybe Later
          </button>
        </div>

      </div>
    </div>
  );
}

function WorkspaceLoading() {
  return (
    <div className="workspace-loading-screen">
      <div className="workspace-loading-card">
        <div className="workspace-loading-spinner"></div>

        <div className="workspace-loading-content">
          <span className="workspace-loading-label">
            SHIPORA
          </span>

          <strong>
            Opening workspace
          </strong>

          <p>
            Checking your account...
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleProtectedRoute({ role, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      try {
        const response = await api.get("/profile/me", {
          withCredentials: true,
        });

        if (!mounted) return;

        setProfile(response.data);
      } catch (err) {
        console.error("Role verification check failed:", err);

        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkRole();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <WorkspaceLoading />;
  }

  if (error || !profile) {
    return <Navigate to="/login" replace />;
  }

  /*
   * ==============================
   * VENDOR WORKSPACE
   * ==============================
   */

  if (role === "vendor") {
    const vendor = profile.vendor;

    if (!vendor) {
      return (
        <VerificationGate
          role="vendor"
          status="pending"
          onLater={() => navigate(-1)}
        />
      );
    }

    const ninStatus = getVerificationStatus(
      vendor.nin_verification_status,
      vendor.nin_verified
    );

    if (ninStatus !== "verified") {
      return (
        <VerificationGate
          role="vendor"
          status={ninStatus}
          onLater={() => navigate(-1)}
        />
      );
    }

    /*
     * CAC is optional for Vendor workspace access.
     */

    return children;
  }

  /*
   * ==============================
   * DISPATCHER WORKSPACE
   * ==============================
   */

  if (role === "dispatcher") {
    const dispatcher = profile.dispatcher;

    if (!dispatcher) {
      return (
        <VerificationGate
          role="dispatcher"
          status="pending"
          onLater={() => navigate(-1)}
        />
      );
    }

    const ninStatus = getVerificationStatus(
      dispatcher.nin_verification_status,
      dispatcher.nin_verified
    );

    const vehicleStatus = getVerificationStatus(
      dispatcher.vehicle_verification_status,
      dispatcher.vehicle_verified
    );

    /*
     * NIN must be verified first.
     */

    if (ninStatus !== "verified") {
      return (
        <VerificationGate
          role="dispatcher"
          status={ninStatus}
          onLater={() => navigate(-1)}
        />
      );
    }

    /*
     * Vehicle verification is also required.
     */

    if (vehicleStatus !== "verified") {
      return (
        <VerificationGate
          role="dispatcher"
          status={vehicleStatus}
          onLater={() => navigate(-1)}
        />
      );
    }

    return children;
  }

  /*
   * ==============================
   * BOTH ROLES
   * ==============================
   */

  if (role === "both") {
    const both = profile.both;

    if (!both) {
      return (
        <VerificationGate
          role="both"
          status="pending"
          onLater={() => navigate(-1)}
        />
      );
    }

    const ninStatus = getVerificationStatus(
      both.nin_verification_status,
      both.nin_verified
    );

    const vehicleStatus = getVerificationStatus(
      both.vehicle_verification_status,
      both.vehicle_verified
    );

    /*
     * NIN is required.
     */

    if (ninStatus !== "verified") {
      return (
        <VerificationGate
          role="both"
          status={ninStatus}
          onLater={() => navigate(-1)}
        />
      );
    }

    /*
     * Vehicle is required for dispatch capability.
     */

    if (vehicleStatus !== "verified") {
      return (
        <VerificationGate
          role="both"
          status={vehicleStatus}
          onLater={() => navigate(-1)}
        />
      );
    }

    return children;
  }

  /*
   * ==============================
   * UNKNOWN ROLE
   * ==============================
   */

  return (
    <Navigate
      to="/home"
      state={{ from: location.pathname }}
      replace
    />
  );
}

export default RoleProtectedRoute;