// frontend/src/services/api.js
import axios from "axios";
import { toast } from "react-hot-toast";

// Define the baseURL without relying on process.env
// Using relative URL to avoid cross-origin issues
const baseURL = "/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors gracefully
    if (error.code === "ERR_NETWORK") {
      console.error("Network error, server might be down:", error);
      // Only show one toast for network errors
      if (!window.networkErrorShown) {
        toast.error("Network error: Server might be down or not running.");
        window.networkErrorShown = true;
        // Reset after 5 seconds to prevent too many toasts
        setTimeout(() => {
          window.networkErrorShown = false;
        }, 5000);
      }
      return Promise.reject(error);
    }

    const message =
      error.response?.data?.message || error.message || "Server error";

    // Don't show toast for 401 errors (they're handled by auth logic)
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear auth if token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
