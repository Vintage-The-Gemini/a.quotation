// backend/src/routes/business.routes.js
const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const {
  getBusinessSettings,
  updateBusinessSettings,
  updateBusinessLogo,
  removeBusinessLogo,
  getBusinessLogo,
} = require("../controllers/business.controller");
const { uploadLogo } = require("../middlewares/upload.middleware");

const router = express.Router();

// Protect all routes
router.use(protect);

// Business settings routes
router.get("/settings", getBusinessSettings);
router.put("/settings", updateBusinessSettings);

// Logo routes - separated for better handling
router.put("/settings/logo", uploadLogo, updateBusinessLogo);
router.delete("/settings/logo", removeBusinessLogo);
router.get("/logo", getBusinessLogo);

module.exports = router;
