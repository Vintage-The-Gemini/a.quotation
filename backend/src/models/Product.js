const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['VAT', 'Custom'],
    trim: true
  },
  rate: {
    type: Number,
    required: true,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [250, 'Description cannot be more than 250 characters']
  }
}, { 
  _id: false, // Prevents creating a separate _id for embedded documents
  timestamps: false 
});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['product', 'service'],
    default: 'product',
    lowercase: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'KES',
    uppercase: true,
    trim: true
  },
  tax: {
    type: taxSchema,
    default: null
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to calculate price with tax
itemSchema.virtual('priceWithTax').get(function() {
  if (!this.tax) return this.price;
  const taxAmount = this.price * (this.tax.rate / 100);
  return this.price + taxAmount;
});

// Validation middleware
itemSchema.pre('validate', function(next) {
  // Additional custom validations can be added here
  if (this.type === 'service' && this.tax && this.tax.name === 'VAT') {
    this.tax = null; // Services might have different tax rules
  }
  next();
});

const quotationItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number'
    }
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  tax: taxSchema,
  subtotal: {
    type: Number,
    get: function() {
      const baseTotal = this.quantity * this.unitPrice;
      const discountAmount = baseTotal * (this.discount / 100);
      const taxAmount = this.tax 
        ? baseTotal * (this.tax.rate / 100) 
        : 0;
      return baseTotal - discountAmount + taxAmount;
    }
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Ensure subtotal is calculated before save
quotationItemSchema.pre('save', function(next) {
  this.subtotal = this.get('subtotal');
  next();
});

// Optional: Create models if not created elsewhere
const Item = mongoose.model('Item', itemSchema);
const QuotationItem = mongoose.model('QuotationItem', quotationItemSchema);

module.exports = {
  Item,
  QuotationItem,
  itemSchema,
  quotationItemSchema
};