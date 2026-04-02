const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    
    let query = {};
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    query.isAvailable = true;
    
    const skip = (page - 1) * limit;
    let sortOption = {};
    if (sort === 'price_asc') sortOption.price = 1;
    else if (sort === 'price_desc') sortOption.price = -1;
    else if (sort === 'newest') sortOption.createdAt = -1;
    else sortOption.createdAt = -1;
    
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(Number(limit))
      .skip(skip);
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      products,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
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
      message: 'Server error' 
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, discount, category, stock } = req.body;
    
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, description, price, category'
      });
    }
    
    let imagePath = '/uploads/products/default-product.jpg';
    if (req.file) {
      imagePath = `/uploads/products/${req.file.filename}`;
    }
    
    const product = await Product.create({
      name,
      description,
      price: Number(price),
      discount: discount ? Number(discount) : 0,
      category,
      image: imagePath,
      stock: stock ? Number(stock) : 0,
      isAvailable: Number(stock) > 0
    });
    
    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    if (req.file) {
      if (product.image && product.image !== '/uploads/products/default-product.jpg') {
        const oldImagePath = path.join(__dirname, '../../', product.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      req.body.image = `/uploads/products/${req.file.filename}`;
    }
    
    if (req.body.stock !== undefined) {
      req.body.isAvailable = Number(req.body.stock) > 0;
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      product: updatedProduct
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    if (product.image && product.image !== '/uploads/products/default-product.jpg') {
      const imagePath = path.join(__dirname, '../../', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await product.deleteOne();
    res.json({ 
      success: true,
      message: 'Product removed successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};