const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PDFService {
  async generateQuotationPDF(quotation, template, business) {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document with template settings
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
          bufferPages: true,
        });

        // Set up the file path
        const filePath = path.join(
          __dirname,
          "../temp",
          `quotation-${quotation._id}.pdf`
        );
        const writeStream = fs.createWriteStream(filePath);

        // Handle stream errors
        writeStream.on("error", (error) => {
          console.error("Write stream error:", error);
          reject(error);
        });

        writeStream.on("finish", () => {
          resolve(filePath);
        });

        // Pipe the PDF document to the write stream
        doc.pipe(writeStream);

        // Apply template styles
        this.applyTemplateStyles(doc, template);

        // Add content sections based on template
        this.addHeader(doc, business, quotation, template);
        this.addCustomerInfo(doc, quotation.customer, template);
        this.addQuotationDetails(doc, quotation, template);
        this.addItemsTable(doc, quotation.items, template);
        this.addTotals(doc, quotation, template);
        this.addFooter(doc, quotation, template, business);

        // Add page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 50, {
              align: "center",
            });
        }

        // Finalize the PDF
        doc.end();
      } catch (error) {
        console.error("PDF generation error:", error);
        reject(error);
      }
    });
  }

  applyTemplateStyles(doc, template) {
    if (!template) return;

    const { style } = template;
    doc
      .font(style?.fontFamily || "Helvetica")
      .fontSize(parseInt(style?.fontSize) || 12);
  }

  addHeader(doc, business, quotation, template) {
    const { sections } = template || {};
    const { header } = sections || {};

    if (header?.showLogo && business.logo) {
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

    if (header?.showBusinessInfo) {
      doc
        .moveDown()
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(business.name || "", { align: "left" })
        .fontSize(10)
        .font("Helvetica")
        .text(business.email || "")
        .text(business.phone || "")
        .text(this.formatAddress(business.address));
    }

    doc
      .moveDown(2)
      .fontSize(20)
      .text("QUOTATION", { align: "center" })
      .fontSize(12)
      .moveDown();

    if (header?.showQuotationNumber) {
      doc
        .text(`Quotation Number: ${quotation.quotationNumber}`)
        .text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`)
        .text(
          `Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`
        );
    }
  }

  addCustomerInfo(doc, customer, template) {
    doc.moveDown().font("Helvetica-Bold").text("Bill To:").font("Helvetica");

    const { customerInfo } = template?.sections || {};
    const fields = customerInfo?.fields || [];

    fields.forEach((field) => {
      if (field.isVisible) {
        switch (field.name) {
          case "name":
            doc.text(customer.name || "");
            break;
          case "email":
            doc.text(customer.email || "");
            break;
          case "phone":
            doc.text(customer.phone || "");
            break;
          case "address":
            doc.text(this.formatAddress(customer.address));
            break;
        }
      }
    });

    doc.moveDown();
  }

  addQuotationDetails(doc, quotation, template) {
    doc
      .fontSize(12)
      .text(`Status: ${quotation.status.toUpperCase()}`, { align: "right" })
      .moveDown();
  }

  addItemsTable(doc, items, template) {
    const { itemTable } = template?.sections || {};
    const columns = itemTable?.columns || [];

    // Table headers
    let yPos = doc.y;
    let xPos = 50;

    doc.font("Helvetica-Bold");
    columns.forEach((col) => {
      if (col.isVisible) {
        doc.text(col.label, xPos, yPos);
        xPos += 100;
      }
    });

    doc.moveDown();
    yPos = doc.y;

    // Table rows
    doc.font("Helvetica");
    items.forEach((item) => {
      xPos = 50;
      columns.forEach((col) => {
        if (col.isVisible) {
          let value = "";
          switch (col.name) {
            case "item":
              value = item.item.name;
              break;
            case "description":
              value = item.item.description || "";
              break;
            case "quantity":
              value = item.quantity.toString();
              break;
            case "unitPrice":
              value = this.formatCurrency(item.unitPrice);
              break;
            case "tax":
              value = item.tax ? `${item.tax}%` : "N/A";
              break;
            case "total":
              value = this.formatCurrency(item.subtotal);
              break;
          }
          doc.text(value, xPos, yPos);
          xPos += 100;
        }
      });
      doc.moveDown();
      yPos = doc.y;
    });
  }

  addTotals(doc, quotation, template) {
    doc.moveDown().font("Helvetica-Bold");

    const rightColumn = 400;
    doc
      .text("Subtotal:", rightColumn)
      .text(this.formatCurrency(quotation.subtotal), rightColumn + 100);

    doc
      .text("Tax:", rightColumn)
      .text(this.formatCurrency(quotation.taxTotal), rightColumn + 100);

    doc
      .text("Total:", rightColumn)
      .text(this.formatCurrency(quotation.total), rightColumn + 100);
  }

  addFooter(doc, quotation, template, business) {
    const { footer } = template?.sections || {};

    doc.moveDown(2);

    if (footer?.showTerms && quotation.terms) {
      doc
        .font("Helvetica-Bold")
        .text("Terms and Conditions")
        .font("Helvetica")
        .text(quotation.terms);
    }

    if (footer?.showSignature) {
      doc
        .moveDown(4)
        .lineWidth(1)
        .moveTo(400, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .text("Authorized Signature", 400, doc.y + 5);
    }

    if (footer?.customText) {
      doc
        .moveDown(2)
        .fontSize(8)
        .text(footer.customText, {
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

  formatCurrency(amount) {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  }
}

module.exports = new PDFService();
