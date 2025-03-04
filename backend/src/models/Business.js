// backend/src/models/Business.js
const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a business name"],
      trim: true,
      maxlength: [50, "Name can not be more than 50 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description can not be more than 500 characters"],
    },
    logo: {
      url: String, // URL or local path
      public_id: String, // For Cloudinary
      isCloudinary: {
        type: Boolean,
        default: false,
      },
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
    },
    phone: {
      type: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    settings: {
      theme: {
        type: String,
        default: "default",
      },
      quotationPrefix: {
        type: String,
        default: "QT",
      },
      taxRate: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "USD",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Reverse populate with virtuals
businessSchema.virtual("users", {
  ref: "User",
  localField: "_id",
  foreignField: "businessId",
  justOne: false,
});

module.exports = mongoose.model("Business", businessSchema);
