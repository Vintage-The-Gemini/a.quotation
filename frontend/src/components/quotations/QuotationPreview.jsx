import React from "react";

const QuotationPreview = ({ quotation, template, business }) => {
  if (!quotation) {
    return <div className="text-center p-4">Quotation data is required</div>;
  }

  if (!template) {
    return <div className="text-center p-4">Select a template to preview</div>;
  }

  // Get the template layout style
  const getTemplateClass = () => {
    switch (template.layout) {
      case "classic":
        return "border-2 border-gray-300";
      case "professional":
        return "shadow-lg";
      case "minimal":
        return "border border-gray-200";
      case "modern":
      default:
        return "shadow-md";
    }
  };

  // Get header layout
  const headerLayout = template.sections?.header?.layout || "logo-right";

  // Format a date string
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount || 0);
  };

  // Format address
  const formatAddress = (address) => {
    if (!address) return "";
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const classes = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return classes[status] || classes.draft;
  };

  // Get logo URL
  const getLogoUrl = (logo) => {
    if (!logo) return null;

    if (typeof logo === "string") {
      // Legacy format
      return `/uploads/logos/${logo}`;
    }

    if (typeof logo === "object" && logo.url) {
      return logo.url;
    }

    return null;
  };

  return (
    <div
      className={`bg-white p-8 max-w-4xl mx-auto ${getTemplateClass()}`}
      style={{
        fontFamily: template.style?.fontFamily || "Arial",
        fontSize: template.style?.fontSize || "12px",
        color: "#333",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        {/* Business Info */}
        {template.sections?.header?.showBusinessInfo && (
          <div className={headerLayout === "logo-left" ? "order-2" : "order-1"}>
            <h1
              className="text-2xl font-bold"
              style={{ color: template.style?.primaryColor }}
            >
              {business?.name || "Your Business"}
            </h1>
            <div className="text-sm mt-2">
              <div>{business?.email}</div>
              <div>{business?.phone}</div>
              <div>{formatAddress(business?.address)}</div>
            </div>
          </div>
        )}

        {/* Logo */}
        {template.sections?.header?.showLogo && (
          <div
            className={`w-32 h-16 ${
              headerLayout === "logo-left" ? "order-1" : "order-2"
            }`}
          >
            {business?.logo ? (
              <img
                src={getLogoUrl(business.logo)}
                alt="Business Logo"
                className="h-full object-contain"
                onError={(e) => {
                  console.error("Error loading logo image");
                  e.target.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWYiIGZpbGw9IiM5OTkiPkxvZ288L3RleHQ+PC9zdmc+";
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded">
                <span className="text-xs text-gray-500">Your Logo</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quotation Title */}
      <div className="text-center mb-8">
        <h2
          className="text-xl font-bold uppercase"
          style={{ color: template.style?.primaryColor }}
        >
          Quotation
        </h2>
        {template.sections?.header?.showQuotationNumber && (
          <div className="mt-2">
            <div>Quotation #: {quotation.quotationNumber || "QT-0001"}</div>
            <div>Date: {formatDate(quotation.createdAt)}</div>
            <div>Valid Until: {formatDate(quotation.validUntil)}</div>
          </div>
        )}
      </div>

      {/* Customer Info */}
      <div
        className={`mb-8 flex ${
          template.sections?.customerInfo?.position === "right"
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <div>
          <h3 className="font-bold mb-2">Bill To:</h3>
          {template.sections?.customerInfo?.fields?.map((field) => {
            if (!field.isVisible) return null;

            let value = "";
            switch (field.name) {
              case "name":
                value = quotation.customer?.name || "";
                break;
              case "email":
                value = quotation.customer?.email || "";
                break;
              case "phone":
                value = quotation.customer?.phone || "";
                break;
              case "address":
                value = formatAddress(quotation.customer?.address);
                break;
              default:
                value = "";
            }

            return value ? <div key={field.name}>{value}</div> : null;
          })}

          <div className="mt-2">
            <span
              className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                quotation.status
              )}`}
            >
              {quotation.status || "Draft"}
            </span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead
            style={{ backgroundColor: `${template.style?.primaryColor}22` }}
          >
            <tr>
              {template.sections?.itemTable?.columns?.map((col) => {
                if (!col.isVisible) return null;
                return (
                  <th
                    key={col.name}
                    className="p-2 text-left border-b"
                    style={{ color: template.style?.primaryColor }}
                  >
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {quotation.items?.length > 0 ? (
              quotation.items.map((item, index) => (
                <tr key={index} className="border-b">
                  {template.sections?.itemTable?.columns?.map((col) => {
                    if (!col.isVisible) return null;

                    let value = "";
                    switch (col.name) {
                      case "item":
                        value = item.item?.name || "";
                        break;
                      case "description":
                        value = item.item?.description || "";
                        break;
                      case "quantity":
                        value = item.quantity?.toString() || "";
                        break;
                      case "unitPrice":
                        value = formatCurrency(item.unitPrice);
                        break;
                      case "tax":
                        value = item.tax ? `${item.tax}%` : "N/A";
                        break;
                      case "total":
                        value = formatCurrency(item.subtotal);
                        break;
                      default:
                        value = "";
                    }

                    return (
                      <td key={col.name} className="p-2">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-2 text-center text-gray-500">
                  No items added
                </td>
              </tr>
            )}
          </tbody>
          <tfoot
            style={{ backgroundColor: `${template.style?.primaryColor}11` }}
          >
            <tr>
              <td colSpan={4} className="p-2 text-right font-bold">
                Subtotal:
              </td>
              <td className="p-2">{formatCurrency(quotation.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={4} className="p-2 text-right font-bold">
                Tax:
              </td>
              <td className="p-2">{formatCurrency(quotation.taxTotal)}</td>
            </tr>
            <tr
              style={{ backgroundColor: `${template.style?.primaryColor}22` }}
            >
              <td
                colSpan={4}
                className="p-2 text-right font-bold"
                style={{ color: template.style?.primaryColor }}
              >
                Total:
              </td>
              <td
                className="p-2 font-bold"
                style={{ color: template.style?.primaryColor }}
              >
                {formatCurrency(quotation.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-12">
        {template.sections?.footer?.showTerms && quotation.terms && (
          <div className="mb-6">
            <h3 className="font-bold mb-2">Terms & Conditions:</h3>
            <p className="text-sm">{quotation.terms}</p>
          </div>
        )}

        {template.sections?.footer?.showSignature && (
          <div className="mt-16">
            <div className="border-t w-48 mx-auto text-center pt-2">
              Authorized Signature
            </div>
          </div>
        )}

        {template.sections?.footer?.customText && (
          <div className="mt-8 text-center text-xs text-gray-500">
            {template.sections.footer.customText}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationPreview;
