import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../interceptors/api";

function RoleProtectedRoute({ role, children }) {
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

                if (mounted) {
                    setProfile(response.data);
                }
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
            <div className="fixed inset-0 flex items-center justify-center bg-white text-black font-bold text-xl">
                Checking workspace access...
            </div>
        );
    }

    if (error) {
        return <Navigate to="/sign-in" replace />;
    }

    if (role === "vendor") {
        const vendor = profile?.vendor;

        if (!vendor) {
            return <Navigate to="/verify-role/VerifyVendor" replace />;
        }

        if (!vendor.nin_verified) {
            return <Navigate to="/pending" replace />;
        }

        return children;
    }

    if (role === "dispatcher") {
        const dispatcher = profile?.dispatcher;

        if (!dispatcher) {
            return <Navigate to="/verify-role/VerifyDispatch" replace />;
        }

        if (!dispatcher.nin_verified) {
            return <Navigate to="/pending" replace />;
        }

        return children;
    }

    return <Navigate to="/shipments" replace />;
}

export default RoleProtectedRoute;