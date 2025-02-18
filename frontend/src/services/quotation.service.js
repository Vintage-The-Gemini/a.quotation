import api from "./api";

// Type definitions for TypeScript support
/**
 * @typedef {Object} QuotationResponse
 * @property {boolean} success
 * @property {Object} data
 * @property {string} [message]
 */

/**
 * @typedef {Object} EmailParams
 * @property {string} [templateId]
 * @property {string} recipientEmail
 * @property {string} [message]
 */

/**
 * @typedef {Object} QuotationFilters
 * @property {string} [status]
 * @property {string} [customerId]
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {number} [page]
 * @property {number} [limit]
 */

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

/**
 * Handles error responses, including Blob error responses
 * @param {Error} error - The error object from the API call
 * @returns {Promise<string>} - Rejected promise with error message
 */
const handleError = async (error) => {
  // Handle blob response errors
  if (error.response?.data && isBlob(error.response.data)) {
    try {
      const text = await error.response.data.text();
      const errorData = JSON.parse(text);
      return Promise.reject(
        errorData.message || "An error occurred processing the PDF"
      );
    } catch (parseError) {
      return Promise.reject("Error processing the request");
    }
  }

  // Log detailed error information in development
  if (process.env.NODE_ENV === "development") {
    console.error("API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
  }

  // Handle regular errors
  const errorMessage =
    error.response?.data?.message ||
    error.message ||
    "An unexpected error occurred";
  return Promise.reject(errorMessage);
};

/**
 * Enhanced quotation service with robust error handling and type checking
 */
const quotationService = {
  /**
   * Get all quotations with optional filters
   * @param {QuotationFilters} filters - Optional filters for quotations
   * @returns {Promise<QuotationResponse>}
   */
  getQuotations: async (filters = {}) => {
    try {
      const response = await api.get(ENDPOINTS.BASE, {
        params: {
          ...filters,
          timestamp: Date.now(), // Cache busting
        },
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Get single quotation by ID
   * @param {string} id - Quotation ID
   * @returns {Promise<QuotationResponse>}
   */
  getQuotation: async (id) => {
    if (!id) {
      return Promise.reject("Quotation ID is required");
    }

    try {
      const response = await api.get(`${ENDPOINTS.BASE}/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Download quotation as PDF
   * @param {string} id - Quotation ID
   * @param {string} templateId - Optional template ID
   * @returns {Promise<{blob: Blob, url: string}>}
   */
  downloadQuotation: async (id, templateId) => {
    if (!id) {
      return Promise.reject("Quotation ID is required");
    }

    try {
      const response = await api.post(
        ENDPOINTS.PDF(id),
        { templateId },
        {
          responseType: "blob",
          headers: {
            Accept: PDF_CONTENT_TYPE,
          },
          timeout: DEFAULT_TIMEOUT,
        }
      );

      // Validate response type
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

  /**
   * Update quotation status
   * @param {string} id - Quotation ID
   * @param {string} status - New status
   * @returns {Promise<QuotationResponse>}
   */
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

  /**
   * Send quotation via email
   * @param {string} id - Quotation ID
   * @param {EmailParams} params - Email parameters
   * @returns {Promise<QuotationResponse>}
   */
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

  /**
   * Duplicate an existing quotation
   * @param {string} id - Quotation ID to duplicate
   * @param {Object} modifications - Optional modifications for the new quotation
   * @returns {Promise<QuotationResponse>}
   */
  duplicateQuotation: async (id, modifications = {}) => {
    if (!id) {
      return Promise.reject("Quotation ID is required");
    }

    try {
      const response = await api.post(ENDPOINTS.DUPLICATE(id), modifications);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Cancel a running request
   * @param {string} requestId - The ID of the request to cancel
   */
  cancelRequest: (requestId) => {
    if (api.cancelToken) {
      api.cancelToken.cancel(`Request ${requestId} cancelled by user`);
    }
  },
};

export default quotationService;
