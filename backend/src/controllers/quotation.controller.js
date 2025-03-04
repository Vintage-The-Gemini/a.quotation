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

  // In backend/src/controllers/quotation.controller.js
  // Update the generatePDF method

  generatePDF: async (req, res) => {
    try {
      console.log(
        "PDF generation request received for quotation:",
        req.params.id
      );
      const { templateId } = req.body;

      // Fetch necessary data with better error handling
      let quotation, business, template;
      try {
        quotation = await Quotation.findOne({
          _id: req.params.id,
          business: req.user.businessId,
        }).populate("items.item");

        if (!quotation) {
          console.error("Quotation not found:", req.params.id);
          return res.status(404).json({
            success: false,
            message: "Quotation not found",
          });
        }

        business = await Business.findById(req.user.businessId);
        if (!business) {
          console.error(
            "Business information not found for user:",
            req.user.id
          );
          return res.status(404).json({
            success: false,
            message: "Business information not found",
          });
        }

        console.log("Successfully loaded quotation and business data");
      } catch (fetchError) {
        console.error("Error fetching data for PDF:", fetchError);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch necessary data for PDF generation",
          error: fetchError.message,
        });
      }

      // Fetch template with better error handling
      if (templateId) {
        try {
          template = await Template.findOne({
            _id: templateId,
            businessId: req.user.businessId,
          });
          console.log("Using requested template:", templateId);
        } catch (templateError) {
          console.error("Error fetching requested template:", templateError);
          // Continue with null template, don't fail the whole process
        }
      }

      if (!template) {
        try {
          template = await Template.findOne({
            businessId: req.user.businessId,
            isDefault: true,
            type: "quotation",
          });
          console.log("Using default template");
        } catch (defaultTemplateError) {
          console.error(
            "Error fetching default template:",
            defaultTemplateError
          );
          // Continue with null template, don't fail the whole process
        }
      }

      if (!template) {
        console.log("No template found, will use basic formatting");
      }

      // Generate the PDF with better error handling
      let pdfPath;
      try {
        console.log("Starting PDF generation process");
        pdfPath = await pdfService.generateQuotationPDF(
          quotation,
          template,
          business
        );
        console.log("PDF generated successfully at:", pdfPath);
      } catch (pdfError) {
        console.error("PDF service error:", pdfError);
        return res.status(500).json({
          success: false,
          message: "Error generating PDF document",
          error: pdfError.message,
        });
      }

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="quotation-${quotation.quotationNumber}.pdf"`
      );

      // Stream the file to response with error handling
      try {
        console.log("Streaming PDF file to response");
        const fileStream = fs.createReadStream(pdfPath);

        fileStream.on("error", (streamError) => {
          console.error("Error streaming PDF file:", streamError);
          // Only send error if headers haven't been sent yet
          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              message: "Error streaming PDF file",
              error: streamError.message,
            });
          }
        });

        fileStream.pipe(res);

        // Clean up after sending
        fileStream.on("end", async () => {
          try {
            // Wait a moment to ensure file is fully delivered before deleting
            setTimeout(async () => {
              try {
                await fs.unlink(pdfPath);
                console.log("Temporary PDF file cleaned up:", pdfPath);
              } catch (unlinkError) {
                console.error("Error cleaning up temporary file:", unlinkError);
              }
            }, 1000);
          } catch (cleanupError) {
            console.error("Error in cleanup:", cleanupError);
          }
        });
      } catch (streamError) {
        console.error("Error setting up file stream:", streamError);
        return res.status(500).json({
          success: false,
          message: "Error preparing PDF for download",
          error: streamError.message,
        });
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      return res.status(500).json({
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
