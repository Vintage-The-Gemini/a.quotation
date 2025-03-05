// backend/src/middlewares/upload.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), "uploads");
const logosDir = path.join(uploadDir, "logos");

// Create directories synchronously to ensure they exist before uploads start
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created upload directory: ${uploadDir}`);
  } catch (err) {
    console.error(`Error creating upload directory: ${err.message}`);
  }
}

if (!fs.existsSync(logosDir)) {
  try {
    fs.mkdirSync(logosDir, { recursive: true });
    console.log(`Created logos directory: ${logosDir}`);
  } catch (err) {
    console.error(`Error creating logos directory: ${err.message}`);
  }
}

// Set file permissions to ensure they're readable by the web server
const setPermissions = (filePath) => {
  try {
    fs.chmodSync(filePath, 0o644); // rw-r--r--
    console.log(`Set permissions for: ${filePath}`);
  } catch (err) {
    console.error(`Error setting permissions for ${filePath}:`, err);
  }
};

// Configure local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "logo") {
      cb(null, logosDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = file.fieldname + "-" + uniqueSuffix + ext;

    console.log(`Generated filename: ${filename} for ${file.originalname}`);
    cb(null, filename);
  },
});

// File filter function
const fileFilter = function (req, file, cb) {
  console.log("Checking file type:", file.mimetype, file.originalname);

  if (file.fieldname === "logo") {
    // Allow only image files for logo
    const filetypes = /jpeg|jpg|png|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      console.log("File type accepted for logo");
      return cb(null, true);
    }
    console.error("Invalid file type for logo");
    return cb(
      new Error("Only .png, .jpg, .jpeg and .svg files are allowed for logos")
    );
  } else {
    // Default accept all files
    console.log("Accepting other file type");
    cb(null, true);
  }
};

// Create multer upload instance
const uploadLocal = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit by default
  },
  fileFilter: fileFilter,
});

// Logo upload middleware with better error handling
const uploadLogo = (req, res, next) => {
  console.log("Logo upload middleware triggered");

  uploadLocal.single("logo")(req, res, function (err) {
    if (err) {
      console.error("Logo upload error:", err);
      if (err instanceof multer.MulterError) {
        // A Multer error occurred
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File is too large. Maximum size is 5MB",
          });
        }
        return res.status(400).json({
          success: false,
          message: `Multer upload error: ${err.message}`,
        });
      }

      // For any other errors
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }

    if (!req.file) {
      console.warn("No file was uploaded");
      return res.status(400).json({
        success: false,
        message: "No file was uploaded",
      });
    }

    // Set readable permissions on the file
    setPermissions(req.file.path);

    // Add full URL to the file object for easier access
    req.file.fullPath = path.join(process.cwd(), req.file.path);
    req.file.publicUrl = `/uploads/logos/${req.file.filename}`;

    console.log("Logo uploaded successfully:", {
      filename: req.file.filename,
      path: req.file.path,
      fullPath: req.file.fullPath,
      publicUrl: req.file.publicUrl,
    });

    next();
  });
};

module.exports = {
  uploadLocal,
  uploadLogo,
};
