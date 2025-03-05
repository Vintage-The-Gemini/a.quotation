// backend/src/controllers/business.controller.js
const Business = require("../models/Business");
const storageService = require("../services/storage.service");
const path = require("path");
const fs = require("fs").promises;

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

    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
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

// Update logo - implemented in routes file as a separate endpoint

// Get business logo
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

    // Otherwise serve from local filesystem
    const logoPath = path.join(process.cwd(), business.logo.url);

    try {
      // Check if file exists
      await fs.access(logoPath);
      res.sendFile(logoPath);
    } catch (fileError) {
      console.error("Error accessing logo file:", fileError);
      return res.status(404).json({
        success: false,
        message: "Logo file not found on server",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching logo",
      error: error.message,
    });
  }
};
