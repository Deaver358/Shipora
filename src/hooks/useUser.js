import { getUserFunc } from "../routes/authRoute";

export function useUserPage () {
    const { currentUser, error } = getUserFunc();
    return {
        currentUser: currentUser ?? null,
        error,
        loading: !error && currentUser,
    };
}