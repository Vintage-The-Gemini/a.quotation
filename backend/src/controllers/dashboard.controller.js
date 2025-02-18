const Quotation = require('../models/Quotation');
const { Item } = require('../models/Product');

exports.getStats = async (req, res) => {
    try {
        const businessId = req.user.businessId;

        // Get counts
        const [quotations, products, services] = await Promise.all([
            Quotation.find({ business: businessId }).populate('customer', 'name').sort('-createdAt').limit(5),
            Item.countDocuments({ businessId, type: 'product' }),
            Item.countDocuments({ businessId, type: 'service' })
        ]);

        res.json({
            success: true,
            data: {
                totalQuotations: quotations.length,
                totalProducts: products,
                totalServices: services,
                recentQuotations: quotations,
                activeQuotations: quotations.filter(q => q.status !== 'rejected').length
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats'
        });
    }
};