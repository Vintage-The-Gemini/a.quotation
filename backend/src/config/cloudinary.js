// backend/src/config/cloudinary.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup storage engine for multer
const logoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "quotation-app/logos",
    allowed_formats: ["jpg", "jpeg", "png", "svg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

// Create multer upload instance for Cloudinary
const uploadToCloudinary = multer({
  storage: logoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
