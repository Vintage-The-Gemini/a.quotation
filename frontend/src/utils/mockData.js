// frontend/src/utils/mockData.js
/**
 * This file provides mock data for development when backend server is unavailable
 * Use this by adding a fallback mechanism in your components when API calls fail
 */

export const mockBusiness = {
  _id: "mock123",
  name: "Demo Business",
  email: "demo@business.com",
  phone: "+1 234 567 8900",
  address: {
    street: "123 Business St",
    city: "Tech City",
    state: "Stateville",
    zipCode: "12345",
    country: "Developia",
  },
  logo: {
    url: "https://via.placeholder.com/150?text=Logo",
    isCloudinary: true,
  },
  settings: {
    theme: "default",
    quotationPrefix: "QT",
    currency: "KES",
    defaultTax: {
      enabled: true,
      name: "VAT",
      rate: 16,
    },
  },
};

export const mockTemplates = [
  {
    _id: "template1",
    name: "Modern Template",
    description: "A clean, modern template for professional quotations",
    type: "quotation",
    layout: "modern",
    isDefault: true,
    style: {
      primaryColor: "#1a73e8",
      fontFamily: "Arial",
      fontSize: "12px",
    },
    sections: {
      header: {
        showLogo: true,
        showBusinessInfo: true,
        showQuotationNumber: true,
        layout: "logo-right",
      },
      customerInfo: {
        position: "left",
        fields: [
          { name: "name", isVisible: true },
          { name: "email", isVisible: true },
          { name: "phone", isVisible: true },
          { name: "address", isVisible: true },
        ],
      },
      itemTable: {
        columns: [
          { name: "item", label: "Item", isVisible: true },
          { name: "description", label: "Description", isVisible: true },
          { name: "quantity", label: "Quantity", isVisible: true },
          { name: "unitPrice", label: "Unit Price", isVisible: true },
          { name: "tax", label: "Tax", isVisible: true },
          { name: "total", label: "Total", isVisible: true },
        ],
      },
      footer: {
        showTerms: true,
        showSignature: true,
        customText: "Thank you for your business!",
      },
    },
  },
];

export const mockUser = {
  id: "user123",
  name: "Demo User",
  email: "demo@user.com",
  role: "admin",
  businessId: "mock123",
};

// Use this function to simulate API delays and responses
export const mockApiResponse = (data, delay = 500, shouldFail = false) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject({ message: "Simulated API failure" });
      } else {
        resolve({ success: true, data });
      }
    }, delay);
  });
};
