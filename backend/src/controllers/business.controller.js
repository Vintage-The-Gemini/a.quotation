// backend/src/controllers/business.controller.js
const Business = require("../models/Business");
const path = require("path");
const fs = require("fs");

// Helper function to normalize paths
const normalizePath = (pathStr) => {
  if (!pathStr) return pathStr;
  return pathStr.replace(/\\/g, "/");
};

// Get business settings
exports.getBusinessSettings = async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Log the logo URL for debugging
    if (business.logo && business.logo.url) {
      console.log("Business has logo URL:", business.logo.url);

      // Fix logo URL format - normalize path and ensure it starts with /
      business.logo.url = normalizePath(business.logo.url);

      if (
        !business.logo.url.startsWith("/") &&
        !business.logo.url.startsWith("http")
      ) {
        business.logo.url = "/" + business.logo.url;
      }

      console.log("Normalized logo URL for frontend:", business.logo.url);
    } else {
      console.log("Business has no logo");
    }

    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
    console.error("Error fetching business settings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching business settings",
      error: error.message,
    });
  }
};

// Update business settings (basic information only, no file handling)
exports.updateBusinessSettings = async (req, res) => {
  try {
    console.log("Updating business settings with data:", req.body);

    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Ensure we're not overwriting the logo
    const { logo, ...businessData } = req.body;

    // Make sure required fields are present
    if (!businessData.name) {
      return res.status(400).json({
        success: false,
        message: "Business name is required",
      });
    }

    // Make sure settings object exists
    if (!businessData.settings) {
      businessData.settings = business.settings || {};
    }

    // Make sure address object exists
    if (!businessData.address) {
      businessData.address = business.address || {};
    }

    // Update business with new data (excluding logo)
    const updatedBusiness = await Business.findByIdAndUpdate(
      req.user.businessId,
      businessData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedBusiness,
    });
  } catch (error) {
    console.error("Error updating business:", error);
    res.status(500).json({
      success: false,
      message: "Error updating business settings",
      error: error.message,
    });
  }
};

// Simple file-based logo handling
exports.updateBusinessLogo = async (req, res) => {
  try {
    console.log("Logo update request received:", req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No logo file provided",
      });
    }

    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Delete old logo if exists
    if (business.logo && business.logo.url) {
      try {
        // Extract filename from the path
        let logoPath;
        const normalizedUrl = normalizePath(business.logo.url);

        if (normalizedUrl.startsWith("/")) {
          // URL format like /uploads/logos/file.jpg
          logoPath = path.join(process.cwd(), normalizedUrl.substring(1));
        } else if (normalizedUrl.includes("/")) {
          // URL format like uploads/logos/file.jpg
          logoPath = path.join(process.cwd(), normalizedUrl);
        } else {
          // Just filename like file.jpg
          logoPath = path.join(
            process.cwd(),
            "uploads",
            "logos",
            normalizedUrl
          );
        }

        console.log("Attempting to delete old logo at:", logoPath);

        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
          console.log(`Deleted old logo: ${logoPath}`);
        } else {
          console.log(`Logo file not found at ${logoPath}, skipping deletion`);
        }
      } catch (error) {
        console.error("Error deleting old logo:", error);
        // Continue anyway
      }
    }

    // Ensure path uses forward slashes for storage in database
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    const normalizedLogoUrl = normalizePath(logoUrl);

    const logoData = {
      url: normalizedLogoUrl,
      filename: req.file.filename,
      isCloudinary: false,
    };

    console.log("New logo data:", logoData);
    console.log(
      "File accessible at:",
      path.join(process.cwd(), normalizedLogoUrl.substring(1))
    );

    // Update business with new logo
    const updatedBusiness = await Business.findByIdAndUpdate(
      req.user.businessId,
      { logo: logoData },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedBusiness,
    });
  } catch (error) {
    console.error("Error updating logo:", error);
    res.status(500).json({
      success: false,
      message: "Error updating logo",
      error: error.message,
    });
  }
};

// Handle logo removal
exports.removeBusinessLogo = async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Delete logo file if exists
    if (business.logo && business.logo.url) {
      try {
        let logoPath;
        const normalizedUrl = normalizePath(business.logo.url);

        if (normalizedUrl.startsWith("/")) {
          // URL format like /uploads/logos/file.jpg
          logoPath = path.join(process.cwd(), normalizedUrl.substring(1));
        } else if (normalizedUrl.includes("/")) {
          // URL format like uploads/logos/file.jpg
          logoPath = path.join(process.cwd(), normalizedUrl);
        } else {
          // Just filename like file.jpg
          logoPath = path.join(
            process.cwd(),
            "uploads",
            "logos",
            normalizedUrl
          );
        }

        console.log("Attempting to delete logo at:", logoPath);

        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
          console.log(`Deleted logo file: ${logoPath}`);
        } else {
          console.log(`Logo file not found at ${logoPath}, skipping deletion`);
        }
      } catch (error) {
        console.error("Error deleting logo file:", error);
        // Continue anyway
      }
    }

    // Update business to remove logo
    const updatedBusiness = await Business.findByIdAndUpdate(
      req.user.businessId,
      { $unset: { logo: 1 } },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedBusiness,
    });
  } catch (error) {
    console.error("Error removing logo:", error);
    res.status(500).json({
      success: false,
      message: "Error removing logo",
      error: error.message,
    });
  }
};

// Get business logo - direct file serving
exports.getBusinessLogo = async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId);

    if (!business || !business.logo || !business.logo.url) {
      return res.status(404).json({
        success: false,
        message: "Logo not found",
      });
    }

    // If using Cloudinary, redirect to the URL
    if (business.logo.isCloudinary) {
      return res.redirect(business.logo.url);
    }

    // For local file serving
    let logoPath;
    const normalizedUrl = normalizePath(business.logo.url);

    if (normalizedUrl.startsWith("/")) {
      // URL format like /uploads/logos/file.jpg
      logoPath = path.join(process.cwd(), normalizedUrl.substring(1));
    } else if (normalizedUrl.includes("/")) {
      // URL format like uploads/logos/file.jpg
      logoPath = path.join(process.cwd(), normalizedUrl);
    } else {
      // Just filename like file.jpg
      logoPath = path.join(process.cwd(), "uploads", "logos", normalizedUrl);
    }

    console.log("Attempting to serve logo from:", logoPath);

    try {
      // Check if file exists
      if (!fs.existsSync(logoPath)) {
        console.error("Logo file not found at:", logoPath);
        return res.status(404).json({
          success: false,
          message: "Logo file not found on server",
        });
      }

      console.log("Logo file exists, sending...");
      res.sendFile(logoPath);
    } catch (fileError) {
      console.error("Error accessing logo file:", fileError);
      return res.status(404).json({
        success: false,
        message: "Logo file not found on server",
        error: fileError.message,
      });
    }
  } catch (error) {
    console.error("Error fetching logo:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching logo",
      error: error.message,
    });
  }
};
