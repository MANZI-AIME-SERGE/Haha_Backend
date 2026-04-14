const express = require('express');
const { protect, admin, vendor } = require('../middleware/authMiddleware');
const upload = require('../config/upload');
const {
  registerSupermarket,
  getSupermarkets,
  getSupermarketById,
  getMySupermarket,
  getAllSupermarkets,
  updateSupermarketStatus
} = require('../controllers/supermarketController');

const router = express.Router();

// Public routes
router.get('/', getSupermarkets);
router.get('/:id', getSupermarketById);

// Vendor routes
router.post('/register', protect, vendor, upload.single('logo'), registerSupermarket);
router.get('/my-supermarket/me', protect, vendor, getMySupermarket);

// Admin routes
router.get('/admin/all', protect, admin, getAllSupermarkets);
router.put('/:id/status', protect, admin, updateSupermarketStatus);

module.exports = router;