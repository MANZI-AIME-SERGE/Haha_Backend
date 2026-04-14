const express = require('express');
const { protect, vendor, admin } = require('../middleware/authMiddleware');
const {
  createDelivery,
  getDeliveryByOrder,
  getVendorDeliveries,
  getDriverDeliveries,
  getAllDeliveries,
  assignDriver,
  updateDeliveryStatus,
  getAvailableDrivers
} = require('../controllers/deliveryController');

const router = express.Router();

router.post('/', protect, createDelivery);
router.get('/order/:orderId', protect, getDeliveryByOrder);
router.get('/vendor', protect, vendor, getVendorDeliveries);
router.get('/driver', protect, getDriverDeliveries);
router.get('/drivers', protect, admin, getAvailableDrivers);
router.get('/all', protect, admin, getAllDeliveries);
router.put('/:id/assign', protect, admin, assignDriver);
router.put('/:id/status', protect, updateDeliveryStatus);

module.exports = router;
