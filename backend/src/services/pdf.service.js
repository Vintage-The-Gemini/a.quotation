// backend/src/services/pdf.service.js
const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

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
        // Track temporary files for cleanup
        const tempFiles = [];

        // Ensure temp directory exists
        const tempDir = path.join(process.cwd(), "temp");
        await fs.ensureDir(tempDir);

        // Create PDF document
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
          bufferPages: true,
          info: {
            Title: `Quotation - ${quotation.quotationNumber}`,
            Author: business?.name || "Quotation System",
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
          // Clean up any temporary files we created
          this._cleanupTempFiles(tempFiles);
          resolve(filePath);
        });

        // Pipe output to file
        doc.pipe(writeStream);

        // Get styles based on template
        const styles = this._getStyles(template);

        // Set the default font
        doc.font(styles.fontFamily);
        doc.fontSize(styles.fontSize);

        // Add content based on template structure
        await this._addHeader(
          doc,
          quotation,
          business,
          template,
          styles,
          tempFiles
        );
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
   * Clean up temporary files created during PDF generation
   */
  _cleanupTempFiles(files) {
    if (!files || files.length === 0) return;

    files.forEach((file) => {
      try {
        fs.unlink(file, (err) => {
          if (err) {
            console.error(`Error removing temporary file ${file}:`, err);
          } else {
            console.log(`Temporary file removed: ${file}`);
          }
        });
      } catch (err) {
        console.error(`Error removing temporary file ${file}:`, err);
      }
    });
  }

  // backend/src/services/pdf.service.js (partial update - _prepareLogo method)

  /**
   * Prepare the logo file for PDFKit
   * PDFKit requires either a file path or a Buffer
   */
  async _prepareLogo(logo, tempFiles) {
    if (!logo) return null;

    try {
      let logoPath = null;

      console.log("Preparing logo for PDF:", JSON.stringify(logo, null, 2));

      // Helper function to normalize paths
      const normalizePath = (path) => {
        if (!path) return path;
        return path.replace(/\\/g, "/");
      };

      // Handle legacy string format (just filename)
      if (typeof logo === "string") {
        const normalizedLogo = normalizePath(logo);
        if (normalizedLogo.includes("/")) {
          // It's a path
          logoPath = path.join(process.cwd(), normalizedLogo);
        } else {
          // It's just a filename
          logoPath = path.join(
            process.cwd(),
            "uploads",
            "logos",
            normalizedLogo
          );
        }
        console.log("Legacy logo path:", logoPath);
      }
      // Handle object format
      else if (logo.url) {
        // Normalize the URL path
        const normalizedUrl = normalizePath(logo.url);

        // Handle Cloudinary URLs
        if (logo.isCloudinary) {
          // Download from Cloudinary to a temp file
          const tempLogoPath = path.join(
            process.cwd(),
            "temp",
            `logo-${Date.now()}.png`
          );
          await this._downloadFile(logo.url, tempLogoPath);
          logoPath = tempLogoPath;
          tempFiles.push(tempLogoPath); // Add to cleanup list
          console.log("Downloaded Cloudinary logo to:", logoPath);
        } else {
          // Local file handling with proper path construction
          if (normalizedUrl.startsWith("/")) {
            // Absolute path from root
            logoPath = path.join(process.cwd(), normalizedUrl.substring(1));
          } else if (normalizedUrl.includes("/")) {
            // Relative path with directories
            logoPath = path.join(process.cwd(), normalizedUrl);
          } else {
            // Just a filename
            logoPath = path.join(
              process.cwd(),
              "uploads",
              "logos",
              normalizedUrl
            );
          }
          console.log("Local logo path (constructed):", logoPath);

          // As a fallback, also check if file exists in the logos directory directly
          if (!fs.existsSync(logoPath)) {
            const fallbackPath = path.join(
              process.cwd(),
              "uploads",
              "logos",
              path.basename(normalizedUrl)
            );
            console.log("Checking fallback path:", fallbackPath);

            if (fs.existsSync(fallbackPath)) {
              console.log("Using fallback logo path:", fallbackPath);
              logoPath = fallbackPath;
            }
          }
        }
      }

      // Verify the file exists before returning
      if (logoPath) {
        try {
          await fs.access(logoPath);
          console.log("Logo file verified at:", logoPath);
          return logoPath;
        } catch (accessError) {
          console.error("Logo file doesn't exist:", accessError);

          // Try one last approach - extract just the filename and look for it
          try {
            const basename = path.basename(logoPath);
            const lastResortPath = path.join(
              process.cwd(),
              "uploads",
              "logos",
              basename
            );

            console.log("Trying last resort path:", lastResortPath);
            await fs.access(lastResortPath);
            console.log("Found logo at last resort path:", lastResortPath);
            return lastResortPath;
          } catch (lastResortError) {
            console.error("Last resort failed:", lastResortError);
            return null;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error preparing logo:", error);
      return null;
    }
  }

  // backend/src/services/pdf.service.js (continued)
  async _downloadFile(url, outputPath) {
    try {
      console.log(`Downloading file from ${url} to ${outputPath}`);
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
      });

      const writer = fs.createWriteStream(outputPath);

      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
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
      totalBgColor: "#ffeb3b",
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
   * Add header section to PDF with logo and business info
   */
  async _addHeader(doc, quotation, business, template, styles, tempFiles) {
    // Start position
    const startY = doc.y;
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Get header settings from template
    const headerConfig = template?.sections?.header || {
      showLogo: true,
      showBusinessInfo: true,
      showQuotationNumber: true,
      layout: "logo-right",
    };

    // Business info width and logo width
    const infoWidth = pageWidth * 0.6;
    const logoWidth = pageWidth * 0.3;

    // Business info section
    if (headerConfig.showBusinessInfo && business) {
      // Left side position for business info
      const businessInfoX = 50;

      // Save position for business info
      doc.fontSize(24).fillColor(styles.primaryColor);
      doc.text(business.name || "Your Business", businessInfoX, startY, {
        width: infoWidth,
        align: "left",
      });

      // Reset font for contact info
      doc.fontSize(styles.fontSize).fillColor(styles.textColor);
      doc.moveDown(0.5);

      // Add business contact details
      const contactInfo = [];
      if (business.email) contactInfo.push(business.email);
      if (business.phone) contactInfo.push(business.phone);
      if (business.address) {
        const addressParts = [];
        if (business.address.street) addressParts.push(business.address.street);
        if (business.address.city) addressParts.push(business.address.city);
        if (business.address.state) addressParts.push(business.address.state);
        if (business.address.zipCode)
          addressParts.push(business.address.zipCode);
        if (business.address.country)
          addressParts.push(business.address.country);

        if (addressParts.length > 0) {
          contactInfo.push(addressParts.join(", "));
        }
      }

      doc.text(contactInfo.join("\n"), businessInfoX, doc.y, {
        width: infoWidth,
        align: "left",
      });
    }

    // Logo section
    if (headerConfig.showLogo) {
      // Right side position for logo
      const logoX = doc.page.width - doc.page.margins.right - logoWidth;
      const logoY = startY;
      const logoHeight = 60;

      // If we have a logo, use it, otherwise create a placeholder
      if (business?.logo) {
        try {
          // Prepare the logo file
          const logoPath = await this._prepareLogo(business.logo, tempFiles);

          if (logoPath) {
            // Use the logo
            doc.image(logoPath, logoX, logoY, {
              width: logoWidth,
              height: logoHeight,
              fit: [logoWidth, logoHeight],
              align: "center",
              valign: "center",
            });
          } else {
            // Logo preparation failed, use placeholder
            this._createLogoPlaceholder(
              doc,
              logoX,
              logoY,
              logoWidth,
              logoHeight,
              styles
            );
          }
        } catch (err) {
          console.error("Error adding logo to PDF:", err);
          // Fallback to placeholder if logo can't be loaded
          this._createLogoPlaceholder(
            doc,
            logoX,
            logoY,
            logoWidth,
            logoHeight,
            styles
          );
        }
      } else {
        // No logo provided, create a placeholder
        this._createLogoPlaceholder(
          doc,
          logoX,
          logoY,
          logoWidth,
          logoHeight,
          styles
        );
      }
    }

    // Document title section - Add some space after the header
    doc.moveDown(4);
    doc.fontSize(styles.headerFontSize).fillColor(styles.primaryColor);
    doc.text("QUOTATION", { align: "center" });

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
   * Create a placeholder rectangle for the logo
   */
  _createLogoPlaceholder(doc, x, y, width, height, styles) {
    doc.save();
    doc.rect(x, y, width, height).fillColor("#f0f0f0").fill();
    doc.fillColor("#888888").fontSize(10);
    doc.text("Business Logo", x + width / 2 - 30, y + height / 2 - 5, {
      width: 60,
      align: "center",
    });
    doc.restore();
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
        { name: "description", label: "Description" },
        { name: "quantity", label: "Quantity" },
        { name: "unitPrice", label: "Unit Price" },
        { name: "tax", label: "Tax" },
        { name: "total", label: "Total" }
      );
    }

    // Table setup
    const startX = 50;
    const startY = doc.y;
    const pageWidth = doc.page.width - 100; // 50px margin on each side
    const rowHeight = 25;

    // Define column widths based on content type
    const columnWidths = this._calculateColumnWidths(visibleColumns, pageWidth);

    // Draw table header
    doc
      .rect(startX, startY, pageWidth, rowHeight)
      .fillColor(styles.tableHeaderBgColor)
      .fill();

    // Add column headers
    let xOffset = startX;
    visibleColumns.forEach((column, i) => {
      const width = columnWidths[i];
      const align = this._getColumnAlignment(column.name);

      doc
        .fillColor(styles.primaryColor)
        .font(`${styles.fontFamily}-Bold`, styles.fontSize);

      doc.text(column.label, xOffset + 5, startY + 8, {
        width: width - 10,
        align: align,
      });

      xOffset += width;
    });

    // Reset font
    doc.font(styles.fontFamily, styles.fontSize).fillColor(styles.textColor);

    // Start drawing rows
    let yPosition = startY + rowHeight;

    // No items message if empty
    if (!quotation.items || quotation.items.length === 0) {
      doc
        .rect(startX, yPosition, pageWidth, rowHeight)
        .fillColor("#ffffff")
        .fill();

      doc.fillColor(styles.textColor);
      doc.text("No items", startX + 5, yPosition + 8, {
        width: pageWidth - 10,
        align: "center",
      });

      yPosition += rowHeight;
    } else {
      // Add each item as a row
      quotation.items.forEach((item, rowIndex) => {
        // Calculate row height based on content
        const rowContentHeight = this._calculateRowHeight(
          doc,
          item,
          visibleColumns,
          columnWidths
        );
        const currentRowHeight = Math.max(rowHeight, rowContentHeight);

        // Check if we need to add a new page
        if (yPosition + currentRowHeight > doc.page.height - 100) {
          doc.addPage();
          yPosition = 50; // Reset Y position for the new page
        }

        // Row background
        doc
          .rect(startX, yPosition, pageWidth, currentRowHeight)
          .fillColor(rowIndex % 2 === 0 ? "#ffffff" : "#f9f9f9")
          .fill();

        // Add cell content
        let xOffset = startX;
        visibleColumns.forEach((column, colIndex) => {
          const width = columnWidths[colIndex];
          const align = this._getColumnAlignment(column.name);
          const padding = 5;

          // Get cell value
          let cellValue = this._getCellValue(
            item,
            column.name,
            quotation.currency
          );

          // Draw cell text
          doc.fillColor(styles.textColor);
          doc.text(cellValue, xOffset + padding, yPosition + 8, {
            width: width - padding * 2,
            align: align,
          });

          xOffset += width;
        });

        yPosition += currentRowHeight;
      });
    }

    // Add dividing line
    doc
      .moveTo(startX, yPosition)
      .lineTo(startX + pageWidth, yPosition)
      .strokeColor(styles.tableBorderColor)
      .stroke();

    // Update document y position
    doc.y = yPosition + 10;
  }

  /**
   * Calculate row height based on content
   */
  _calculateRowHeight(doc, item, columns, columnWidths) {
    let maxHeight = 25; // Default minimum height

    // For each column, calculate the height needed
    columns.forEach((column, i) => {
      const cellValue = this._getCellValue(item, column.name, "KES");
      const width = columnWidths[i] - 10; // Subtract padding

      if (cellValue) {
        // Get height of text for this cell
        const textHeight = doc.heightOfString(cellValue, {
          width: width,
          align: this._getColumnAlignment(column.name),
        });

        // Update max height if needed
        maxHeight = Math.max(maxHeight, textHeight + 16); // Add padding
      }
    });

    return maxHeight;
  }

  /**
   * Get cell value based on column name
   */
  _getCellValue(item, columnName, currency) {
    switch (columnName) {
      case "item":
        return item.item?.name || "";
      case "description":
        return item.item?.description || "";
      case "quantity":
        return item.quantity?.toString() || "0";
      case "unitPrice":
        return `${currency} ${this._formatCurrency(item.unitPrice)}`;
      case "tax":
        return item.tax ? `${item.tax}%` : "0%";
      case "total":
        return `${currency} ${this._formatCurrency(item.subtotal)}`;
      default:
        return "";
    }
  }

  /**
   * Calculate column widths based on content type
   */
  _calculateColumnWidths(columns, totalWidth) {
    // Define column type ratios
    const columnRatios = {
      item: 0.2, // 20% of total width
      description: 0.3, // 30% of total width
      quantity: 0.1, // 10% of total width
      unitPrice: 0.14, // 14% of total width
      tax: 0.11, // 11% of total width
      total: 0.15, // 15% of total width
    };

    // Handle case when fewer columns are visible
    let totalRatio = 0;
    columns.forEach((col) => {
      totalRatio += columnRatios[col.name] || 0.15; // Default to 15% if not specified
    });

    // Adjust ratios proportionally if they don't add up to 1
    const adjustmentFactor = totalRatio > 0 ? 1 / totalRatio : 1;

    // Calculate actual widths
    return columns.map((column) => {
      const ratio = (columnRatios[column.name] || 0.15) * adjustmentFactor;
      return totalWidth * ratio;
    });
  }

  /**
   * Get alignment based on column type
   */
  _getColumnAlignment(columnName) {
    const rightAlignedColumns = ["quantity", "unitPrice", "tax", "total"];
    return rightAlignedColumns.includes(columnName) ? "right" : "left";
  }

  /**
   * Add totals section
   */
  _addTotals(doc, quotation, styles) {
    const currency = quotation.currency || "KES";
    const pageWidth = doc.page.width - 100; // 50px margin on each side
    const totalWidth = pageWidth * 0.4; // 40% of page width
    const startX = doc.page.width - 50 - totalWidth; // Right-aligned
    const rowHeight = 20;
    let currentY = doc.y + 5;

    // Subtotal
    doc.text("Subtotal:", startX, currentY, {
      width: totalWidth * 0.5,
      align: "right",
    });
    doc.text(
      `${currency} ${this._formatCurrency(quotation.subtotal)}`,
      startX + totalWidth * 0.5,
      currentY,
      { width: totalWidth * 0.5, align: "right" }
    );
    currentY += rowHeight;

    // Tax
    doc.text("Tax:", startX, currentY, {
      width: totalWidth * 0.5,
      align: "right",
    });
    doc.text(
      `${currency} ${this._formatCurrency(quotation.taxTotal)}`,
      startX + totalWidth * 0.5,
      currentY,
      { width: totalWidth * 0.5, align: "right" }
    );
    currentY += rowHeight;

    // Total (highlighted)
    const totalBoxHeight = 30;
    doc
      .rect(startX, currentY, totalWidth, totalBoxHeight)
      .fillColor(styles.totalBgColor)
      .fill();

    doc.fillColor(styles.primaryColor).fontSize(styles.subheaderFontSize);
    doc.text("Total:", startX + 10, currentY + 8, {
      width: totalWidth * 0.5 - 10,
      align: "right",
    });

    doc.text(
      `${currency} ${this._formatCurrency(quotation.total)}`,
      startX + totalWidth * 0.5,
      currentY + 8,
      { width: totalWidth * 0.5 - 10, align: "right" }
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
      const signatureWidth = 150;

      // Draw signature line
      doc
        .moveTo(50, signatureY)
        .lineTo(50 + signatureWidth, signatureY)
        .strokeColor(styles.tableBorderColor)
        .stroke();

      doc.text("Authorized Signature", 50, signatureY + 5, {
        width: signatureWidth,
        align: "center",
      });
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
