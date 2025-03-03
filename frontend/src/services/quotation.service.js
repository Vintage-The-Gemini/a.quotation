import api from "./api";

// Constants
const ENDPOINTS = {
  BASE: "/quotations",
  PDF: (id) => `/quotations/${id}/pdf`,
  STATUS: (id) => `/quotations/${id}/status`,
  EMAIL: (id) => `/quotations/${id}/email`,
  DUPLICATE: (id) => `/quotations/${id}/duplicate`,
};

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const PDF_CONTENT_TYPE = "application/pdf";

// Utility functions
const isBlob = (data) => data instanceof Blob;

const handleError = async (error) => {
  // Handle blob response errors
  if (error.response?.data && isBlob(error.response.data)) {
    try {
      const text = await error.response.data.text();
      const errorData = JSON.parse(text);
      return Promise.reject(
        errorData.message || "An error occurred processing the PDF"
      );
    } catch {
      return Promise.reject("Error processing the request");
    }
  }

  // Handle regular errors
  return Promise.reject(
    error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred"
  );
};

const quotationService = {
  getQuotations: async (filters = {}) => {
    try {
      const response = await api.get(ENDPOINTS.BASE, {
        params: { ...filters, timestamp: Date.now() }, // Cache busting
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getQuotation: async (id) => {
    if (!id) return Promise.reject("Quotation ID is required");

    try {
      const response = await api.get(`${ENDPOINTS.BASE}/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  downloadQuotation: async (id, templateId) => {
    if (!id) return Promise.reject("Quotation ID is required");

    try {
      const response = await api.post(
        ENDPOINTS.PDF(id),
        { templateId },
        {
          responseType: "blob",
          headers: { Accept: PDF_CONTENT_TYPE },
          timeout: DEFAULT_TIMEOUT,
        }
      );

      if (!response.data || !isBlob(response.data)) {
        throw new Error("Invalid PDF response received");
      }

      const blob = new Blob([response.data], { type: PDF_CONTENT_TYPE });
      const url = URL.createObjectURL(blob);

      return { blob, url };
    } catch (error) {
      return handleError(error);
    }
  },

  sendEmail: async (
    id,
    { templateId = null, recipientEmail, message = null } = {}
  ) => {
    if (!id || !recipientEmail) {
      return Promise.reject("Quotation ID and recipient email are required");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return Promise.reject("Invalid email format");
    }

    try {
      const response = await api.post(ENDPOINTS.EMAIL(id), {
        templateId,
        recipientEmail,
        message,
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateStatus: async (id, status) => {
    if (!id || !status) {
      return Promise.reject("Quotation ID and status are required");
    }

    try {
      const response = await api.put(ENDPOINTS.STATUS(id), { status });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  duplicateQuotation: async (id, modifications = {}) => {
    if (!id) return Promise.reject("Quotation ID is required");

    try {
      const response = await api.post(ENDPOINTS.DUPLICATE(id), modifications);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  cancelRequest: (requestId) => {
    if (api.cancelToken) {
      api.cancelToken.cancel(`Request ${requestId} cancelled by user`);
    }
  },
};

export default quotationService;
