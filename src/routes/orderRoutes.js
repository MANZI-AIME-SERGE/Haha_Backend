const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus } = require('../controllers/orderController');

const router = express.Router();

router.route('/').post(protect, createOrder).get(protect, admin, getAllOrders);
router.get('/myorders', protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;