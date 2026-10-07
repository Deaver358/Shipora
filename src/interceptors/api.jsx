import axios from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/`,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const detail = String(error?.response?.data?.detail || "").toLowerCase();

    const isAuthEndpoint =
      error?.config?.url?.includes("auth/sign_in") ||
      error?.config?.url?.includes("auth/sign_up");

    const isSessionError =
      status === 401 &&
      [
        "missing access token",
        "invalid access token",
        "access token required",
      ].includes(detail);

    const isBlockedOrRevoked =
      status === 403 &&
      (
        detail.includes("token is blocked") ||
        detail.includes("access token expired") ||
        detail.includes("access token revoked")
      );

    if (!isAuthEndpoint && (isSessionError || isBlockedOrRevoked)) {
      const currentPath =
        window.location.pathname + window.location.search;

      if (window.location.pathname !== "/login") {
        window.location.href =
          `/login?session=expired&redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    return Promise.reject(error);
  }
);