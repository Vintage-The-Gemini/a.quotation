// backend/src/routes/business.routes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { protect } = require("../middlewares/auth.middleware");
const {
  getBusinessSettings,
  updateBusinessSettings,
  updateBusinessLogo,
  removeBusinessLogo,
  getBusinessLogo,
} = require("../controllers/business.controller");
const { uploadLogo } = require("../middlewares/upload.middleware");

// Protect all routes
router.use(protect);

// Business settings routes
router.get("/settings", getBusinessSettings);
router.put("/settings", updateBusinessSettings);

// Logo routes - separated for better handling
router.put("/settings/logo", uploadLogo, updateBusinessLogo);
router.delete("/settings/logo", removeBusinessLogo);
router.get("/logo", getBusinessLogo);

// Add a debug endpoint to get business and logo info
router.get("/debug-logo-info", async (req, res) => {
  try {
    const Business = require("../models/Business"); // Import here to avoid circular dependencies
    const business = await Business.findById(req.user.businessId);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Get the uploads directory information
    const uploadsDir = path.join(process.cwd(), "uploads");
    const logosDir = path.join(uploadsDir, "logos");

    // List files in the logos directory
    let logoFiles = [];
    try {
      if (fs.existsSync(logosDir)) {
        logoFiles = fs.readdirSync(logosDir);
      }
    } catch (error) {
      console.error("Error reading logos directory:", error);
    }

    // Return debugging info
    res.json({
      success: true,
      businessId: business._id,
      hasLogo: !!business.logo,
      logoDetails: business.logo || null,
      directoryInfo: {
        cwd: process.cwd(),
        uploadsExists: fs.existsSync(uploadsDir),
        logosExists: fs.existsSync(logosDir),
        logoFiles: logoFiles,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting logo debug info",
      error: error.message,
    });
  }
});

// Test route to directly serve a logo file by name (for debugging)
router.get("/test-logo/:filename", (req, res) => {
  try {
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "logos",
      req.params.filename
    );
    console.log("Testing logo access at:", filePath);

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    } else {
      return res.status(404).json({
        success: false,
        message: "Logo file not found",
        requestedPath: filePath,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error when accessing logo",
      error: error.message,
    });
  }
});

// Unauthenticated route to serve the default logo
router.get("/default-logo", (req, res) => {
  const defaultLogoPath = path.join(
    process.cwd(),
    "uploads",
    "logos",
    "default-logo.svg"
  );

  if (fs.existsSync(defaultLogoPath)) {
    res.sendFile(defaultLogoPath);
  } else {
    // If default logo doesn't exist, generate one on the fly
    const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
      <rect width="150" height="150" fill="#f0f0f0"/>
      <circle cx="75" cy="75" r="60" fill="#3b82f6"/>
      <text x="75" y="85" font-family="Arial" font-size="24" text-anchor="middle" fill="#ffffff">LOGO</text>
    </svg>`;

    res.set("Content-Type", "image/svg+xml");
    res.send(svgLogo);
  }
});

module.exports = router;
