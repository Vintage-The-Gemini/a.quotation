// frontend/src/services/api.js
import axios from "axios";
import { toast } from "react-hot-toast";

// Define the baseURL without relying on process.env
// You can change this to match your backend URL
const baseURL = "http://localhost:5000/api";

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
