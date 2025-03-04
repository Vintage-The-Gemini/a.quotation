import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import templateService from "../../services/template.service";

const TemplateCreate = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "quotation",
    layout: "modern",
    isDefault: false,
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
        customText: "",
      },
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await templateService.createTemplate(formData);
      if (response.success) {
        toast.success("Template created successfully");
        navigate("/templates");
      }
    } catch (error) {
      toast.error(error.message || "Failed to create template");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Template
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create a new quotation template
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Template Name
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="layout"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Layout
              </label>
              <select
                id="layout"
                value={formData.layout}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, layout: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="professional">Professional</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <div className="flex items-center">
                <input
                  id="isDefault"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isDefault: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isDefault"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Set as Default Template
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Style Settings */}
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Style Settings
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label
                htmlFor="primaryColor"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Primary Color
              </label>
              <input
                type="color"
                id="primaryColor"
                value={formData.style.primaryColor}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    style: { ...prev.style, primaryColor: e.target.value },
                  }))
                }
                className="mt-1 block w-full h-10 rounded-md border-gray-300 dark:border-gray-600"
              />
            </div>

            <div>
              <label
                htmlFor="fontFamily"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Font Family
              </label>
              <select
                id="fontFamily"
                value={formData.style.fontFamily}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    style: { ...prev.style, fontFamily: e.target.value },
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier">Courier</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="fontSize"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Font Size
              </label>
              <select
                id="fontSize"
                value={formData.style.fontSize}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    style: { ...prev.style, fontSize: e.target.value },
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="10px">Small (10px)</option>
                <option value="12px">Medium (12px)</option>
                <option value="14px">Large (14px)</option>
                <option value="16px">Extra Large (16px)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section Settings */}
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Section Settings
          </h2>
          {/* Header Settings */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Header
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showLogo"
                  checked={formData.sections.header.showLogo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        header: {
                          ...prev.sections.header,
                          showLogo: e.target.checked,
                        },
                      },
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="showLogo"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Show Logo
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showBusinessInfo"
                  checked={formData.sections.header.showBusinessInfo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        header: {
                          ...prev.sections.header,
                          showBusinessInfo: e.target.checked,
                        },
                      },
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="showBusinessInfo"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Show Business Information
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Header Layout
                </label>
                <select
                  value={formData.sections.header.layout || "logo-right"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        header: {
                          ...prev.sections.header,
                          layout: e.target.value,
                        },
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="logo-right">Logo on Right</option>
                  <option value="logo-left">Logo on Left</option>
                  <option value="centered">Centered Logo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Info Settings */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Customer Information
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Position
              </label>
              <select
                value={formData.sections.customerInfo.position}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      customerInfo: {
                        ...prev.sections.customerInfo,
                        position: e.target.value,
                      },
                    },
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>

          {/* Footer Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Footer
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showTerms"
                  checked={formData.sections.footer.showTerms}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        footer: {
                          ...prev.sections.footer,
                          showTerms: e.target.checked,
                        },
                      },
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="showTerms"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Show Terms & Conditions
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showSignature"
                  checked={formData.sections.footer.showSignature}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        footer: {
                          ...prev.sections.footer,
                          showSignature: e.target.checked,
                        },
                      },
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="showSignature"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Show Signature Line
                </label>
              </div>

              <div>
                <label
                  htmlFor="customText"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Custom Footer Text
                </label>
                <textarea
                  id="customText"
                  rows={2}
                  value={formData.sections.footer.customText}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        footer: {
                          ...prev.sections.footer,
                          customText: e.target.value,
                        },
                      },
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/templates")}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Template"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateCreate;
