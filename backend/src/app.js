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

// Ensure temp directory exists for file operations
const tempDir = path.join(__dirname, "..", "temp");

// Create temp directory if it doesn't exist
try {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log("Created temp directory:", tempDir);
  }
} catch (error) {
  console.error("Error creating temp directory:", error);
}

// Connect to database
connectDB();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

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

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Serve temp files (for PDF downloads, etc.)
app.use("/temp", express.static(path.join(__dirname, "..", "temp")));

// Basic route for testing
app.get("/api/status", (req, res) => {
  res.json({
    status: "success",
    message: "API is running",
    timestamp: new Date(),
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
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
