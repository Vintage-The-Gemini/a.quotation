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

  // frontend/src/services/quotation.service.js - generatePDF method
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
          headers: { Accept: "application/pdf, application/json" },
          timeout: 60000, // Increase timeout to 60 seconds
        }
      );

      // Check if the response is valid
      if (!response.data) {
        console.error("Empty response received");
        throw new Error("No data received from server");
      }

      // Additional debugging
      console.log("PDF generation response:", {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers["content-type"],
        dataSize: response.data ? response.data.size : "No data",
        dataType: response.data ? response.data.type : "Unknown",
      });

      // Check if we got a JSON error response instead of a PDF
      const contentType = response.headers["content-type"] || "";
      const dataType = response.data.type || "";

      if (
        contentType.includes("application/json") ||
        contentType.includes("text/plain") ||
        dataType.includes("application/json") ||
        dataType.includes("text/plain")
      ) {
        // This is likely an error response in JSON format
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const text = reader.result;
              console.log("Error response content:", text);

              try {
                const errorData = JSON.parse(text);
                reject(
                  errorData.message ||
                    errorData.error ||
                    "Server returned an error"
                );
              } catch (parseError) {
                // If not valid JSON, just return the text
                reject(text || "Server returned an error");
              }
            } catch (e) {
              reject("Failed to parse error response");
            }
          };
          reader.onerror = () => reject("Failed to read error response");
          reader.readAsText(response.data);
        });
      }

      // If we got here, it's a PDF response
      // Create a blob URL for the PDF
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      return { blob, url };
    } catch (error) {
      console.error("PDF generation error:", error);

      // Full error details for debugging
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);

        // Try to extract error message from response
        if (error.response.data) {
          if (error.response.data instanceof Blob) {
            // Try to read error message from blob
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const text = reader.result;
                  console.error("Error blob content:", text);

                  try {
                    const errorData = JSON.parse(text);
                    reject(
                      errorData.message || errorData.error || "Server error"
                    );
                  } catch (parseError) {
                    reject(text || "Server error");
                  }
                } catch (readError) {
                  reject(`Failed to read error response: ${readError.message}`);
                }
              };
              reader.onerror = () => {
                reject(`Failed to read error response: ${reader.error}`);
              };
              reader.readAsText(error.response.data);
            });
          } else if (typeof error.response.data === "object") {
            return Promise.reject(
              error.response.data.message ||
                error.response.data.error ||
                "Server error"
            );
          }
        }
      }

      // Network or other errors
      if (error.message && error.message.includes("timeout")) {
        return Promise.reject(
          "PDF generation timed out. The server might be busy or the document is too complex."
        );
      }

      if (error.message && error.message.includes("Network Error")) {
        return Promise.reject(
          "Network error. Please check your connection and try again."
        );
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
