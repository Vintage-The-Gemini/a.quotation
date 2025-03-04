// backend/src/services/pdf.service.js
const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
const path = require("path");

class PDFService {
  /**
   * Generates a PDF for a quotation based on a template
   * @param {Object} quotation - The quotation object
   * @param {Object} template - The template object
   * @param {Object} business - The business information
   * @returns {Promise<string>} - Path to the generated PDF file
   */
  async generateQuotationPDF(quotation, template, business) {
    return new Promise(async (resolve, reject) => {
      try {
        // Ensure temp directory exists
        const tempDir = path.join(__dirname, "..", "..", "temp");
        await fs.ensureDir(tempDir);

        // Create PDF document with customizable options
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
          bufferPages: true,
          info: {
            Title: `Quotation - ${quotation.quotationNumber}`,
            Author: business?.name || "Quotation System",
            Subject: "Quotation",
            Keywords: "quotation, invoice, business",
            Creator: "Quotation App",
            Producer: "PDFKit",
          },
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

        // Get template settings or use defaults
        const styles = this._getStyles(template);

        // Register fonts if available
        this._registerFonts(doc);

        // Set the default font
        doc.font(styles.fontFamily);
        doc.fontSize(styles.fontSize);

        // Add content based on template structure
        this._addHeader(doc, quotation, business, template, styles);
        this._addCustomerInfo(doc, quotation, template, styles);
        this._addItemsTable(doc, quotation, template, styles);
        this._addTotals(doc, quotation, styles);
        this._addFooter(doc, quotation, template, styles);

        // Finalize the PDF
        doc.end();
      } catch (error) {
        console.error("PDF generation error:", error);
        reject(error);
      }
    });
  }

  /**
   * Get styles from template or use defaults
   */
  _getStyles(template) {
    // Default styles
    const defaultStyles = {
      primaryColor: "#1a73e8",
      secondaryColor: "#f1f3f4",
      textColor: "#202124",
      fontFamily: "Helvetica",
      fontSize: 10,
      headerFontSize: 18,
      subheaderFontSize: 14,
      tableBorderColor: "#e0e0e0",
      tableHeaderBgColor: "#f1f3f4",
      lineHeight: 1.5,
    };

    // If no template or style, return defaults
    if (!template || !template.style) {
      return defaultStyles;
    }

    // Merge template styles with defaults
    return {
      ...defaultStyles,
      primaryColor: template.style.primaryColor || defaultStyles.primaryColor,
      fontFamily:
        this._mapFontFamily(template.style.fontFamily) ||
        defaultStyles.fontFamily,
      fontSize:
        this._parseFontSize(template.style.fontSize) || defaultStyles.fontSize,
    };
  }

  /**
   * Map font family to PDFKit supported font
   */
  _mapFontFamily(fontFamily) {
    const fontMap = {
      Arial: "Helvetica",
      Helvetica: "Helvetica",
      "Times New Roman": "Times-Roman",
      Courier: "Courier",
      "Courier New": "Courier",
    };
    return fontMap[fontFamily] || "Helvetica";
  }

  /**
   * Parse font size from string to number
   */
  _parseFontSize(fontSize) {
    if (!fontSize) return 10;
    if (typeof fontSize === "number") return fontSize;

    // Extract number from string like "12px" or "1.5em"
    const match = fontSize.match(/^(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 10;
  }

  /**
   * Register custom fonts with PDFKit if needed
   */
  _registerFonts(doc) {
    // Example of registering fonts - implement if custom fonts are available
    /*
    doc.registerFont('CustomFont', 'path/to/custom-font.ttf');
    */
  }

  /**
   * Add header section to PDF
   */
  _addHeader(doc, quotation, business, template, styles) {
    // Start position
    const startY = doc.y;

    // Get header settings from template
    const headerConfig = template?.sections?.header || {
      showLogo: true,
      showBusinessInfo: true,
      showQuotationNumber: true,
      layout: "logo-right",
    };

    // Business info section
    if (headerConfig.showBusinessInfo && business) {
      // Determine position based on layout
      const businessInfoX = headerConfig.layout === "logo-left" ? 300 : 50;

      // Save position for business info
      doc.save();
      doc.fontSize(styles.headerFontSize).fillColor(styles.primaryColor);
      doc.text(business.name || "Your Business", businessInfoX, startY, {
        width: 200,
        align: headerConfig.layout === "logo-left" ? "right" : "left",
      });

      // Reset font for contact info
      doc.fontSize(styles.fontSize).fillColor(styles.textColor);
      doc.moveDown(0.5);

      // Add business contact details
      const contactInfo = [];
      if (business.email) contactInfo.push(business.email);
      if (business.phone) contactInfo.push(business.phone);
      if (business.address) {
        const address = [];
        if (business.address.street) address.push(business.address.street);
        if (business.address.city) address.push(business.address.city);
        if (business.address.state) address.push(business.address.state);
        if (business.address.zipCode) address.push(business.address.zipCode);
        if (business.address.country) address.push(business.address.country);

        if (address.length > 0) {
          contactInfo.push(address.join(", "));
        }
      }

      doc.text(contactInfo.join("\n"), {
        width: 200,
        align: headerConfig.layout === "logo-left" ? "right" : "left",
      });
      doc.restore();
    }

    // Logo section - placeholder for logo
    if (headerConfig.showLogo) {
      const logoX = headerConfig.layout === "logo-left" ? 50 : 350;
      const logoWidth = 150;
      const logoHeight = 60;

      // Create a placeholder rectangle for the logo
      doc.save();
      doc
        .rect(logoX, startY, logoWidth, logoHeight)
        .fillColor(styles.secondaryColor)
        .fill();
      doc
        .fillColor(styles.textColor)
        .fontSize(8)
        .text(
          "Business Logo",
          logoX + logoWidth / 2 - 30,
          startY + logoHeight / 2 - 5
        );
      doc.restore();

      // Note: In a real implementation, you'd load and embed the logo image
      // doc.image(logoPath, logoX, startY, { width: logoWidth, height: logoHeight });
    }

    // Document title section
    doc.moveDown(4);
    doc
      .fontSize(styles.headerFontSize)
      .fillColor(styles.primaryColor)
      .text("QUOTATION", { align: "center" });

    // Quotation details
    if (headerConfig.showQuotationNumber) {
      doc.moveDown(0.5);
      doc.fontSize(styles.fontSize).fillColor(styles.textColor);

      const quotationDetails = [
        `Quotation #: ${quotation.quotationNumber || "Draft"}`,
        `Date: ${new Date(
          quotation.createdAt || Date.now()
        ).toLocaleDateString()}`,
        `Valid Until: ${new Date(
          quotation.validUntil || Date.now()
        ).toLocaleDateString()}`,
      ];

      doc.text(quotationDetails.join("\n"), { align: "center" });
    }

    doc.moveDown(2);
  }

  /**
   * Add customer information section
   */
  _addCustomerInfo(doc, quotation, template, styles) {
    // Get customer info settings from template
    const customerConfig = template?.sections?.customerInfo || {
      position: "left",
      fields: [
        { name: "name", isVisible: true },
        { name: "email", isVisible: true },
        { name: "phone", isVisible: true },
        { name: "address", isVisible: true },
      ],
    };

    // Set alignment based on position
    const textAlign = customerConfig.position === "right" ? "right" : "left";

    // Calculate positioning
    const xPosition = customerConfig.position === "right" ? 350 : 50;
    const width = 200;

    // Add customer title
    doc.fontSize(styles.subheaderFontSize).fillColor(styles.primaryColor);
    doc.text("Bill To:", xPosition, doc.y, {
      continued: false,
      width,
      align: textAlign,
    });
    doc.moveDown(0.5);

    // Reset to normal text style
    doc.fontSize(styles.fontSize).fillColor(styles.textColor);

    // Prepare customer information
    const customerInfo = [];

    // Add fields based on visibility settings
    const visibleFields = customerConfig.fields || [];

    visibleFields.forEach((field) => {
      if (!field.isVisible) return;

      switch (field.name) {
        case "name":
          if (quotation.customer?.name)
            customerInfo.push(quotation.customer.name);
          break;
        case "email":
          if (quotation.customer?.email)
            customerInfo.push(quotation.customer.email);
          break;
        case "phone":
          if (quotation.customer?.phone)
            customerInfo.push(quotation.customer.phone);
          break;
        case "address":
          if (quotation.customer?.address) {
            const addressParts = [];
            if (quotation.customer.address.street)
              addressParts.push(quotation.customer.address.street);
            if (quotation.customer.address.city)
              addressParts.push(quotation.customer.address.city);
            if (quotation.customer.address.state)
              addressParts.push(quotation.customer.address.state);
            if (quotation.customer.address.zipCode)
              addressParts.push(quotation.customer.address.zipCode);
            if (quotation.customer.address.country)
              addressParts.push(quotation.customer.address.country);

            if (addressParts.length > 0) {
              customerInfo.push(addressParts.join(", "));
            }
          }
          break;
      }
    });

    // Add customer status badge
    const status = quotation.status || "draft";
    customerInfo.push(
      `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`
    );

    // Add all customer info
    doc.text(customerInfo.join("\n"), xPosition, doc.y, {
      width,
      align: textAlign,
    });
    doc.moveDown(2);
  }

  /**
   * Add items table to PDF
   */
  _addItemsTable(doc, quotation, template, styles) {
    // Get items table config from template
    const tableConfig = template?.sections?.itemTable || {
      columns: [
        { name: "item", label: "Item", isVisible: true },
        { name: "description", label: "Description", isVisible: true },
        { name: "quantity", label: "Quantity", isVisible: true },
        { name: "unitPrice", label: "Unit Price", isVisible: true },
        { name: "tax", label: "Tax", isVisible: true },
        { name: "total", label: "Total", isVisible: true },
      ],
    };

    // Get visible columns
    const visibleColumns = tableConfig.columns
      ? tableConfig.columns.filter((col) => col.isVisible)
      : [];

    // If no columns configured, use defaults
    if (visibleColumns.length === 0) {
      visibleColumns.push(
        { name: "item", label: "Item" },
        { name: "quantity", label: "Quantity" },
        { name: "unitPrice", label: "Unit Price" },
        { name: "total", label: "Total" }
      );
    }

    // Table setup
    const startX = 50;
    const startY = doc.y;
    const tableWidth = 500;
    const colWidth = tableWidth / visibleColumns.length;
    const rowHeight = 25;

    // Draw table header
    doc
      .rect(startX, startY, tableWidth, rowHeight)
      .fillColor(styles.tableHeaderBgColor)
      .fill();

    // Reset text color
    doc.fillColor(styles.primaryColor);

    // Add column headers
    visibleColumns.forEach((column, i) => {
      const x = startX + i * colWidth + 5;
      doc.text(column.label, x, startY + 7, {
        width: colWidth - 10,
        align: ["quantity", "unitPrice", "tax", "total"].includes(column.name)
          ? "right"
          : "left",
      });
    });

    // Start drawing rows
    let currentY = startY + rowHeight;

    // No items message if empty
    if (!quotation.items || quotation.items.length === 0) {
      doc
        .rect(startX, currentY, tableWidth, rowHeight)
        .fillColor("#ffffff")
        .fill();
      doc.fillColor(styles.textColor);
      doc.text("No items", startX + 5, currentY + 7, {
        width: tableWidth - 10,
        align: "center",
      });
      currentY += rowHeight;
    } else {
      // Add each item as a row
      quotation.items.forEach((item, rowIndex) => {
        // Row background
        doc
          .rect(startX, currentY, tableWidth, rowHeight)
          .fillColor(rowIndex % 2 === 0 ? "#ffffff" : "#f9f9f9")
          .fill();

        // Reset text color
        doc.fillColor(styles.textColor);

        // Add each cell in the row
        visibleColumns.forEach((column, colIndex) => {
          const x = startX + colIndex * colWidth + 5;
          const align = ["quantity", "unitPrice", "tax", "total"].includes(
            column.name
          )
            ? "right"
            : "left";

          let cellValue = "";
          const currency = quotation.currency || "KES";

          switch (column.name) {
            case "item":
              cellValue = item.item?.name || "";
              break;
            case "description":
              cellValue = item.item?.description || "";
              break;
            case "quantity":
              cellValue = item.quantity?.toString() || "0";
              break;
            case "unitPrice":
              cellValue = `${currency} ${this._formatCurrency(item.unitPrice)}`;
              break;
            case "tax":
              cellValue = item.tax ? `${item.tax}%` : "0%";
              break;
            case "total":
              cellValue = `${currency} ${this._formatCurrency(item.subtotal)}`;
              break;
          }

          doc.text(cellValue, x, currentY + 7, { width: colWidth - 10, align });
        });

        currentY += rowHeight;
      });
    }

    // Add dividing line
    doc
      .moveTo(startX, currentY)
      .lineTo(startX + tableWidth, currentY)
      .strokeColor(styles.tableBorderColor)
      .stroke();

    doc.y = currentY;
  }

  /**
   * Add totals section
   */
  _addTotals(doc, quotation, styles) {
    const currency = quotation.currency || "KES";
    const startX = 350;
    const width = 200;
    const rowHeight = 20;
    let currentY = doc.y + 10;

    // Subtotal
    doc.text("Subtotal:", startX, currentY, { width: 100, align: "right" });
    doc.text(
      `${currency} ${this._formatCurrency(quotation.subtotal)}`,
      startX + 110,
      currentY,
      { width: 90, align: "right" }
    );
    currentY += rowHeight;

    // Tax
    doc.text("Tax:", startX, currentY, { width: 100, align: "right" });
    doc.text(
      `${currency} ${this._formatCurrency(quotation.taxTotal)}`,
      startX + 110,
      currentY,
      { width: 90, align: "right" }
    );
    currentY += rowHeight;

    // Total (highlighted)
    const totalBoxHeight = 30;
    doc
      .rect(startX, currentY, width, totalBoxHeight)
      .fillColor(styles.primaryColor + "22") // Add transparency
      .fill();

    doc.fillColor(styles.primaryColor).fontSize(styles.subheaderFontSize);
    doc.text("Total:", startX + 10, currentY + 8, {
      width: 90,
      align: "right",
    });
    doc.text(
      `${currency} ${this._formatCurrency(quotation.total)}`,
      startX + 110,
      currentY + 8,
      { width: 90 - 10, align: "right" }
    );

    // Reset style
    doc.fillColor(styles.textColor).fontSize(styles.fontSize);

    // Update Y position for footer
    doc.y = currentY + totalBoxHeight + 20;
  }

  /**
   * Add footer with terms and signature
   */
  _addFooter(doc, quotation, template, styles) {
    // Get footer settings from template
    const footerConfig = template?.sections?.footer || {
      showTerms: true,
      showSignature: true,
      customText: "",
    };

    // Terms & Conditions
    if (footerConfig.showTerms && quotation.terms) {
      doc.fontSize(styles.subheaderFontSize).fillColor(styles.primaryColor);
      doc.text("Terms & Conditions", { align: "left" });
      doc.moveDown(0.5);

      doc.fontSize(styles.fontSize).fillColor(styles.textColor);
      doc.text(quotation.terms, { align: "left" });
      doc.moveDown();
    }

    // Notes
    if (quotation.notes) {
      doc.fontSize(styles.subheaderFontSize).fillColor(styles.primaryColor);
      doc.text("Notes", { align: "left" });
      doc.moveDown(0.5);

      doc.fontSize(styles.fontSize).fillColor(styles.textColor);
      doc.text(quotation.notes, { align: "left" });
      doc.moveDown();
    }

    // Signature
    if (footerConfig.showSignature) {
      const signatureY = doc.y + 40;

      // Draw signature line
      doc
        .moveTo(50, signatureY)
        .lineTo(200, signatureY)
        .strokeColor(styles.tableBorderColor)
        .stroke();

      doc.text("Authorized Signature", 85, signatureY + 5, { align: "center" });
    }

    // Custom footer text
    if (footerConfig.customText) {
      doc.moveDown(3);
      doc.fontSize(8).fillColor("#777777");
      doc.text(footerConfig.customText, { align: "center" });
    }

    // Add page numbers
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Skip the page number on the first page if it's shorter than 1 page
      if (i === 0 && pageCount === 1) continue;

      doc.fontSize(8).fillColor("#777777");
      doc.text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 50, {
        align: "center",
      });
    }
  }

  /**
   * Format currency numbers
   */
  _formatCurrency(number) {
    const num = parseFloat(number || 0);
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

module.exports = new PDFService();
