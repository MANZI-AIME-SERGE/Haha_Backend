const Order = require('../models/Order');
const Product = require('../models/Product');

const createOrder = async (req, res) => {
  try {
    const { items, paymentMethod, shippingAddress, notes } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No order items' 
      });
    }
    
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({ 
          success: false,
          message: `Product not found: ${item.productId}` 
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }
      
      const price = product.discount > 0 ? product.discountedPrice : product.price;
      const itemTotal = price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: price
      });
      
      product.stock -= item.quantity;
      product.isAvailable = product.stock > 0;
      await product.save();
    }
    
    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      totalAmount,
      paymentMethod: paymentMethod || 'Cash',
      shippingAddress: shippingAddress || {
        street: req.user.address?.street || '',
        city: req.user.address?.city || 'Kigali',
        country: req.user.address?.country || 'Rwanda'
      },
      notes: notes || ''
    });
    
    res.status(201).json({
      success: true,
      order
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

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone');
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view this order' 
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      orders,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    order.status = status;
    await order.save();
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const processingOrders = await Order.countDocuments({ status: 'Processing' });
    const completedOrders = await Order.countDocuments({ status: 'Completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
    
    const completedOrdersList = await Order.find({ status: 'Completed' });
    const totalRevenue = completedOrdersList.reduce((sum, order) => sum + order.totalAmount, 0);
    
    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
};