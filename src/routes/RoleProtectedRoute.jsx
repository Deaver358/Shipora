import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";

function normalizeStatus(value) {
    if (value === true) return "verified";

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (["verified", "true"].includes(normalized)) {
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

function VerificationGate({ role, status, onLater }) {
    const navigate = useNavigate();

    const roleName =
        role === "vendor"
            ? "Vendor"
            : role === "dispatcher"
              ? "Dispatcher"
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

        if (status === "pending") {
            return "Verification required";
        }

        return "Verification required";
    };

    const getDescription = () => {
        if (status === "rejected") {
            return `Your ${roleName} verification was not approved. Please review your information and submit the verification again.`;
        }

        if (status === "review_required") {
            return `Your ${roleName} verification requires additional review by the Shipora team before workspace access can be granted.`;
        }

        return `To access your ${roleName} workspace, you need to complete the required verification first.`;
    };

    const getProcessText = () => {
        if (status === "review_required") {
            return "Your information has been flagged for additional review. The Shipora team can approve or reject the verification.";
        }

        if (status === "rejected") {
            return "You can return to verification and submit the required information again.";
        }

        return "Complete your verification and Shipora will process your information. If additional review is required, your verification can be reviewed by the Shipora team.";
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-blue-600"
                    >
                        <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
                        <path d="M9 12l2 2 4-4" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                    {getTitle()}
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                    {getDescription()}
                </p>

                <div className="mt-5 rounded-xl bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-800">
                        What happens next?
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        {getProcessText()}
                    </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={handleVerifyNow}
                        className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
                    >
                        {status === "rejected" ? "Verify Again" : "Verify Now"}
                    </button>

                    <button
                        type="button"
                        onClick={onLater}
                        className="flex-1 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
                    >
                        Maybe Later
                    </button>
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
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white text-black">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

                    <p className="text-sm font-semibold text-gray-700">
                        Checking workspace access...
                    </p>
                </div>
            </div>
        );
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
                    onLater={() => navigate("/home", { replace: true })}
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
                    onLater={() => navigate("/home", { replace: true })}
                />
            );
        }

        /*
         * CAC is optional for Vendor workspace access.
         * CAC verification does not block shipment creation.
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
                    onLater={() => navigate("/home", { replace: true })}
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
                    onLater={() => navigate("/home", { replace: true })}
                />
            );
        }

        /*
         * Vehicle verification is also required
         * before dispatcher workspace access.
         */
        if (vehicleStatus !== "verified") {
            return (
                <VerificationGate
                    role="dispatcher"
                    status={vehicleStatus}
                    onLater={() => navigate("/home", { replace: true })}
                />
            );
        }

        return children;
    }

    /*
     * ==============================
     * BOTH ROLES
     * ==============================
     *
     * Vendor capability:
     * NIN verified.
     *
     * Dispatcher capability:
     * NIN + vehicle verified.
     *
     * CAC remains optional.
     */

    if (role === "both") {
        const both = profile.both;

        if (!both) {
            return (
                <VerificationGate
                    role="both"
                    status="pending"
                    onLater={() => navigate("/home", { replace: true })}
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
         * NIN is required for Both Roles.
         */
        if (ninStatus !== "verified") {
            return (
                <VerificationGate
                    role="both"
                    status={ninStatus}
                    onLater={() => navigate("/home", { replace: true })}
                />
            );
        }

        /*
         * Vehicle is required for dispatcher
         * capabilities under Both Roles.
         */
        if (vehicleStatus !== "verified") {
            return (
                <VerificationGate
                    role="both"
                    status={vehicleStatus}
                    onLater={() => navigate("/home", { replace: true })}
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