const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
    createItem,
    getItems,
    getItem,
    updateItem,
    deleteItem
} = require('../controllers/item.controller');

const router = express.Router();

// Apply protection middleware
router.use(protect);

// Routes without ID
router.route('/')
    .post(createItem)
    .get(getItems);

// Routes with ID
router.route('/:id')
    .get(getItem)
    .put(updateItem)
    .delete(deleteItem);

module.exports = router;