// controllers/business.controller.js
const Business = require("../models/Business");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = "uploads/logos";
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "logo-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  },
});

// Get business settings
exports.getBusinessSettings = async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching business settings",
      error: error.message,
    });
  }
};

// Update business settings
exports.updateBusinessSettings = async (req, res) => {
  try {
    upload.single("logo")(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: "File upload error",
          error: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      try {
        const businessData = JSON.parse(req.body.data);
        const business = await Business.findById(req.user.businessId);

        if (!business) {
          return res.status(404).json({
            success: false,
            message: "Business not found",
          });
        }

        // If new logo uploaded, delete old one
        if (req.file && business.logo) {
          try {
            await fs.unlink(path.join("uploads/logos", business.logo));
          } catch (error) {
            console.error("Error deleting old logo:", error);
          }
        }

        // Update business data
        const updatedBusiness = await Business.findByIdAndUpdate(
          req.user.businessId,
          {
            ...businessData,
            logo: req.file ? req.file.filename : business.logo,
          },
          { new: true, runValidators: true }
        );

        res.json({
          success: true,
          data: updatedBusiness,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error updating business settings",
          error: error.message,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing request",
      error: error.message,
    });
  }
};

// Get business logo
exports.getBusinessLogo = async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId);

    if (!business || !business.logo) {
      return res.status(404).json({
        success: false,
        message: "Logo not found",
      });
    }

    const logoPath = path.join("uploads/logos", business.logo);
    res.sendFile(path.resolve(logoPath));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching logo",
      error: error.message,
    });
  }
};
