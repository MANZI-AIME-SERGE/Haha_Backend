const express = require('express');
const { protect, vendor, admin } = require('../middleware/authMiddleware');
const {
  createOrder,
  getMyOrders,
  getVendorOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById
} = require('../controllers/orderController');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.get('/vendor-orders', protect, vendor, getVendorOrders);
router.get('/all', protect, admin, getAllOrders);
router.put('/:id/status', protect, vendor, updateOrderStatus);

module.exports = router;