const Order = require('../models/Order');
const Product = require('../models/Product');

const createOrder = async (req, res) => {
  try {
    const { items, paymentMethod, shippingAddress, notes } = req.body;
    
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      
      const price = product.discount > 0 ? product.discountedPrice : product.price;
      totalAmount += price * item.quantity;
      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: price
      });
      
      product.stock -= item.quantity;
      await product.save();
    }
    
    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      totalAmount,
      paymentMethod,
      shippingAddress,
      notes
    });
    
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = {};
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    const orders = await Order.find(query).populate('userId', 'name email').sort({ createdAt: -1 }).limit(Number(limit)).skip(skip);
    const total = await Order.countDocuments(query);
    
    res.json({ orders, page: Number(page), pages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    order.status = status;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus };