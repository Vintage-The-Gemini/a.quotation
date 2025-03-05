// frontend/src/pages/settings/BusinessSettings.jsx
import React, { useState, useEffect } from "react";
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
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (newLogo) => {
    setLogo(newLogo);
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
      toast.error("Failed to update business settings");
      console.error(error);
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
              className="w-full p-2 border rounded-md"
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
              className="w-full p-2 border rounded-md"
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
              className="w-full p-2 border rounded-md"
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
              className="w-full p-2 border rounded-md"
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
                className="w-full p-2 border rounded-md"
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
                className="w-full p-2 border rounded-md"
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
                className="w-full p-2 border rounded-md"
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
                className="w-full p-2 border rounded-md"
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
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettings;
