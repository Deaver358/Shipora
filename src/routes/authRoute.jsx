import { useEffect, useState } from "react";
import { api } from "../interceptors/api";
import axios from "axios";
import { useUser } from "../contexts/userContext";

export function getUserFunc () {

    const { currentUser, setCurrentUser } = useUser();
    const [ error, setError ] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function fetchUser() {
            try {
                const res = await api.get("/user/current_user");
                if (!cancelled) {const user = res.data; setCurrentUser(user)}
            }catch (err: unknown){
                if (cancelled) return;
                if (axios.isAxiosError(err)){
                    setError(err.response?.data?.detail || "Failed to fetch user");
                } else {
                    setError("Server Not Reachable");
                }
            }
        }

        fetchUser();

        return () => {
            cancelled = true;
        }
    }, []);

    return { currentUser, error };
}