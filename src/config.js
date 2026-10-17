// Single source of truth for the backend URL.
// Set VITE_API_URL (e.g. https://shipora-api.onrender.com/api/v1.0) in Vercel.
// VITE_API_BASE_URL is still accepted for older deployments.
const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api/v1.0";

export const API_BASE_URL = String(rawApiUrl).replace(/\/+$/, "");

export function apiUrl(path = "") {
  return `${API_BASE_URL}/${String(path).replace(/^\/+/, "")}`;
}

export default API_BASE_URL;
