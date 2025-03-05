// backend/src/routes/business.routes.js
const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const {
  getBusinessSettings,
  updateBusinessSettings,
  getBusinessLogo,
} = require("../controllers/business.controller");
const { uploadLogo } = require("../middlewares/upload.middleware");
const Business = require("../models/Business");
const storageService = require("../services/storage.service");

const router = express.Router();

// Protect all routes
router.use(protect);

// Business settings routes
router.get("/settings", getBusinessSettings);

// Route for updating business information
router.put("/settings", protect, updateBusinessSettings);

// Dedicated route for logo updates
router.put("/settings/logo", uploadLogo, async (req, res) => {
  try {
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
        await storageService.deleteFile(business.logo);
      } catch (error) {
        console.error("Error deleting old logo:", error);
      }
    }

    // Save new logo
    const logoData = await storageService.saveFile(req.file, "logos");
    console.log("New logo saved:", logoData);

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
});

// Route for removing logo
router.delete("/settings/logo", protect, async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Delete logo if exists
    if (business.logo && business.logo.url) {
      try {
        await storageService.deleteFile(business.logo);
      } catch (error) {
        console.error("Error deleting logo:", error);
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
});

// Get logo route
router.get("/logo", getBusinessLogo);

module.exports = router;
