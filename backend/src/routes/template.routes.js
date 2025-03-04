// backend/src/routes/template.routes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const templateController = require("../controllers/template.controller");

// Apply protection middleware
router.use(protect);

// Routes
router
  .route("/")
  .get(templateController.getTemplates)
  .post(templateController.createTemplate);

router
  .route("/:id")
  .get(templateController.getTemplate)
  .put(templateController.updateTemplate)
  .delete(templateController.deleteTemplate);

// Set default template route
router.route("/:id/default").put(templateController.setDefaultTemplate);

module.exports = router;
