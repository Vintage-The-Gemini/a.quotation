// backend/src/controllers/template.controller.js
const Template = require("../models/Template");

// @desc    Create template
// @route   POST /api/templates
// @access  Private
exports.createTemplate = async (req, res) => {
  try {
    const template = await Template.create({
      ...req.body,
      businessId: req.user.businessId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all templates
// @route   GET /api/templates
// @access  Private
exports.getTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ businessId: req.user.businessId });

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single template
// @route   GET /api/templates/:id
// @access  Private
exports.getTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private
exports.updateTemplate = async (req, res) => {
  try {
    let template = await Template.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    template = await Template.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    await template.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Set template as default
// @route   PUT /api/templates/:id/default
// @access  Private
exports.setDefaultTemplate = async (req, res) => {
  try {
    // Find the template to make default
    const template = await Template.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // First, unset all other templates as default
    await Template.updateMany(
      {
        businessId: req.user.businessId,
        type: template.type,
        _id: { $ne: template._id },
      },
      { isDefault: false }
    );

    // Then set this one as default
    template.isDefault = true;
    await template.save();

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
