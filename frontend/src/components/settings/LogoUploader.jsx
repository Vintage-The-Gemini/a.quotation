// frontend/src/components/settings/LogoUploader.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

const LogoUploader = ({ currentLogo, onChange }) => {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    // Initialize preview URL from props
    if (currentLogo && typeof currentLogo === "object" && currentLogo.url) {
      setPreviewUrl(currentLogo.url);
    } else if (currentLogo && typeof currentLogo === "string") {
      // For backward compatibility
      setPreviewUrl(`/uploads/logos/${currentLogo}`);
    } else {
      setPreviewUrl("");
    }
  }, [currentLogo]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo must be less than 2MB");
        return;
      }

      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/svg+xml",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Only JPG, PNG, and SVG files are allowed");
        return;
      }

      // Create preview and notify parent
      setPreviewUrl(URL.createObjectURL(file));
      onChange(file);
    }
  };

  const handleRemoveLogo = (e) => {
    e.preventDefault();
    setPreviewUrl("");
    onChange(null);
    toast.success("Logo removed. Click Save Changes to confirm.");
  };

  return (
    <div className="mt-1 flex items-center space-x-4">
      <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden relative bg-white dark:bg-gray-700">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Business logo"
            className="w-full h-full object-contain"
            onError={(e) => {
              console.error("Error loading logo image");
              e.target.src =
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWYiIGZpbGw9IiM5OTkiPkxvZ288L3RleHQ+PC9zdmc+";
            }}
          />
        ) : (
          <div className="text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Upload logo
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <label className="block">
          <span className="sr-only">Choose logo</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/svg+xml"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-blue-50 file:text-blue-700
                dark:file:bg-blue-900 dark:file:text-blue-200
                hover:file:bg-blue-100 dark:hover:file:bg-blue-800
                transition-colors"
          />
        </label>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          PNG, JPG, or SVG (max 2MB)
        </p>

        {previewUrl && (
          <button
            type="button"
            onClick={handleRemoveLogo}
            className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove logo
          </button>
        )}
      </div>
    </div>
  );
};

export default LogoUploader;
