// backend/src/services/pdf.service.js
const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
const path = require("path");

class PDFService {
  async generateQuotationPDF(quotation, template, business) {
    return new Promise(async (resolve, reject) => {
      try {
        // Ensure temp directory exists
        const tempDir = path.join(__dirname, "..", "..", "temp");
        await fs.ensureDir(tempDir);

        // Create PDF document
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
          bufferPages: true,
        });

        // Set up file path and streams
        const filePath = path.join(tempDir, `quotation-${quotation._id}.pdf`);
        const writeStream = fs.createWriteStream(filePath);

        // Handle stream events
        writeStream.on("error", (error) => {
          console.error("Write stream error:", error);
          reject(error);
        });

        doc.on("error", (error) => {
          console.error("PDFDocument error:", error);
          reject(error);
        });

        writeStream.on("finish", () => {
          resolve(filePath);
        });

        // Pipe output to file
        doc.pipe(writeStream);

        // Add basic content (simplified for debugging)
        doc.fontSize(16).text("Quotation", { align: "center" });
        doc.moveDown();
        doc
          .fontSize(12)
          .text(`Quotation #: ${quotation.quotationNumber || "Draft"}`);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        // Add customer info
        doc.text("Customer Information:");
        doc.text(`Name: ${quotation.customer?.name || "N/A"}`);
        doc.text(`Email: ${quotation.customer?.email || "N/A"}`);
        doc.moveDown();

        // Add items table (simplified)
        doc.text("Items:");
        doc.moveDown(0.5);

        // Draw items table headers
        const startY = doc.y;
        doc.rect(50, startY, 500, 20).fill("#f0f0f0");
        doc.fillColor("#000000");
        doc.text("Item", 60, startY + 5);
        doc.text("Qty", 250, startY + 5);
        doc.text("Price", 300, startY + 5);
        doc.text("Total", 400, startY + 5);

        // Add items
        let y = startY + 25;
        (quotation.items || []).forEach((item, i) => {
          doc.text(item.item?.name || "Unknown Item", 60, y);
          doc.text(String(item.quantity || 0), 250, y);
          doc.text(`$${(item.unitPrice || 0).toFixed(2)}`, 300, y);
          doc.text(`$${(item.subtotal || 0).toFixed(2)}`, 400, y);
          y += 20;
        });

        doc.moveDown(2);

        // Add totals
        doc.text(`Subtotal: $${(quotation.subtotal || 0).toFixed(2)}`, {
          align: "right",
        });
        doc.text(`Tax: $${(quotation.taxTotal || 0).toFixed(2)}`, {
          align: "right",
        });
        doc.text(`Total: $${(quotation.total || 0).toFixed(2)}`, {
          align: "right",
          font: "Helvetica-Bold",
        });

        // Finalize the PDF
        doc.end();
      } catch (error) {
        console.error("PDF generation error:", error);
        reject(error);
      }
    });
  }
}

module.exports = new PDFService();
