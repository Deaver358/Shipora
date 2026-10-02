import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { api } from "../interceptors/api";
import {
    getCached,
    setCached,
    clearCached,
} from "../utils/appCache";

export const UserContext = createContext(undefined);

const CURRENT_USER_CACHE_KEY = "current_user";
const CURRENT_USER_CACHE_TTL = 5 * 60 * 1000;

export function UserProvider({ children }) {
    const [error, setError] = useState("");
    const [currentUser, setCurrentUserState] = useState(null);
    const [loading, setLoading] = useState(true);

    const location = useLocation();

    const authRoutes = [
        "/create-account",
        "/sign-in",
        "/verify-email",
        "/",
    ];

    const isAuthPage = authRoutes.includes(location.pathname);

    const setCurrentUser = useCallback((user) => {
        setCurrentUserState(user);

        if (user) {
            setCached(
                CURRENT_USER_CACHE_KEY,
                user,
                CURRENT_USER_CACHE_TTL
            );
        } else {
            clearCached(CURRENT_USER_CACHE_KEY);
        }
    }, []);

    const fetchUser = useCallback(async () => {
        try {
            setError("");

            const res = await api.get("/user/current_user", {
                withCredentials: true,
            });

            console.log(
                "========== SHIPORA CURRENT USER =========="
            );
            console.log(res.data);
            console.log(
                "==========================================="
            );

            setCurrentUser(res.data);
        } catch (err) {
            console.error("CURRENT USER ERROR:", err);

            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.detail ||
                    "Failed to fetch user"
                );
            } else {
                setError("Server Not Reachable");
            }
        } finally {
            setLoading(false);
        }
    }, [setCurrentUser]);

    useEffect(() => {
        if (isAuthPage) {
            setLoading(false);
            return;
        }

        if (currentUser) {
            setLoading(false);
            return;
        }

        const cachedUser = getCached(
            CURRENT_USER_CACHE_KEY
        );

        if (cachedUser) {
            setCurrentUserState(cachedUser);
            setLoading(false);

            /*
             * Keep the UI fast with cached data.
             * The next normal session refresh will fetch fresh data
             * after the cache expires.
             */
            return;
        }

        fetchUser();
    }, [
        isAuthPage,
        currentUser,
        fetchUser,
    ]);

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
        throw new Error(
            "useUser must be used inside UserProvider"
        );
    }

    return context;
}
