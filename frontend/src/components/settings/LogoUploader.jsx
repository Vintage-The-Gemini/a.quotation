// frontend/src/components/settings/LogoUploader.jsx
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";

// Configure backend URL - adjust port to match your backend server
const BACKEND_URL = "/api";

const LogoUploader = ({ currentLogo, onChange }) => {
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const fileInputRef = useRef(null);

  // Generate a fallback SVG logo
  const getFallbackLogo = () => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f0f0f0'/%3E%3Ccircle cx='75' cy='75' r='60' fill='%233b82f6'/%3E%3Ctext x='75' y='85' font-family='Arial' font-size='24' text-anchor='middle' fill='white'%3ELOGO%3C/text%3E%3C/svg%3E`;
  };

  // Debug helper function
  const logLogoInfo = (logo, message) => {
    console.log(
      `LogoUploader - ${message}:`,
      typeof logo === "object" ? JSON.stringify(logo, null, 2) : logo
    );
  };

  // Helper function to normalize paths (convert backslashes to forward slashes)
  const normalizePath = (path) => {
    if (!path) return path;
    return path.replace(/\\/g, "/");
  };

  // Helper to extract filename from a path
  const getFilenameFromPath = (path) => {
    if (!path) return "";
    const normalized = normalizePath(path);
    const parts = normalized.split("/");
    return parts[parts.length - 1];
  };

  // Test the direct access to the file
  const testDirectAccess = async (filename) => {
    if (!filename) return;

    try {
      // Try to access the file directly through the uploads directory
      const response = await fetch(
        `/uploads/logos/${filename}?t=${Date.now()}`
      );

      if (response.ok) {
        setDebugInfo({
          directAccessUrl: `/uploads/logos/${filename}`,
          status: "success",
          timestamp: new Date().toISOString(),
        });
        return true;
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Direct access test failed:", error);
      setDebugInfo({
        error: error.message,
        status: "failed",
        timestamp: new Date().toISOString(),
      });
      return false;
    }
  };

  useEffect(() => {
    // Clean up previous blob URL if it exists
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      if (debugInfo?.directAccessUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(debugInfo.directAccessUrl);
      }
    };
  }, []);

  useEffect(() => {
    // Initialize preview URL from props
    setIsLoadingImage(true);
    setImageError(false);

    if (!currentLogo) {
      logLogoInfo(currentLogo, "No logo provided");
      setPreviewUrl(getFallbackLogo()); // Use fallback logo
      setIsLoadingImage(false);
      return;
    }

    logLogoInfo(currentLogo, "Current logo");

    // Handle new file uploads (already as File objects)
    if (currentLogo instanceof File) {
      const objectUrl = URL.createObjectURL(currentLogo);
      setPreviewUrl(objectUrl);
      setIsLoadingImage(false);
      return;
    }

    // Handle object with URL property (from database)
    if (typeof currentLogo === "object" && currentLogo.url) {
      let logoUrl;
      let filename = "";

      // For Cloudinary URLs
      if (currentLogo.isCloudinary) {
        logoUrl = currentLogo.url;
      }
      // For data URLs (generated logos)
      else if (currentLogo.isDataUrl) {
        logoUrl = currentLogo.url;
      }
      // For relative URLs (local storage)
      else {
        // Get the filename regardless of path format
        filename = getFilenameFromPath(currentLogo.url);

        // Directly use the static file path - bypassing API authentication
        logoUrl = `/uploads/logos/${filename}?t=${Date.now()}`; // Add cache busting
      }

      logLogoInfo(logoUrl, "Logo URL calculated");

      // Test direct access if we have a filename and it's not a data URL
      if (filename && !currentLogo.isDataUrl) {
        testDirectAccess(filename);
      }

      setPreviewUrl(logoUrl);
    }
    // Handle legacy string format (just filename)
    else if (typeof currentLogo === "string") {
      // Get the filename regardless of path format
      const filename = getFilenameFromPath(currentLogo);

      // Directly use the static file path
      const logoUrl = `/uploads/logos/${filename}?t=${Date.now()}`;

      logLogoInfo(logoUrl, "Logo URL from string");

      // Test direct access
      testDirectAccess(filename);

      setPreviewUrl(logoUrl);
    } else {
      logLogoInfo(currentLogo, "Unrecognized logo format");
      setPreviewUrl(getFallbackLogo()); // Use fallback logo
      setIsLoadingImage(false);
    }
  }, [currentLogo]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be less than 2MB");
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);

    // Clean up previous blob URL if it exists
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(objectUrl);
    setImageError(false);
    onChange(file);
  };

  const handleRemoveLogo = (e) => {
    e.preventDefault();

    // Clean up the blob URL if it exists
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(getFallbackLogo()); // Use fallback logo
    setImageError(false);
    onChange(null);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    toast.success("Logo removed. Click Save Changes to confirm.");
  };

  const handleImageError = () => {
    console.log("Logo failed to load:", previewUrl);
    setImageError(true);
    setIsLoadingImage(false);

    // If the image fails to load, use the fallback
    if (previewUrl !== getFallbackLogo()) {
      setPreviewUrl(getFallbackLogo());
    }
  };

  const handleImageLoad = () => {
    console.log("Logo loaded successfully:", previewUrl);
    setIsLoadingImage(false);
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

    // Clean up previous blob URL if it exists
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(blob);
    setPreviewUrl(objectUrl);
    setImageError(false);
    onChange(file);

    toast.success("Generated new logo! Click Save Changes to upload it.");
  };

  return (
    <div className="mt-1 flex items-center space-x-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden relative bg-white dark:bg-gray-700">
          {previewUrl && !imageError ? (
            <img
              src={previewUrl}
              alt="Business logo"
              className="w-full h-full object-contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: isLoadingImage ? "none" : "block" }}
            />
          ) : null}

          {!previewUrl || isLoadingImage || imageError ? (
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
                {isLoadingImage
                  ? "Loading logo..."
                  : imageError
                  ? "Logo failed to load"
                  : "Upload logo"}
              </p>
            </div>
          ) : null}
        </div>

        {/* Debug display for direct access test */}
        {debugInfo &&
          debugInfo.directAccessUrl &&
          !debugInfo.directAccessUrl.startsWith("blob:") && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">
                Direct file access test:
              </p>
              <img
                src={debugInfo.directAccessUrl}
                alt="Debug direct access"
                className="w-16 h-16 object-contain border border-gray-300"
              />
            </div>
          )}
      </div>

      <div className="flex flex-col">
        <label className="block">
          <span className="sr-only">Choose logo</span>
          <input
            type="file"
            ref={fileInputRef}
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

        <div className="flex flex-col mt-2 space-y-2">
          <button
            type="button"
            onClick={generateQuickLogo}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Generate Test Logo
          </button>

          <button
            type="button"
            onClick={handleRemoveLogo}
            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove Logo
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoUploader;
