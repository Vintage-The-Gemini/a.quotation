// /frontend/src/services/business.service.js

import api from "./api";

const businessService = {
  // Get business settings
  getSettings: async () => {
    try {
      const response = await api.get("/business/settings");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update business settings
  updateSettings: async (formData) => {
    try {
      const response = await api.put("/business/settings", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get business logo URL
  getLogoUrl: (filename) => {
    if (!filename) return null;
    return `${api.defaults.baseURL}/uploads/logos/${filename}`;
  },
};

export default businessService;
