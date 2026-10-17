/*
 * Session handling for every backend call.
 *
 * - Axios calls (`api` from ./api) refresh the access token automatically;
 *   that logic lives in ./api.jsx.
 * - Several pages call the backend with window.fetch. This wrapper gives
 *   them the same behaviour: on an expired/missing access token it refreshes
 *   the session once (using the httpOnly refresh cookie) and retries.
 */
import {
  isAuthRequest,
  isRefreshableAuthError,
  redirectToLogin,
  refreshSession,
} from "./api";
import { API_BASE_URL } from "../config";

if (typeof window !== "undefined" && !window.__shiporaFetchPatched) {
  window.__shiporaFetchPatched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const isApiCall = url.startsWith(API_BASE_URL);

    // Our backend relies on cookies — always send them on API calls.
    const requestInit =
      isApiCall && !init.credentials
        ? { ...init, credentials: "include" }
        : init;

    const response = await originalFetch(input, requestInit);

    if (
      !isApiCall ||
      isAuthRequest(url) ||
      (response.status !== 401 && response.status !== 403)
    ) {
      return response;
    }

    let detail;

    try {
      const body = await response.clone().json();
      detail = body?.detail;
    } catch {
      detail = "";
    }

    if (!isRefreshableAuthError(response.status, detail)) {
      return response;
    }

    try {
      await refreshSession();
    } catch {
      redirectToLogin();
      return response;
    }

    // Request bodies we send (JSON strings / FormData) can be re-sent safely.
    return originalFetch(input, requestInit);
  };
}
