import axios from "axios";
import { API_BASE_URL } from "../config";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/`,
  withCredentials: true,
  timeout: 30000,
});

// Token problems that a fresh access token (from the refresh cookie) fixes
const REFRESHABLE_401 = [
  "missing access token",
  "invalid access token",
  "access token required",
  "access token has expired",
];

const REFRESHABLE_403 = [
  "token is blocked",
  "access token expired",
  "access token revoked",
];

// Requests that must never trigger a refresh / login redirect
const AUTH_PATHS = [
  "auth/sign_in",
  "auth/sign_up",
  "auth/refresh_access",
  "auth/logout",
  "auth/admin-login",
  "auth/reset_password",
  "auth/password_reset",
  "auth/resend_verification",
];

// Public pages where a missing session is normal (no redirect to login)
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/email-verification",
  "/terms",
  "/privacy",
  "/tracking",
  "/payment-result",
  "/admin-login",
  "/help",
  "/contact",
];

export function isAuthRequest(url = "") {
  return AUTH_PATHS.some((path) => String(url).includes(path));
}

export function isRefreshableAuthError(status, detail) {
  const text = String(detail || "").toLowerCase();

  if (status === 401) {
    return REFRESHABLE_401.includes(text);
  }

  if (status === 403) {
    return REFRESHABLE_403.some((item) => text.includes(item));
  }

  return false;
}

let refreshPromise = null;

/**
 * Ask the backend for a new access token using the httpOnly refresh cookie.
 * Concurrent callers share one request.
 */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_BASE_URL}/auth/refresh_access`,
        {},
        { withCredentials: true, timeout: 15000 }
      )
      .finally(() => {
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      });
  }

  return refreshPromise;
}

export function redirectToLogin() {
  const { pathname, search } = window.location;

  const isPublic =
    PUBLIC_PATHS.includes(pathname.toLowerCase()) ||
    pathname.toLowerCase().startsWith("/checkout") ||
    pathname.toLowerCase().startsWith("/shipment/");

  if (isPublic || pathname.toLowerCase().startsWith("/admin")) {
    if (pathname.toLowerCase().startsWith("/admin") && pathname !== "/admin-login") {
      window.location.href = "/admin-login";
    }
    return;
  }

  window.location.href = `/login?session=expired&redirect=${encodeURIComponent(
    pathname + search
  )}`;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail;

    if (
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.skipAuth ||
      isAuthRequest(originalRequest.url) ||
      !isRefreshableAuthError(status, detail)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshSession();
      return api(originalRequest);
    } catch {
      redirectToLogin();
      return Promise.reject(error);
    }
  }
);
