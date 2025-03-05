// backend/src/app.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/database");

// Load env vars first
dotenv.config();

// Create necessary directories for file operations
const setupDirectories = async () => {
  const dirs = [
    path.join(__dirname, "..", "temp"),
    path.join(__dirname, "..", "uploads"),
    path.join(__dirname, "..", "uploads/logos"),
    path.join(__dirname, "..", "uploads/documents"),
  ];

  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
};

// Set up directories
setupDirectories();

// Connect to database
connectDB();

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
  ], // Add your frontend URLs
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  exposedHeaders: ["Content-Disposition"],
};

// Apply CORS with options
app.use(cors(corsOptions));

// Security Middleware with relaxed settings for local development
app.use(
  helmet({
    contentSecurityPolicy: false, // Needed for displaying PDF in browser
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow loading resources
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Request logging in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require("./routes/auth.routes");
const itemRoutes = require("./routes/item.routes");
const quotationRoutes = require("./routes/quotation.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const templateRoutes = require("./routes/template.routes");
const businessRoutes = require("./routes/business.routes");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/business", businessRoutes);

// Serve static files - IMPORTANT FOR LOGO DISPLAY
// Use absolute paths and set proper headers
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    setHeaders: (res) => {
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      res.set("Access-Control-Allow-Origin", "*");
    },
  })
);

app.use(
  "/temp",
  express.static(path.join(__dirname, "..", "temp"), {
    setHeaders: (res) => {
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      res.set("Access-Control-Allow-Origin", "*");
    },
  })
);

// Debug endpoint to check paths
app.get("/api/debug/paths", (req, res) => {
  res.json({
    uploadDir: path.join(__dirname, "..", "uploads"),
    logosDir: path.join(__dirname, "..", "uploads", "logos"),
    exists: {
      uploadsDir: fs.existsSync(path.join(__dirname, "..", "uploads")),
      logosDir: fs.existsSync(path.join(__dirname, "..", "uploads", "logos")),
    },
    env: process.env.NODE_ENV,
    cwd: process.cwd(),
  });
});

// Direct access to logo endpoint for testing
app.get("/test-logo/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "..",
    "uploads",
    "logos",
    req.params.filename
  );
  console.log("Testing logo access at:", filePath);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Logo not found");
  }
});

// Basic route for testing
app.get("/api/status", (req, res) => {
  res.json({
    status: "success",
    message: "API is running",
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    storage: process.env.USE_CLOUDINARY === "true" ? "cloudinary" : "local",
  });
});

// Error handler middleware
const errorHandler = require("./middlewares/error.middleware");
app.use(errorHandler);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(
    `File storage: ${
      process.env.USE_CLOUDINARY === "true" ? "Cloudinary" : "Local storage"
    }`
  );
  console.log(`Uploads directory: ${path.join(__dirname, "..", "uploads")}`);
  console.log(`Static files URL: http://localhost:${PORT}/uploads`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
