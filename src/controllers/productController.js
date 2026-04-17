const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');

// @desc    Get all products for admin (including unapproved/unavailable)
// @route   GET /api/products/admin/all
// @access  Private/Admin
const getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('supermarketId', 'name location logo status ownerId');
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Add product (Vendor)
// @route   POST /api/products
// @access  Private/Vendor
const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    
    const supermarket = await Supermarket.findOne({ ownerId: req.user._id });
    if (!supermarket) {
      return res.status(400).json({ 
        success: false,
        message: 'Please register your supermarket first' 
      });
    }
    
    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock: stock || 0,
      supermarketId: supermarket._id,
      image: req.file ? `/uploads/products/${req.file.filename}` : '/uploads/products/default-product.jpg',
      isAvailable: (stock || 0) > 0
    });
    
    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get all products (Public)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, supermarketId, search } = req.query;
    let query = { isAvailable: true };
    
    const approvedSupermarkets = await Supermarket.find({ status: 'approved' }).select('_id');
    const approvedIds = approvedSupermarkets.map(s => s._id);
    query.supermarketId = { $in: approvedIds };
    
    if (category && category !== 'All') {
      query.category = category;
    }
    if (supermarketId) {
      query.supermarketId = supermarketId;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const products = await Product.find(query).populate('supermarketId', 'name location logo');
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('supermarketId', 'name location phone email');
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get my products (Vendor)
// @route   GET /api/products/my-products
// @access  Private/Vendor
const getMyProducts = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ ownerId: req.user._id });
    if (!supermarket) {
      return res.json({
        success: true,
        products: []
      });
    }
    
    const products = await Product.find({ supermarketId: supermarket._id });
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Update product (Vendor)
// @route   PUT /api/products/:id
// @access  Private/Vendor
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    const supermarket = await Supermarket.findOne({ ownerId: req.user._id });
    if (product.supermarketId.toString() !== supermarket._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this product' 
      });
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json({
      success: true,
      product: updatedProduct
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Delete product (Vendor)
// @route   DELETE /api/products/:id
// @access  Private/Vendor
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    const supermarket = await Supermarket.findOne({ ownerId: req.user._id });
    if (product.supermarketId.toString() !== supermarket._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this product' 
      });
    }
    
    await product.deleteOne();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  addProduct,
  getProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin
};