// frontend/src/pages/settings/BusinessSettings.jsx
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import LogoUploader from "../../components/settings/LogoUploader";

const BusinessSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      currency: "KES",
      quotationPrefix: "QT",
    },
  });

  useEffect(() => {
    fetchBusinessData();
  }, []);

  // If no logo is loaded after data fetch, create a default one
  useEffect(() => {
    if (!logo && !isLoading) {
      console.log("No logo found, creating a default one for display");

      // Create a default SVG logo as a data URL
      const svgLogo = `
        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
          <rect width="150" height="150" fill="#f0f0f0"/>
          <circle cx="75" cy="75" r="60" fill="#3b82f6"/>
          <text x="75" y="85" font-family="Arial" font-size="24" text-anchor="middle" fill="white">LOGO</text>
        </svg>
      `;

      // Create a dummy logo object that points to the default logo
      setLogo({
        url: "/uploads/logos/default-logo.svg",
        isCloudinary: false,
      });
    }
  }, [logo, isLoading]);

  const fetchBusinessData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/business/settings");

      if (response.data.success) {
        const business = response.data.data;
        // Initialize form with business data
        setFormData({
          name: business.name || "",
          email: business.email || "",
          phone: business.phone || "",
          address: business.address || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
          settings: business.settings || {
            currency: "KES",
            quotationPrefix: "QT",
          },
        });

        // Set logo if exists
        if (business.logo) {
          setLogo(business.logo);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch business settings");
      console.error("Error fetching business data:", error);

      // Set default data if fetch fails
      setFormData({
        name: "Your Business",
        email: "example@business.com",
        phone: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        settings: {
          currency: "KES",
          quotationPrefix: "QT",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (newLogo) => {
    setLogo(newLogo);
  };

  // Generate a random colored logo
  const generateQuickLogo = () => {
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const svgLogo = `
      <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
        <rect width="150" height="150" fill="#f0f0f0"/>
        <circle cx="75" cy="75" r="60" fill="${randomColor}"/>
        <text x="75" y="85" font-family="Arial" font-size="24" text-anchor="middle" fill="white">LOGO</text>
      </svg>
    `;

    // Convert SVG to Blob
    const blob = new Blob([svgLogo], { type: "image/svg+xml" });

    // Create a File object from the Blob
    const file = new File([blob], `logo-${Date.now()}.svg`, {
      type: "image/svg+xml",
    });

    setLogo(file);
    toast.success("Generated new logo! Click Save Changes to upload it.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // First update business info
      const response = await api.put("/business/settings", formData);

      if (response.data.success) {
        // Handle logo separately if it's a file
        if (logo instanceof File) {
          const logoForm = new FormData();
          logoForm.append("logo", logo);

          await api.put("/business/settings/logo", logoForm, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else if (logo === null) {
          // User wants to remove the logo
          await api.delete("/business/settings/logo");
        }

        toast.success("Business settings updated successfully");
        fetchBusinessData(); // Refresh data
      }
    } catch (error) {
      console.error("Error saving business settings:", error);
      toast.error(
        error.response?.data?.message || "Failed to update business settings"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Business Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Business Logo
          </label>
          <LogoUploader currentLogo={logo} onChange={handleLogoChange} />

          {/* Add the quick logo generation button */}
          <button
            type="button"
            onClick={generateQuickLogo}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Generate Demo Logo
          </button>
          <p className="mt-1 text-sm text-gray-500">
            Click to create a sample logo for testing
          </p>
        </div>

        {/* Business Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select
              value={formData.settings.currency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, currency: e.target.value },
                })
              }
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>
        </div>

        {/* Address Fields */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <label className="block text-sm font-medium mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })
                }
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                State/Province
              </label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value },
                  })
                }
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                ZIP/Postal Code
              </label>
              <input
                type="text"
                value={formData.address.zipCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, zipCode: e.target.value },
                  })
                }
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <input
                type="text"
                value={formData.address.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, country: e.target.value },
                  })
                }
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettings;
