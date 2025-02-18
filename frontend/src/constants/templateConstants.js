// /frontend/src/constants/templateConstants.js

export const TEMPLATE_LAYOUTS = {
  MODERN: "modern",
  CLASSIC: "classic",
  PROFESSIONAL: "professional",
  MINIMAL: "minimal",
};

export const TEMPLATE_DEFAULTS = {
  modern: {
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
      },
      customerInfo: {
        position: "right",
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
        customText: "",
      },
    },
  },
  classic: {
    // Similar structure but with different default values
  },
  professional: {
    // Similar structure but with different default values
  },
  minimal: {
    // Similar structure but with different default values
  },
};
