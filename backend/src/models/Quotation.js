const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity cannot be less than 1']
    },
    unitPrice: {
        type: Number,
        required: true,
        min: [0, 'Unit price cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    tax: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
});

const quotationSchema = new mongoose.Schema({
    quotationNumber: {
        type: String,
        required: true,
        unique: true
    },
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    customer: {
        name: {
            type: String,
            required: [true, 'Customer name is required']
        },
        email: String,
        phone: String,
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String
        }
    },
    items: [quotationItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    taxTotal: {
        type: Number,
        default: 0,
        min: 0
    },
    discountTotal: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
        default: 'draft'
    },
    currency: {
        type: String,
        default: 'KES',
        uppercase: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    notes: String,
    terms: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Static method to generate quotation number
// Static method to generate quotation number
quotationSchema.statics.generateQuotationNumber = async function(businessId) {
    try {
        // Find the highest quotation number for this business
        const lastQuotation = await this.findOne(
            { business: businessId },
            { quotationNumber: 1 },
            { sort: { quotationNumber: -1 } }
        );

        let nextNumber = 1;
        if (lastQuotation && lastQuotation.quotationNumber) {
            // Extract the number from the last quotation number
            const lastNumber = parseInt(lastQuotation.quotationNumber.split('-')[1]);
            nextNumber = lastNumber + 1;
        }

        // Generate new quotation number with padding
        const newQuotationNumber = `QT-${String(nextNumber).padStart(4, '0')}`;

        // Verify this number doesn't exist (extra safety check)
        const exists = await this.findOne({ 
            business: businessId, 
            quotationNumber: newQuotationNumber 
        });

        if (exists) {
            // If somehow the number exists, recursively try the next number
            return this.generateQuotationNumber(businessId);
        }

        return newQuotationNumber;
    } catch (error) {
        throw new Error('Failed to generate quotation number: ' + error.message);
    }
};
// Calculate totals before saving
// Calculate totals and handle quotation number generation before saving
quotationSchema.pre('save', async function(next) {
    try {
        // Generate quotation number for new documents
        if (this.isNew) {
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
                try {
                    this.quotationNumber = await this.constructor.generateQuotationNumber(this.business);
                    break;
                } catch (error) {
                    attempts++;
                    if (attempts === maxAttempts) {
                        throw new Error('Failed to generate unique quotation number after multiple attempts');
                    }
                    // Add a small random delay before retrying
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
                }
            }
        }

        // Calculate totals if items exist
        if (this.items && this.items.length > 0) {
            let subtotal = 0;
            let taxTotal = 0;
            let discountTotal = 0;

            this.items.forEach(item => {
                const itemTotal = item.quantity * item.unitPrice;
                const itemDiscount = (itemTotal * item.discount) / 100;
                const subtotalAfterDiscount = itemTotal - itemDiscount;
                const itemTax = (subtotalAfterDiscount * item.tax) / 100;

                subtotal += subtotalAfterDiscount;
                taxTotal += itemTax;
                discountTotal += itemDiscount;
            });

            this.subtotal = subtotal;
            this.taxTotal = taxTotal;
            this.discountTotal = discountTotal;
            this.total = subtotal + taxTotal;
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Virtual for total items
quotationSchema.virtual('itemCount').get(function() {
    return this.items ? this.items.length : 0;
});

// Virtual for days until expiry
quotationSchema.virtual('daysUntilExpiry').get(function() {
    if (!this.validUntil) return 0;
    const now = new Date();
    const diffTime = this.validUntil - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Add virtuals when converting to JSON
quotationSchema.set('toJSON', { virtuals: true });
quotationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Quotation', quotationSchema);