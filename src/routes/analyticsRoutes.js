const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getAnalytics,
  getSalesReport,
  getTopProducts,
  getTopSupermarkets
} = require('../controllers/analyticsController');

const router = express.Router();

router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/', protect, admin, getAnalytics);
router.get('/sales', protect, admin, getSalesReport);
router.get('/top-products', protect, admin, getTopProducts);
router.get('/top-supermarkets', protect, admin, getTopSupermarkets);

module.exports = router;
