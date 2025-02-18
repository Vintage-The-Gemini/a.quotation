// /frontend/src/services/template.service.js

import api from "./api";

const templateService = {
  // Get all templates
  getTemplates: async () => {
    try {
      const response = await api.get("/templates");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single template
  getTemplate: async (id) => {
    try {
      const response = await api.get(`/templates/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create template
  createTemplate: async (templateData) => {
    try {
      const response = await api.post("/templates", templateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update template
  updateTemplate: async (id, templateData) => {
    try {
      const response = await api.put(`/templates/${id}`, templateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete template
  deleteTemplate: async (id) => {
    try {
      const response = await api.delete(`/templates/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Set default template
  setDefaultTemplate: async (id) => {
    try {
      const response = await api.put(`/templates/${id}/default`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default templateService;
