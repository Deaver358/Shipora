import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { api } from "../interceptors/api";

export const UserContext = createContext(undefined);

export function UserProvider({ children }) {
    const [error, setError] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const location = useLocation();

    const authRoutes = ["/create-account", "/sign-in", "/verify-email", "/"];
    const isAuthPage = authRoutes.includes(location.pathname);

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);

            const res = await api.get("/user/current_user", {
                withCredentials: true,
            });

            console.log("========== SHIPORA CURRENT USER ==========");
            console.log(res.data);
            console.log("===========================================");

            setCurrentUser(res.data);
        } catch (err) {
            console.error("CURRENT USER ERROR:", err);

            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.detail || "Failed to fetch user"
                );
            } else {
                setError("Server Not Reachable");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthPage) {
            setLoading(false);
            return;
        }

        if (currentUser) {
            setLoading(false);
            return;
        }

        fetchUser();
    }, [isAuthPage, currentUser, fetchUser]);

    return (
        <UserContext.Provider
            value={{
                currentUser,
                setCurrentUser,
                fetchUser,
                loading,
            }}
        >
            <div>
                {loading && !isAuthPage ? (
                    <div className="fixed inset-0 flex text-black font-bold text-5xl items-center justify-center bg-blue-400">
                        Loading...
                    </div>
                ) : (
                    children
                )}
            </div>
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);

    if (!context) {
        throw new Error("useUser must be used inside UserProvider");
    }

    return context;
}