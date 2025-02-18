const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const quotationController = require("../controllers/quotation.controller");

// Apply authentication middleware
router.use(protect);

// CRUD routes
router
  .route("/")
  .get(quotationController.getQuotations)
  .post(quotationController.createQuotation);

router
  .route("/:id")
  .get(quotationController.getQuotation)
  .put(quotationController.updateQuotation)
  .delete(quotationController.deleteQuotation);

// Status update route
router.route("/:id/status").put(quotationController.updateQuotationStatus);

// PDF generation route
router.route("/:id/pdf").post(quotationController.generatePDF);

// Email route
router.route("/:id/email").post(quotationController.sendEmail);

// Duplicate route
router.route("/:id/duplicate").post(quotationController.duplicateQuotation);

module.exports = router;
