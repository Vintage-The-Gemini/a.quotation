const PDFDocument = require("pdfkit");
const Quotation = require("../models/Quotation");
const Template = require("../models/Template");
const Business = require("../models/Business");
const fs = require("fs").promises;
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

  generatePDF: async (req, res) => {
    try {
      const { templateId } = req.body;

      // Fetch necessary data
      const [quotation, business] = await Promise.all([
        Quotation.findOne({
          _id: req.params.id,
          business: req.user.businessId,
        }).populate("items.item"),
        require("../models/Business").findById(req.user.businessId),
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
        try {
          template = await require("../models/Template").findOne({
            _id: templateId,
            businessId: req.user.businessId,
          });
        } catch (error) {
          console.log("Template not found, using default:", error);
        }
      }

      // If no specific template found, try to get the default
      if (!template) {
        try {
          template = await require("../models/Template").findOne({
            businessId: req.user.businessId,
            isDefault: true,
            type: "quotation",
          });
        } catch (error) {
          console.log("Default template not found:", error);
        }
      }

      // Make sure temp directory exists
      const tempDir = path.join(__dirname, "..", "temp");
      try {
        await fs.promises.mkdir(tempDir, { recursive: true });
      } catch (err) {
        console.log(
          "Temp directory already exists or couldn't be created:",
          err
        );
      }

      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true, // Enable page buffering
      });

      // Create a write stream
      const tempPath = path.join(tempDir, `quotation-${quotation._id}.pdf`);
      const writeStream = fs.createWriteStream(tempPath);

      // Set up promise to handle stream completion
      const streamComplete = new Promise((resolve, reject) => {
        writeStream.on("finish", () => resolve(tempPath));
        writeStream.on("error", reject);
      });

      // Pipe to write stream
      doc.pipe(writeStream);

      // Add content
      doc.fontSize(25).text("Quotation", { align: "center" }).moveDown();

      // Add quotation details
      doc
        .fontSize(12)
        .text(`Quotation Number: ${quotation.quotationNumber}`)
        .text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`)
        .text(
          `Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`
        )
        .moveDown();

      // Add customer details
      doc
        .text(`Customer: ${quotation.customer.name}`)
        .text(`Email: ${quotation.customer.email || "N/A"}`)
        .text(`Phone: ${quotation.customer.phone || "N/A"}`)
        .moveDown();

      // Add items table
      doc.text("Items:", { underline: true }).moveDown();

      // Table headers
      const tableTop = doc.y;
      const itemX = 50;
      const qtyX = 200;
      const priceX = 300;
      const totalX = 400;

      doc
        .text("Item", itemX, tableTop)
        .text("Quantity", qtyX, tableTop)
        .text("Price", priceX, tableTop)
        .text("Total", totalX, tableTop)
        .moveDown();

      let row = 0;
      // Make sure items exist and have all needed fields
      if (
        quotation.items &&
        Array.isArray(quotation.items) &&
        quotation.items.length > 0
      ) {
        quotation.items.forEach((item) => {
          if (item && item.item) {
            const y = tableTop + (row + 1) * 30;
            doc
              .text(item.item.name || "Unnamed Item", itemX, y)
              .text((item.quantity || 0).toString(), qtyX, y)
              .text(`KES ${(item.unitPrice || 0).toFixed(2)}`, priceX, y)
              .text(`KES ${(item.subtotal || 0).toFixed(2)}`, totalX, y);
            row++;
          }
        });
      } else {
        doc.text("No items", itemX, tableTop + 30);
        row = 1;
      }

      doc.moveDown(row + 1);

      // Add totals
      const totalsX = 300;
      doc
        .text(`Subtotal: KES ${(quotation.subtotal || 0).toFixed(2)}`, totalsX)
        .text(`Tax: KES ${(quotation.taxTotal || 0).toFixed(2)}`, totalsX)
        .text(
          `Total: KES ${(quotation.total || 0).toFixed(2)}`,
          totalsX,
          null,
          {
            bold: true,
          }
        );

      // Add terms if exists
      if (quotation.terms) {
        doc
          .moveDown(2)
          .text("Terms and Conditions:", { underline: true })
          .moveDown()
          .text(quotation.terms);
      }

      // Add notes if exists
      if (quotation.notes) {
        doc
          .moveDown(2)
          .text("Notes:", { underline: true })
          .moveDown()
          .text(quotation.notes);
      }

      // Add page numbers
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 50, {
            align: "center",
          });
      }

      // Finalize PDF
      doc.end();

      // Wait for stream to complete
      await streamComplete;

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="quotation-${quotation.quotationNumber}.pdf"`
      );

      // Stream the file to response
      const fileStream = fs.createReadStream(tempPath);
      fileStream.pipe(res);

      // Clean up after sending
      fileStream.on("end", async () => {
        try {
          await fs.promises.unlink(tempPath);
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
