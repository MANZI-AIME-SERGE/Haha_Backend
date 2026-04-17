const Supermarket = require('../models/SupermarketModel');
const Product = require('../models/ProductModel');
const Order = require('../models/OrderModel');

// @desc    Register supermarket (Vendor)
// @route   POST /api/supermarkets/register
// @access  Private/Vendor
const registerSupermarket = async (req, res) => {
  try {
    const { name, description, location, phone, email } = req.body;
    
    const existing = await Supermarket.findOne({ ownerId: req.user._id });
    if (existing) {
      return res.status(400).json({ 
        success: false,
        message: 'You already have a registered supermarket' 
      });
    }
    
    const supermarket = await Supermarket.create({
      name,
      description,
      location,
      phone,
      email,
      ownerId: req.user._id,
      logo: req.file ? `/uploads/supermarkets/${req.file.filename}` : '/uploads/supermarkets/default-logo.jpg'
    });
    
    res.status(201).json({
      success: true,
      supermarket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get all approved supermarkets (Public)
// @route   GET /api/supermarkets
// @access  Public
const getSupermarkets = async (req, res) => {
  try {
    const supermarkets = await Supermarket.find({ 
      status: 'approved', 
      isActive: true 
    }).populate('ownerId', 'name email');
    
    res.json({
      success: true,
      supermarkets
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get supermarket by ID
// @route   GET /api/supermarkets/:id
// @access  Public
const getSupermarketById = async (req, res) => {
  try {
    const supermarket = await Supermarket.findById(req.params.id).populate('ownerId', 'name email');
    
    if (!supermarket) {
      return res.status(404).json({ 
        success: false,
        message: 'Supermarket not found' 
      });
    }
    
    res.json({
      success: true,
      supermarket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get my supermarket (Vendor)
// @route   GET /api/supermarkets/my-supermarket
// @access  Private/Vendor
const getMySupermarket = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ ownerId: req.user._id });
    
    if (!supermarket) {
      return res.status(404).json({ 
        success: false,
        message: 'No supermarket found. Please register first.' 
      });
    }
    
    res.json({
      success: true,
      supermarket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get all supermarkets (Admin)
// @route   GET /api/supermarkets/admin/all
// @access  Private/Admin
const getAllSupermarkets = async (req, res) => {
  try {
    const supermarkets = await Supermarket.find().populate('ownerId', 'name email');
    
    res.json({
      success: true,
      supermarkets
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Update supermarket status (Admin)
// @route   PUT /api/supermarkets/:id/status
// @access  Private/Admin
const updateSupermarketStatus = async (req, res) => {
  try {
    const { status, isActive } = req.body;
    const updateData = {};
    
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const supermarket = await Supermarket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!supermarket) {
      return res.status(404).json({ 
        success: false,
        message: 'Supermarket not found' 
      });
    }
    
    res.json({
      success: true,
      supermarket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Delete supermarket (Admin)
// @route   DELETE /api/supermarkets/:id
// @access  Private/Admin
const deleteSupermarket = async (req, res) => {
  try {
    const supermarket = await Supermarket.findById(req.params.id);
    
    if (!supermarket) {
      return res.status(404).json({ 
        success: false,
        message: 'Supermarket not found' 
      });
    }

    await Product.deleteMany({ supermarketId: req.params.id });
    
    await Order.deleteMany({ 'items.supermarketId': req.params.id });
    
    await Supermarket.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Supermarket and all related data deleted successfully'
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
  registerSupermarket,
  getSupermarkets,
  getSupermarketById,
  getMySupermarket,
  getAllSupermarkets,
  updateSupermarketStatus,
  deleteSupermarket
};