// backend/src/controllers/quotation.controller.js
const PDFDocument = require("pdfkit");
const Quotation = require("../models/Quotation");
const Template = require("../models/Template");
const Business = require("../models/Business");
const fs = require("fs");
const path = require("path");

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

  // Generate PDF
  generatePDF: async (req, res) => {
    const tempDir = path.join(__dirname, "..", "..", "temp");
    let tempPath = null;

    try {
      // Ensure temp directory exists
      await fs.promises.mkdir(tempDir, { recursive: true });

      const { templateId } = req.body;

      // Get quotation with populated items
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

      // Get business info
      const business = await Business.findById(req.user.businessId);

      // Generate a unique filename for this PDF
      const filename = `quotation-${
        quotation.quotationNumber
      }-${Date.now()}.pdf`;
      tempPath = path.join(tempDir, filename);

      // Create a new PDF document
      const doc = new PDFDocument({ size: "A4", margin: 50 });

      // Create write stream with proper error handling
      const stream = fs.createWriteStream(tempPath);

      // Set up error handling for the stream
      stream.on("error", (error) => {
        console.error("Stream error:", error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error generating PDF: Stream error",
            error: error.message,
          });
        }
      });

      // Pipe the PDF to the write stream
      doc.pipe(stream);

      // Add content to the PDF
      doc.fontSize(16).text("Quotation", { align: "center" });

      doc.fontSize(12).moveDown();
      doc.text(`Quotation #: ${quotation.quotationNumber}`);
      doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`);
      doc.text(`Customer: ${quotation.customer.name}`);

      doc.moveDown();
      doc.text("Items:", { underline: true });

      // Basic table for items
      let y = doc.y + 20;
      doc.fontSize(10);

      // Draw simple headers
      doc.text("Item", 50, y);
      doc.text("Qty", 200, y);
      doc.text("Price", 250, y);
      doc.text("Total", 350, y);

      y += 20;

      // Draw items
      if (quotation.items && quotation.items.length > 0) {
        quotation.items.forEach((item) => {
          if (item && item.item) {
            doc.text(item.item.name || "Unknown Item", 50, y);
            doc.text(String(item.quantity || 0), 200, y);
            doc.text(`${(item.unitPrice || 0).toFixed(2)}`, 250, y);
            doc.text(`${(item.subtotal || 0).toFixed(2)}`, 350, y);
            y += 20;
          }
        });
      } else {
        doc.text("No items", 50, y);
      }

      // Add totals
      y += 20;
      doc.text(`Subtotal: ${(quotation.subtotal || 0).toFixed(2)}`, 250, y);
      y += 20;
      doc.text(`Tax: ${(quotation.taxTotal || 0).toFixed(2)}`, 250, y);
      y += 20;
      doc
        .fontSize(12)
        .text(`Total: ${(quotation.total || 0).toFixed(2)}`, 250, y);

      // Finalize the PDF
      doc.end();

      // Wait for the stream to finish
      await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      // Send the file
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      // Create a read stream and pipe it to the response
      const readStream = fs.createReadStream(tempPath);
      readStream.pipe(res);

      // Clean up the temp file after it's sent
      readStream.on("end", () => {
        fs.unlink(tempPath, (err) => {
          if (err) console.error("Error removing temp file:", err);
        });
      });
    } catch (error) {
      console.error("PDF generation error:", error);

      // Clean up the temp file if it exists and an error occurred
      if (tempPath) {
        try {
          fs.unlink(tempPath, (err) => {
            if (err) console.error("Error removing temp file:", err);
          });
        } catch (unlinkError) {
          console.error("Error removing temp file:", unlinkError);
        }
      }

      // Only send error response if headers haven't been sent
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to generate PDF",
          error: error.message,
        });
      }
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
