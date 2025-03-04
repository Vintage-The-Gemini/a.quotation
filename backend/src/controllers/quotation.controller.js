// backend/src/controllers/quotation.controller.js
const PDFDocument = require("pdfkit");
const Quotation = require("../models/Quotation");
const Template = require("../models/Template");
const Business = require("../models/Business");
const fs = require("fs");
const path = require("path");
const pdfService = require("../services/pdf.service");

const quotationController = {
  // Create new quotation
  createQuotation: async (req, res) => {
    try {
      const newQuotation = await Quotation.create({
        ...req.body,
        business: req.user.businessId,
        createdBy: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: newQuotation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get all quotations
  getQuotations: async (req, res) => {
    try {
      const quotations = await Quotation.find({ business: req.user.businessId })
        .populate("items.item")
        .sort("-createdAt");

      res.json({
        success: true,
        data: quotations,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get single quotation
  getQuotation: async (req, res) => {
    try {
      const quotation = await Quotation.findOne({
        _id: req.params.id,
        business: req.user.businessId,
      }).populate("items.item");

      if (!quotation) {
        return res.status(404).json({
          success: false,
          message: "Quotation not found",
        });
      }

      res.json({
        success: true,
        data: quotation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update quotation
  updateQuotation: async (req, res) => {
    try {
      const quotation = await Quotation.findOneAndUpdate(
        {
          _id: req.params.id,
          business: req.user.businessId,
        },
        req.body,
        { new: true, runValidators: true }
      ).populate("items.item");

      if (!quotation) {
        return res.status(404).json({
          success: false,
          message: "Quotation not found",
        });
      }

      res.json({
        success: true,
        data: quotation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update quotation status
  updateQuotationStatus: async (req, res) => {
    try {
      const { status } = req.body;

      const quotation = await Quotation.findOneAndUpdate(
        {
          _id: req.params.id,
          business: req.user.businessId,
        },
        {
          status,
          $push: {
            statusHistory: {
              status,
              date: new Date(),
              updatedBy: req.user.id,
            },
          },
        },
        { new: true }
      ).populate("items.item");

      if (!quotation) {
        return res.status(404).json({
          success: false,
          message: "Quotation not found",
        });
      }

      res.json({
        success: true,
        data: quotation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  generatePDF: async (req, res) => {
    try {
      const { templateId } = req.body;

      // Fetch necessary data
      const [quotation, business] = await Promise.all([
        Quotation.findOne({
          _id: req.params.id,
          business: req.user.businessId,
        }).populate("items.item"),
        Business.findById(req.user.businessId),
      ]);

      if (!quotation) {
        return res.status(404).json({
          success: false,
          message: "Quotation not found",
        });
      }

      // Fetch template if specified
      let template = null;
      if (templateId) {
        template = await Template.findOne({
          _id: templateId,
          businessId: req.user.businessId,
        });
      }

      // If no specific template found, try to get the default
      if (!template) {
        template = await Template.findOne({
          businessId: req.user.businessId,
          isDefault: true,
          type: "quotation",
        });
      }

      // Generate the PDF using the service
      const pdfPath = await pdfService.generateQuotationPDF(
        quotation,
        template,
        business
      );

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      // backend/src/controllers/quotation.controller.js (update the generatePDF method continued)

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="quotation-${quotation.quotationNumber}.pdf"`
      );

      // Stream the file to response
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);

      // Clean up after sending
      fileStream.on("end", async () => {
        try {
          await fs.unlink(pdfPath);
        } catch (err) {
          console.error("Error cleaning up temporary file:", err);
        }
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate PDF",
        error: error.message,
      });
    }
  },

  // Send email
  sendEmail: async (req, res) => {
    try {
      const quotation = await Quotation.findOne({
        _id: req.params.id,
        business: req.user.businessId,
      });

      if (!quotation) {
        return res.status(404).json({
          success: false,
          message: "Quotation not found",
        });
      }

      // Add email sending logic here...

      res.json({
        success: true,
        message: "Email sent successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Delete quotation
  deleteQuotation: async (req, res) => {
    try {
      const quotation = await Quotation.findOneAndDelete({
        _id: req.params.id,
        business: req.user.businessId,
      });

      if (!quotation) {
        return res.status(404).json({
          success: false,
          message: "Quotation not found",
        });
      }

      res.json({
        success: true,
        data: {},
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Duplicate quotation
  duplicateQuotation: async (req, res) => {
    try {
      const quotation = await Quotation.findOne({
        _id: req.params.id,
        business: req.user.businessId,
      });

      if (!quotation) {
        return res.status(404).json({
          success: false,
          message: "Quotation not found",
        });
      }

      // Create new quotation object without _id and with new quotation number
      const newQuotationData = quotation.toObject();
      delete newQuotationData._id;
      delete newQuotationData.quotationNumber;

      const newQuotation = await Quotation.create({
        ...newQuotationData,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.json({
        success: true,
        data: newQuotation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = quotationController;
