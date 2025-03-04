// frontend/src/pages/quotations/QuotationDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  DocumentArrowDownIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import quotationService from "../../services/quotation.service";
import templateService from "../../services/template.service";
import businessService from "../../services/business.service";
import { useTheme } from "../../context/ThemeContext";
import QuotationPreview from "../../components/quotations/QuotationPreview";

const QuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // State management
  const [quotation, setQuotation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    recipientEmail: "",
    message: "",
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [business, setBusiness] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(null);

  // frontend/src/pages/quotations/QuotationDetail.jsx (continued)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch quotation details
        const quotationResponse = await quotationService.getQuotation(id);
        if (quotationResponse.success) {
          setQuotation(quotationResponse.data);
          // Pre-fill recipient email if customer email exists
          if (quotationResponse.data.customer.email) {
            setEmailData((prev) => ({
              ...prev,
              recipientEmail: quotationResponse.data.customer.email,
            }));
          }
        }

        // Fetch available templates
        const templatesResponse = await templateService.getTemplates();
        if (templatesResponse.success) {
          setTemplates(templatesResponse.data);

          // Set default template if exists
          const defaultTemplate = templatesResponse.data.find(
            (t) => t.isDefault
          );
          if (defaultTemplate) {
            setSelectedTemplate(defaultTemplate._id);
            setCurrentTemplate(defaultTemplate);
          }
        }

        // Fetch business info
        const businessResponse = await businessService.getSettings();
        if (businessResponse.success) {
          setBusiness(businessResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 404) {
          toast.error("Quotation not found");
          navigate("/quotations");
        } else {
          toast.error("Failed to fetch quotation details");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Update current template when selection changes
  useEffect(() => {
    if (selectedTemplate && templates.length > 0) {
      const template = templates.find((t) => t._id === selectedTemplate);
      setCurrentTemplate(template);
    }
  }, [selectedTemplate, templates]);

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await quotationService.updateStatus(id, newStatus);
      if (response.success) {
        setQuotation((prev) => ({ ...prev, status: newStatus }));
        toast.success("Status updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // In frontend/src/pages/quotations/QuotationDetail.jsx
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const toastId = toast.loading("Generating PDF...");

      // Generate PDF using the service
      const result = await quotationService.generatePDF(id, selectedTemplate);

      if (!result || !result.url) {
        throw new Error("PDF generation failed: Invalid response from server");
      }

      // Create and trigger download
      const link = document.createElement("a");
      link.href = result.url;
      link.download = `quotation-${quotation.quotationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup the URL after a short delay to ensure download starts
      setTimeout(() => {
        window.URL.revokeObjectURL(result.url);
      }, 2000);

      toast.dismiss(toastId);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF download error:", error);
      toast.dismiss();
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Failed to generate PDF"
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      setIsSendingEmail(true);
      const response = await quotationService.sendEmail(id, {
        templateId: selectedTemplate,
        ...emailData,
      });

      if (response.success) {
        toast.success("Email sent successfully");
        setShowEmailModal(false);
      }
    } catch (error) {
      console.error("Email sending error:", error);
      toast.error("Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await quotationService.duplicateQuotation(id);
      if (response.success) {
        toast.success("Quotation duplicated successfully");
        navigate(`/quotations/${response.data._id}`);
      }
    } catch (error) {
      toast.error("Failed to duplicate quotation");
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      sent: "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-300",
      accepted:
        "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-300",
      expired:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-300",
    };
    return classes[status] || classes.draft;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  // Email Modal Component
  const EmailModal = () => (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label
                  htmlFor="recipientEmail"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Recipient Email
                </label>
                <input
                  type="email"
                  id="recipientEmail"
                  value={emailData.recipientEmail}
                  onChange={(e) =>
                    setEmailData((prev) => ({
                      ...prev,
                      recipientEmail: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  value={emailData.message}
                  onChange={(e) =>
                    setEmailData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSendingEmail ? "Sending..." : "Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (isLoading || !quotation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-600 dark:text-gray-300">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 p-4">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quotation #{quotation.quotationNumber}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Created on {new Date(quotation.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-4 flex space-x-3 sm:mt-0">
            <select
              value={quotation.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={() => navigate(`/quotations/edit/${id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <PencilSquareIcon className="h-5 w-5 mr-2" />
              Edit
            </button>

            <button
              onClick={handleDuplicate}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Duplicate
            </button>

            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              {previewMode ? "Hide Preview" : "Show Preview"}
            </button>

            {templates.length > 0 && (
              <select
                value={selectedTemplate || ""}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Default Template</option>
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </button>

            <button
              onClick={() => setShowEmailModal(true)}
              disabled={isSendingEmail}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              {isSendingEmail ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>

        {/* Preview Mode */}
        {previewMode && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6 overflow-auto">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Quotation Preview
            </h2>
            <div className="border rounded p-4">
              <QuotationPreview
                quotation={quotation}
                template={currentTemplate}
                business={business}
              />
            </div>
          </div>
        )}

        {/* Customer Information and Summary */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Customer Information */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Customer Information
            </h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {quotation.customer.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {quotation.customer.email || "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {quotation.customer.phone || "N/A"}
                </dd>
              </div>
              {quotation.customer.address && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Address
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {quotation.customer.address.street && (
                      <div>{quotation.customer.address.street}</div>
                    )}
                    {quotation.customer.address.city && (
                      <div>{quotation.customer.address.city}</div>
                    )}
                    {quotation.customer.address.state && (
                      <div>{quotation.customer.address.state}</div>
                    )}
                    {quotation.customer.address.zipCode && (
                      <div>{quotation.customer.address.zipCode}</div>
                    )}
                    {quotation.customer.address.country && (
                      <div>{quotation.customer.address.country}</div>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Quotation Summary */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Quotation Summary
            </h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                      quotation.status
                    )}`}
                  >
                    {quotation.status.charAt(0).toUpperCase() +
                      quotation.status.slice(1)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Valid Until
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(quotation.validUntil).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Items
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tax
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {quotation.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {item.tax ? `${item.tax}%` : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    colSpan="4"
                    scope="row"
                    className="px-6 py-3 text-right text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Subtotal
                  </th>
                  <td className="px-6 py-3 text-right text-sm text-gray-900 dark:text-white">
                    {formatCurrency(quotation.subtotal)}
                  </td>
                </tr>
                <tr>
                  <th
                    colSpan="4"
                    scope="row"
                    className="px-6 py-3 text-right text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Tax
                  </th>
                  <td className="px-6 py-3 text-right text-sm text-gray-900 dark:text-white">
                    {formatCurrency(quotation.taxTotal)}
                  </td>
                </tr>
                <tr className="bg-gray-100 dark:bg-gray-600">
                  <th
                    colSpan="4"
                    scope="row"
                    className="px-6 py-3 text-right text-sm font-bold text-gray-900 dark:text-white"
                  >
                    Total
                  </th>
                  <td className="px-6 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(quotation.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes and Terms */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Notes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {quotation.notes || "No notes provided"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Terms & Conditions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {quotation.terms || "No terms provided"}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={() => navigate("/quotations")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            Back to List
          </button>

          {quotation.status === "draft" && (
            <button
              onClick={() => handleStatusChange("sent")}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Mark as Sent
            </button>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && <EmailModal />}
    </>
  );
};

export default QuotationDetail;
