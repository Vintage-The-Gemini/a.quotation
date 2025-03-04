// backend/src/middlewares/upload.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { uploadToCloudinary } = require("../config/cloudinary");

// Configure local storage
const localStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    let uploadDir = "uploads";

    // Determine upload directory based on file type
    if (file.fieldname === "logo") {
      uploadDir = path.join(uploadDir, "logos");
    } else if (file.fieldname === "document") {
      uploadDir = path.join(uploadDir, "documents");
    }

    // Create directory if it doesn't exist
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === "logo") {
      cb(null, "logo-" + uniqueSuffix + ext);
    } else {
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
  },
});

// File filter function
const fileFilter = function (req, file, cb) {
  if (file.fieldname === "logo") {
    // Allow only image files for logo
    const filetypes = /jpeg|jpg|png|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(
      new Error("Only .png, .jpg, .jpeg and .svg files are allowed for logos")
    );
  } else {
    // Default accept all files
    cb(null, true);
  }
};

// Create multer upload instance
const uploadLocal = multer({
  storage: localStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit by default
  },
  fileFilter: fileFilter,
});

// Choose whether to use Cloudinary or local storage
const useCloudinary = process.env.USE_CLOUDINARY === "true";

// Create upload middleware functions
const upload = (fieldName, options = {}) => {
  const uploader = useCloudinary ? uploadToCloudinary : uploadLocal;
  return uploader.single(fieldName);
};

// Specialized upload for logos
const uploadLogo = (req, res, next) => {
  const uploader = useCloudinary
    ? uploadToCloudinary.single("logo")
    : uploadLocal.single("logo");
  uploader(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }
    next();
  });
};

module.exports = {
  upload,
  uploadLogo,
  uploadLocal,
  uploadToCloudinary,
};
