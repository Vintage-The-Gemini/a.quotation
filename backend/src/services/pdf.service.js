// /backend/src/services/pdf.service.js

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PDFService {
  async generateQuotationPDF(quotation, template, business) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
          bufferPages: true,
        });

        const filePath = path.join(
          __dirname,
          "../temp",
          `quotation-${quotation._id}.pdf`
        );
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // Apply template styles
        this.applyTemplateStyles(doc, template);

        // Add business logo if exists
        if (business.logo) {
          const logoPath = path.join(
            __dirname,
            "../../uploads/logos",
            business.logo
          );
          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, {
              fit: [150, 150],
              align: "right",
            });
          }
        }

        // Add business details based on template
        this.addBusinessDetails(doc, business, template);

        // Add quotation details
        this.addQuotationDetails(doc, quotation, template);

        // Add items table
        this.addItemsTable(doc, quotation.items, template);

        // Add totals
        this.addTotals(doc, quotation, template);

        // Add footer
        this.addFooter(doc, quotation, template, business);

        // Finalize the PDF
        doc.end();

        writeStream.on("finish", () => {
          resolve(filePath);
        });

        writeStream.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  applyTemplateStyles(doc, template) {
    if (!template) return;

    const { style } = template;
    if (style) {
      // Set default font family and size
      doc
        .font(style.fontFamily || "Helvetica")
        .fontSize(parseInt(style.fontSize) || 12);
    }
  }

  addBusinessDetails(doc, business, template) {
    const { sections } = template || {};
    const { header } = sections || {};

    if (header?.showBusinessInfo) {
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(business.name, { align: "left" })
        .fontSize(10)
        .font("Helvetica")
        .text(business.email)
        .text(business.phone)
        .text(this.formatAddress(business.address));
    }

    doc.moveDown(2);
  }

  addQuotationDetails(doc, quotation, template) {
    doc.fontSize(20).text("QUOTATION", { align: "center" }).moveDown();

    doc
      .fontSize(10)
      .text(`Quotation Number: ${quotation.quotationNumber}`)
      .text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`)
      .text(
        `Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`
      )
      .moveDown()
      .text("Bill To:")
      .text(quotation.customer.name)
      .text(quotation.customer.email || "")
      .text(quotation.customer.phone || "")
      .text(this.formatAddress(quotation.customer.address))
      .moveDown();
  }

  addItemsTable(doc, items, template) {
    // Set up the table headers
    const tableTop = doc.y;
    const itemX = 50;
    const descriptionX = 150;
    const quantityX = 280;
    const priceX = 350;
    const totalX = 450;

    doc.font("Helvetica-Bold");
    doc.text("Item", itemX, tableTop);
    doc.text("Description", descriptionX, tableTop);
    doc.text("Qty", quantityX, tableTop);
    doc.text("Price", priceX, tableTop);
    doc.text("Total", totalX, tableTop);

    let y = tableTop + 20;
    doc.font("Helvetica");

    items.forEach((item) => {
      doc.text(item.item.name, itemX, y);
      doc.text(item.item.description || "", descriptionX, y);
      doc.text(item.quantity.toString(), quantityX, y);
      doc.text(item.unitPrice.toFixed(2), priceX, y);
      doc.text(item.subtotal.toFixed(2), totalX, y);
      y += 20;
    });

    doc.moveDown();
  }

  addTotals(doc, quotation, template) {
    const { total, subtotal, taxTotal } = quotation;

    doc
      .text(`Subtotal: ${subtotal.toFixed(2)}`, { align: "right" })
      .text(`Tax: ${taxTotal.toFixed(2)}`, { align: "right" })
      .font("Helvetica-Bold")
      .text(`Total: ${total.toFixed(2)}`, { align: "right" })
      .moveDown();
  }

  addFooter(doc, quotation, template, business) {
    const { sections } = template || {};
    const { footer } = sections || {};

    if (footer?.showTerms && quotation.terms) {
      doc
        .font("Helvetica-Bold")
        .text("Terms and Conditions")
        .font("Helvetica")
        .text(quotation.terms)
        .moveDown();
    }

    if (quotation.notes) {
      doc
        .font("Helvetica-Bold")
        .text("Notes")
        .font("Helvetica")
        .text(quotation.notes)
        .moveDown();
    }

    if (footer?.showSignature) {
      doc
        .moveDown(4)
        .lineWidth(0.5)
        .lineCap("butt")
        .moveTo(doc.page.width - 200, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke()
        .text("Authorized Signature", doc.page.width - 200, doc.y + 5, {
          width: 150,
          align: "center",
        });
    }

    // Add footer text if specified in template
    if (footer?.customText) {
      doc.fontSize(8).text(footer.customText, 50, doc.page.height - 50, {
        align: "center",
        width: doc.page.width - 100,
      });
    }
  }

  formatAddress(address) {
    if (!address) return "";
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country,
    ].filter(Boolean);
    return parts.join(", ");
  }
}

module.exports = new PDFService();
