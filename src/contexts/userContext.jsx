import { createContext, useContext, useState, useCallback, useEffect} from "react";
import type { User } from "../schemas/usertype";
import { useLocation } from "react-router-dom";
import { getCurrentUid } from "../hooks/userId";
import axios from "axios";
import { api } from "../interceptors/api";

type UserContextType = {
    currentUser: User | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>
    fetchUser: () => Promise<void>;
    loading: boolean
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({children}:{children: React.ReactNode}){
    const [ error, setError ] = useState("");
    const [ currentUser, setCurrentUser ] = useState<User | null>(null);
    const [ loading, setLoading ] = useState(true);
    const location = useLocation();
    const authRoutes = ["/create-account", "/sign-in", "/verify-email", "/"]
    const isAuthPage = authRoutes.includes(location.pathname)

    const fetchUser = useCallback(async () => {
        try{
            setLoading(true);
            const res = await api.get("/user/current_user", {withCredentials: true});
            setCurrentUser(res.data);

        }catch(err: unknown){
            if(axios.isAxiosError(err)){
                setError(err.response?.data.detail || "Failed to fetch user");
            }else{
                setError("Server Not Reachable");
            }
        }finally{
            setLoading(false)
        }
    }, []);

    useEffect(() => {
        if (isAuthPage){
            setLoading(false);
            return;
        }
        if (currentUser){
            setLoading(false);
            return;
        }
        fetchUser();
    }, [isAuthPage, currentUser, fetchUser]) 

    return (
        <UserContext.Provider value={{ currentUser, setCurrentUser, fetchUser, loading }}>
            <div>
                {loading && !isAuthPage ? 
                <div className="fixed inset-0 flex text-black font-bold text-5xl items-center justify-center bg-blue-400">
                    Loading...
                </div>:children}
            </div>
        </UserContext.Provider>
    )
}

export function useUser () {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used inside UserProvider");
    return context;
}