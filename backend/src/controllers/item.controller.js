const { Item, Product, Service } = require('../models/Product');

// Define all the controller functions first
const createItem = async (req, res) => {
    try {
        const { name, type, price, category, description, unit, stockTracking, currentStock, tax } = req.body;

        // Basic validation
        if (!name || !type || !price || !category) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, type, price and category'
            });
        }

        // Create item with business reference
        const item = await Item.create({
            name,
            type,
            price: Number(price),
            category,
            description,
            unit: unit || 'piece',
            stockTracking: Boolean(stockTracking),
            currentStock: currentStock ? Number(currentStock) : 0,
            tax: tax || { name: 'VAT', rate: 16 },
            businessId: req.user.businessId,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Create item error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getItems = async (req, res) => {
    try {
        const { category, type, search, sort, isActive } = req.query;
        const query = { businessId: req.user.businessId };

        // Add filters
        if (category) {
            query.category = category;
        }
        if (type) {
            query.type = type;
        }
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        let items = Item.find(query);

        // Sort
        if (sort) {
            const sortOrder = sort.startsWith('-') ? -1 : 1;
            const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
            items = items.sort({ [sortField]: sortOrder });
        } else {
            items = items.sort('-createdAt');
        }

        const results = await items;

        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getItem = async (req, res) => {
    try {
        const item = await Item.findOne({
            _id: req.params.id,
            businessId: req.user.businessId
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateItem = async (req, res) => {
    try {
        let item = await Item.findOne({
            _id: req.params.id,
            businessId: req.user.businessId
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        item = await Item.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteItem = async (req, res) => {
    try {
        const item = await Item.findOne({
            _id: req.params.id,
            businessId: req.user.businessId
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        await item.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Export all controller functions
module.exports = {
    createItem,
    getItems,
    getItem,
    updateItem,
    deleteItem
};