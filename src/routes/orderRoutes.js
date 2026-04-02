const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
} = require('../controllers/orderController');

const router = express.Router();

// Protected routes (authenticated users)
router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

// Admin only routes
router.get('/', protect, admin, getAllOrders);
router.get('/stats/overview', protect, admin, getOrderStats);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;