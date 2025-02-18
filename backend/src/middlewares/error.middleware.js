const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map((error) => error.message)
        .join(", "),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  if (err.code === "ENOENT") {
    return res.status(500).json({
      success: false,
      message: "Failed to generate PDF: File system error",
    });
  }

  // Add detailed error information in development
  const error = {
    success: false,
    message: err.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  };

  res.status(err.status || 500).json(error);
};

module.exports = errorHandler;
