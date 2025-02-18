// routes/business.routes.js
const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const {
  getBusinessSettings,
  updateBusinessSettings,
  getBusinessLogo,
} = require("../controllers/business.controller");

const router = express.Router();

// Protect all routes
router.use(protect);

// Business settings routes
router.get("/settings", getBusinessSettings);
router.put("/settings", updateBusinessSettings);
router.get("/logo", getBusinessLogo);

module.exports = router;
