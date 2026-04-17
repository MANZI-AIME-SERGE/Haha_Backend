const express = require('express');
const { protect, vendor, admin } = require('../middleware/authMiddleware');
const upload = require('../config/upload');
const {
  addProduct,
  getProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin
} = require('../controllers/productController');

const router = express.Router();

// Public routes
router.get('/', getProducts);

// Admin routes (must be before /:id)
router.get('/admin/all', protect, admin, getAllProductsAdmin);

router.get('/:id', getProductById);

// Vendor routes
router.post('/', protect, vendor, upload.single('image'), addProduct);
router.get('/my-products/list', protect, vendor, getMyProducts);
router.put('/:id', protect, vendor, updateProduct);
router.delete('/:id', protect, vendor, deleteProduct);

module.exports = router;