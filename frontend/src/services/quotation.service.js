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

  generatePDF: async (id, templateId) => {
    if (!id) return Promise.reject("Quotation ID is required");

    try {
      console.log(`Generating PDF for quotation: ${id}`);

      // Make the API call with proper error handling
      const response = await api.post(
        ENDPOINTS.PDF(id),
        { templateId: templateId || null },
        {
          responseType: "blob",
          headers: { Accept: "application/pdf" },
          timeout: 60000, // Increase timeout to 60 seconds
        }
      );

      // Check if the response is valid
      if (!response.data || !(response.data instanceof Blob)) {
        console.error("Invalid response format:", response);
        throw new Error("Invalid PDF response received");
      }

      // Check if the response is a PDF or an error message
      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("application/json")) {
        // This is an error response in JSON format
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result);
              reject(errorData.message || "Server returned an error");
            } catch (e) {
              reject("Failed to parse error response");
            }
          };
          reader.onerror = () => reject("Failed to read error response");
          reader.readAsText(response.data);
        });
      }

      // Create a blob URL for the PDF
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      return { blob, url };
    } catch (error) {
      console.error("PDF generation error:", error);

      // Extract error message from response if possible
      if (error.response && error.response.data) {
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            try {
              const errorData = JSON.parse(text);
              return Promise.reject(errorData.message || "Server error");
            } catch {
              return Promise.reject(text || "Server error");
            }
          } catch {
            return Promise.reject(`Server error: ${error.response.status}`);
          }
        } else {
          return Promise.reject(
            error.response.data?.message ||
              `Server error: ${error.response.status}`
          );
        }
      }

      return Promise.reject(error.message || "Failed to generate PDF");
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

  create: async (quotationData) => {
    try {
      const response = await api.post(ENDPOINTS.BASE, quotationData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, quotationData) => {
    if (!id) return Promise.reject("Quotation ID is required");

    try {
      const response = await api.put(`${ENDPOINTS.BASE}/${id}`, quotationData);
      return response.data;
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
