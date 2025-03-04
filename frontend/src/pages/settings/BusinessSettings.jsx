// frontend/src/pages/settings/BusinessSettings.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import LogoUploader from "../../components/settings/LogoUploader";

const BusinessSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logo, setLogo] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    settings: {
      theme: "modern",
      quotationPrefix: "QT",
      currency: "KES",
    },
  });

  useEffect(() => {
    fetchBusinessDetails();
  }, []);

  const fetchBusinessDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/business/settings");
      if (response.data.success) {
        const business = response.data.data;
        setFormData(business);
        // Handle logo data in the state
        if (business.logo) {
          setLogo(business.logo);
        }
      } else {
        toast.error(
          response.data.message || "Failed to fetch business details"
        );
      }
    } catch (error) {
      console.error("Error fetching business details:", error);
      toast.error("Failed to fetch business details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (newLogo) => {
    setLogo(newLogo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = new FormData();

      // Add logo if it's a file
      if (logo instanceof File) {
        submitData.append("logo", logo);
      } else if (logo === null) {
        // If logo is explicitly set to null, we want to remove it
        submitData.append("removeLogo", "true");
      }

      // Add the rest of the form data
      submitData.append("data", JSON.stringify(formData));

      const response = await api.put("/business/settings", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("Business settings updated successfully");
        // Refresh data to get updated logo URLs
        fetchBusinessDetails();
      } else {
        throw new Error(response.data.message || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating business settings:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update settings"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Business Settings
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Update your business information and branding
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload Section - This is where the logo uploader should appear */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Business Logo
          </label>
          <LogoUploader currentLogo={logo} onChange={handleLogoChange} />
        </div>

        {/* Business Information */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Business Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                       dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 
                       focus:ring-blue-500 sm:text-sm transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                       dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 
                       focus:ring-blue-500 sm:text-sm transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                       dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 
                       focus:ring-blue-500 sm:text-sm transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Currency
            </label>
            <select
              value={formData.settings?.currency || "KES"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, currency: e.target.value },
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                       dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 
                       focus:ring-blue-500 sm:text-sm transition-colors"
            >
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Business Address
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address?.street || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                         dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 
                         focus:ring-blue-500 sm:text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                City
              </label>
              <input
                type="text"
                value={formData.address?.city || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                         dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 
                         focus:ring-blue-500 sm:text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                State/Province
              </label>
              <input
                type="text"
                value={formData.address?.state || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                         dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 
                         focus:ring-blue-500 sm:text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                ZIP/Postal Code
              </label>
              <input
                type="text"
                value={formData.address?.zipCode || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, zipCode: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                         dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 
                         focus:ring-blue-500 sm:text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Country
              </label>
              <input
                type="text"
                value={formData.address?.country || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, country: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 
                         dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 
                         focus:ring-blue-500 sm:text-sm transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent 
                     shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettings;
