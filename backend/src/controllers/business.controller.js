// backend/src/controllers/business.controller.js
const Business = require("../models/Business");
const { uploadLogo } = require("../middlewares/upload.middleware");
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
    // Process the upload
    uploadLogo(req, res, async function (err) {
      if (err) {
        // Error already handled by middleware
        return;
      }

      try {
        // Parse business data
        let businessData;
        if (req.body.data) {
          businessData = JSON.parse(req.body.data);
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
            await storageService.deleteFile(business.logo);
          }

          // Save new logo
          logoData = await storageService.saveFile(req.file, "logos");
        }

        // Update business with new data
        const updatedBusiness = await Business.findByIdAndUpdate(
          req.user.businessId,
          {
            ...businessData,
            logo: req.file ? logoData : business.logo,
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
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      success: false,
      message: "Error processing request",
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
    res.sendFile(logoPath);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching logo",
      error: error.message,
    });
  }
};
