// backend/src/services/pdf.service.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const storageService = require("./storage.service");
const axios = require("axios");

class PDFService {
  async generateQuotationPDF(quotation, template, business) {
    return new Promise(async (resolve, reject) => {
      try {
        // Create temp directory with proper error handling
        const tempDir = path.join(__dirname, "../../temp");
        try {
          await fsPromises.mkdir(tempDir, { recursive: true });
          console.log("Temp directory confirmed:", tempDir);
        } catch (err) {
          console.log("Directory exists or creation error:", err);
          // Continue execution even if directory exists
        }

        // Create PDF document with template settings
        const doc = new PDFDocument({
          size: "A4",
          margin: 50,
          bufferPages: true,
        });

        // Set up the file path
        const filePath = path.join(tempDir, `quotation-${quotation._id}.pdf`);
        const writeStream = fs.createWriteStream(filePath);

        // Handle stream errors
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

        // Pipe the PDF document to the write stream
        doc.pipe(writeStream);

        try {
          // Apply template styles
          this.applyTemplateStyles(doc, template);

          // Add content sections based on template
          await this.addHeader(doc, business, quotation, template);
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
              .text(
                `Page ${i + 1} of ${pages.count}`,
                50,
                doc.page.height - 50,
                {
                  align: "center",
                }
              );
          }

          // Finalize the PDF
          doc.end();
        } catch (contentError) {
          console.error("Error during PDF content generation:", contentError);

          // Make sure we end the document to avoid hanging
          try {
            if (!doc.isEnded) doc.end();
          } catch (endError) {
            console.error("Error ending PDF document:", endError);
          }

          reject(contentError);
        }
      } catch (error) {
        console.error("PDF generation error:", error);
        reject(error);
      }
    });
  }

  applyTemplateStyles(doc, template) {
    try {
      if (!template) {
        // Default styling if no template
        doc.font("Helvetica").fontSize(12);
        return;
      }

      const { style } = template;

      // Set font with fallback
      let fontName = "Helvetica";
      if (style?.fontFamily) {
        if (
          [
            "Helvetica",
            "Times-Roman",
            "Courier",
            "Symbol",
            "ZapfDingbats",
          ].includes(style.fontFamily)
        ) {
          fontName = style.fontFamily;
        } else if (style.fontFamily === "Arial") {
          fontName = "Helvetica"; // Arial substitute
        } else if (style.fontFamily === "Times New Roman") {
          fontName = "Times-Roman"; // Times New Roman substitute
        }
      }

      doc.font(fontName).fontSize(parseInt(style?.fontSize) || 12);
    } catch (error) {
      console.error("Error applying template styles:", error);
      // Use default styling as fallback
      doc.font("Helvetica").fontSize(12);
    }
  }

  async addHeader(doc, business, quotation, template) {
    try {
      const { sections } = template || {};
      const { header } = sections || {};
      const headerLayout = header?.layout || "logo-right";

      // Start position
      const startY = doc.y;

      // Add business info based on layout
      if (header?.showBusinessInfo) {
        const businessInfoX = headerLayout === "logo-left" ? 250 : 50;

        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(business?.name || "Business Name", businessInfoX, startY, {
            width: 200,
            align: headerLayout === "logo-left" ? "right" : "left",
          })
          .fontSize(10)
          .font("Helvetica")
          .text(business?.email || "", {
            width: 200,
            align: headerLayout === "logo-left" ? "right" : "left",
          })
          .text(business?.phone || "", {
            width: 200,
            align: headerLayout === "logo-left" ? "right" : "left",
          })
          .text(this.formatAddress(business?.address), {
            width: 200,
            align: headerLayout === "logo-left" ? "right" : "left",
          });
      }

      // Add logo
      if (header?.showLogo && business?.logo?.url) {
        try {
          const logoX =
            headerLayout === "logo-left" ? 50 : doc.page.width - 150;
          let logoBuffer;

          // Get logo based on storage type
          if (business.logo.isCloudinary) {
            // Download from Cloudinary
            const response = await axios.get(business.logo.url, {
              responseType: "arraybuffer",
            });
            logoBuffer = Buffer.from(response.data, "binary");
          } else {
            // Read from local file system
            const logoPath = path.join(process.cwd(), business.logo.url);
            if (fs.existsSync(logoPath)) {
              logoBuffer = fs.readFileSync(logoPath);
            }
          }

          if (logoBuffer) {
            doc.image(logoBuffer, logoX, startY, {
              fit: [150, 80],
              align: headerLayout === "logo-left" ? "left" : "right",
            });
          }
        } catch (logoError) {
          console.error("Error adding logo to PDF:", logoError);
        }
      }

      // Add space after header
      doc.moveDown(6);

      // Add quotation title centered
      doc
        .fontSize(20)
        .text("QUOTATION", { align: "center" })
        .fontSize(12)
        .moveDown(2);

      // Add quotation details
      if (header?.showQuotationNumber) {
        doc
          .text(`Quotation Number: ${quotation.quotationNumber || ""}`)
          .text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`)
          .text(
            `Valid Until: ${new Date(
              quotation.validUntil
            ).toLocaleDateString()}`
          );
      }
    } catch (error) {
      console.error("Error adding header to PDF:", error);
      // Add basic header as fallback
      doc.fontSize(20).text("QUOTATION", { align: "center" }).moveDown();
    }
  }

  addCustomerInfo(doc, customer, template) {
    try {
      doc.moveDown().font("Helvetica-Bold").text("Bill To:").font("Helvetica");

      if (!customer) {
        doc.text("Customer information not available");
        return;
      }

      const { customerInfo } = template?.sections || {};
      const fields = customerInfo?.fields || [
        { name: "name", isVisible: true },
        { name: "email", isVisible: true },
        { name: "phone", isVisible: true },
        { name: "address", isVisible: true },
      ];

      fields.forEach((field) => {
        if (field?.isVisible) {
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
    } catch (error) {
      console.error("Error adding customer info to PDF:", error);
      // Add basic customer info as fallback
      doc.text("Customer: " + (customer?.name || "Unknown"));
      doc.moveDown();
    }
  }

  addQuotationDetails(doc, quotation, template) {
    try {
      doc
        .fontSize(12)
        .text(`Status: ${(quotation.status || "Draft").toUpperCase()}`, {
          align: "right",
        })
        .moveDown();
    } catch (error) {
      console.error("Error adding quotation details to PDF:", error);
    }
  }

  addItemsTable(doc, items, template) {
    try {
      if (!items || !Array.isArray(items) || items.length === 0) {
        console.warn("No items to add to the PDF");
        doc.moveDown().text("No items", { align: "center" });
        return;
      }

      const { itemTable } = template?.sections || {};
      const columns = itemTable?.columns || [
        { name: "item", label: "Item", isVisible: true },
        { name: "quantity", label: "Quantity", isVisible: true },
        { name: "unitPrice", label: "Unit Price", isVisible: true },
        { name: "tax", label: "Tax", isVisible: true },
        { name: "total", label: "Total", isVisible: true },
      ];

      // Filter visible columns
      const visibleColumns = columns.filter((col) => col.isVisible);

      if (visibleColumns.length === 0) {
        doc.text("No columns configured for items table");
        return;
      }

      // Calculate column widths
      const tableWidth = doc.page.width - 100; // 50pt margin on each side
      const colWidth = tableWidth / visibleColumns.length;

      // Table headers
      let yPos = doc.y;
      let xPos = 50;

      // Draw header background
      doc.rect(xPos, yPos, tableWidth, 20).fill("#f0f0f0");

      // Draw header text
      doc.fillColor("#000000").font("Helvetica-Bold");
      visibleColumns.forEach((col) => {
        doc.text(col.label, xPos + 5, yPos + 5, {
          width: colWidth - 10,
          align: this.getColumnAlignment(col.name),
        });
        xPos += colWidth;
      });

      // Reset position for rows
      doc.moveDown();
      yPos = doc.y;

      // Draw rows
      doc.font("Helvetica");

      let rowColor = false; // Alternate row colors

      items.forEach((item, rowIndex) => {
        // Make sure we have enough space for the row
        if (yPos + 20 > doc.page.height - 100) {
          doc.addPage();
          yPos = doc.y;
        }

        // Draw row background
        if (rowColor) {
          doc.rect(50, yPos, tableWidth, 20).fill("#f9f9f9");
        }
        rowColor = !rowColor;

        // Draw cells
        xPos = 50;
        visibleColumns.forEach((col) => {
          let value = "";
          try {
            switch (col.name) {
              case "item":
                value = item.item?.name || "Unknown item";
                break;
              case "description":
                value = item.item?.description || "";
                break;
              case "quantity":
                value = item.quantity?.toString() || "0";
                break;
              case "unitPrice":
                value = this.formatCurrency(item.unitPrice);
                break;
              case "tax":
                value = item.tax ? `${item.tax}%` : "0%";
                break;
              case "total":
                value = this.formatCurrency(item.subtotal);
                break;
              default:
                value = "";
            }
          } catch (cellError) {
            console.error(
              `Error processing cell [${rowIndex}][${col.name}]:`,
              cellError
            );
            value = "Error";
          }

          doc.fillColor("#000000").text(value, xPos + 5, yPos + 5, {
            width: colWidth - 10,
            align: this.getColumnAlignment(col.name),
          });
          xPos += colWidth;
        });

        yPos += 20;
      });

      // Set position after table
      doc.y = yPos + 10;
    } catch (error) {
      console.error("Error adding items table to PDF:", error);
      // Fallback
      doc
        .moveDown()
        .text("Items table could not be displayed", { align: "center" });
    }
  }

  getColumnAlignment(columnName) {
    // Return the appropriate alignment based on column content
    switch (columnName) {
      case "quantity":
      case "unitPrice":
      case "tax":
      case "total":
        return "right";
      case "item":
      case "description":
      default:
        return "left";
    }
  }

  addTotals(doc, quotation, template) {
    try {
      doc.moveDown().font("Helvetica-Bold");

      const rightColumn = doc.page.width - 200;
      const valueColumn = doc.page.width - 100;

      // Draw background for totals section
      doc
        .rect(rightColumn - 10, doc.y - 5, valueColumn - rightColumn + 60, 70)
        .fill("#f5f5f5");

      // Draw totals text
      doc
        .fillColor("#000000")
        .text("Subtotal:", rightColumn, doc.y - 60)
        .text(
          this.formatCurrency(quotation.subtotal || 0),
          valueColumn,
          doc.y - 20,
          { align: "right" }
        );

      doc
        .text("Tax:", rightColumn, doc.y)
        .text(
          this.formatCurrency(quotation.taxTotal || 0),
          valueColumn,
          doc.y,
          { align: "right" }
        );

      // Draw total with highlight
      doc
        .rect(rightColumn - 10, doc.y + 5, valueColumn - rightColumn + 60, 25)
        .fill("#e0e0e0");

      doc
        .fillColor("#000000")
        .text("Total:", rightColumn, doc.y + 10)
        .text(this.formatCurrency(quotation.total || 0), valueColumn, doc.y, {
          align: "right",
        });

      doc.moveDown(2);
    } catch (error) {
      console.error("Error adding totals to PDF:", error);
      // Fallback
      doc.text("Total: " + this.formatCurrency(quotation.total || 0), {
        align: "right",
      });
      doc.moveDown();
    }
  }

  addFooter(doc, quotation, template, business) {
    try {
      const { footer } = template?.sections || {};

      doc.moveDown(2);

      if (footer?.showTerms && quotation.terms) {
        doc
          .font("Helvetica-Bold")
          .text("Terms and Conditions")
          .font("Helvetica")
          .text(quotation.terms || "");
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
    } catch (error) {
      console.error("Error adding footer to PDF:", error);
    }
  }

  formatAddress(address) {
    if (!address) return "";
    try {
      const parts = [
        address.street,
        address.city,
        address.state,
        address.zipCode,
        address.country,
      ].filter(Boolean);
      return parts.join(", ");
    } catch (error) {
      console.error("Error formatting address:", error);
      return "";
    }
  }

  formatCurrency(amount) {
    try {
      return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
      }).format(Number(amount) || 0);
    } catch (error) {
      console.error("Error formatting currency:", error);
      return "KES 0.00";
    }
  }
}

module.exports = new PDFService();
