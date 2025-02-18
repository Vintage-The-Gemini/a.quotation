// models/Template.js
const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a template name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['quotation', 'invoice'],
    default: 'quotation'
  },
  layout: {
    type: String,
    enum: ['modern', 'classic', 'professional', 'minimal'],
    default: 'modern'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  style: {
    primaryColor: {
      type: String,
      default: '#1a73e8'
    },
    fontFamily: {
      type: String,
      default: 'Arial'
    },
    fontSize: {
      type: String,
      default: '12px'
    }
  },
  sections: {
    header: {
      showLogo: { type: Boolean, default: true },
      showBusinessInfo: { type: Boolean, default: true },
      showQuotationNumber: { type: Boolean, default: true }
    },
    customerInfo: {
      position: { type: String, enum: ['left', 'right'], default: 'left' },
      fields: [{
        name: String,
        isVisible: { type: Boolean, default: true }
      }]
    },
    itemTable: {
      columns: [{
        name: String,
        label: String,
        isVisible: { type: Boolean, default: true }
      }]
    },
    footer: {
      showTerms: { type: Boolean, default: true },
      showSignature: { type: Boolean, default: true },
      customText: String
    }
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure only one default template per business
templateSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { 
        businessId: this.businessId, 
        _id: { $ne: this._id },
        type: this.type 
      },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Template', templateSchema);