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

// Update business settings
exports.updateBusinessSettings = async (req, res) => {
  try {
    // Parse business data
    let businessData;
    if (req.body.data) {
      try {
        businessData = JSON.parse(req.body.data);
      } catch (parseError) {
        console.error("Error parsing JSON data:", parseError);
        return res.status(400).json({
          success: false,
          message: "Invalid JSON data format",
          error: parseError.message,
        });
      }
    } else {
      businessData = req.body;
    }

    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Handle logo upload
    let logoData = business.logo;
    if (req.file) {
      // Delete old logo if exists
      if (business.logo && business.logo.url) {
        try {
          await storageService.deleteFile(business.logo);
        } catch (deleteError) {
          console.error("Error deleting old logo:", deleteError);
          // Continue anyway - don't fail the update just because of old logo deletion
        }
      }

      // Save new logo
      try {
        logoData = await storageService.saveFile(req.file, "logos");
        console.log("New logo saved:", logoData);
      } catch (saveError) {
        console.error("Error saving new logo:", saveError);
        return res.status(500).json({
          success: false,
          message: "Error saving logo file",
          error: saveError.message,
        });
      }
    } else if (req.body.removeLogo === "true") {
      // Remove logo if requested
      if (business.logo && business.logo.url) {
        try {
          await storageService.deleteFile(business.logo);
        } catch (deleteError) {
          console.error("Error deleting logo on remove:", deleteError);
        }
      }
      logoData = null;
    }

    // Update business with new data
    const updatedBusiness = await Business.findByIdAndUpdate(
      req.user.businessId,
      {
        ...businessData,
        logo: logoData,
      },
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
