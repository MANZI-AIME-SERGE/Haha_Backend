const express = require('express');
const { protect, vendor } = require('../middleware/authMiddleware');
const Order = require('../models/OrderModel');
const Product = require('../models/ProductModel');

const router = express.Router();

router.get('/stats', protect, vendor, async (req, res) => {
  try {
    const supermarket = req.user.supermarketId;
    if (!supermarket) {
      return res.status(400).json({ success: false, message: 'No supermarket found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayOrders,
      weekOrders,
      monthOrders,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      totalProducts,
      lowStockProducts,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments({ 
        'items.supermarketId': supermarket, 
        createdAt: { $gte: today, $lt: tomorrow } 
      }),
      Order.countDocuments({ 
        'items.supermarketId': supermarket, 
        createdAt: { $gte: weekAgo, $lt: tomorrow } 
      }),
      Order.countDocuments({ 
        'items.supermarketId': supermarket, 
        createdAt: { $gte: monthStart, $lt: tomorrow } 
      }),
      Order.aggregate([
        { $match: { 'items.supermarketId': supermarket, createdAt: { $gte: today, $lt: tomorrow } } },
        { $unwind: '$items' },
        { $match: { 'items.supermarketId': supermarket } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ]),
      Order.aggregate([
        { $match: { 'items.supermarketId': supermarket, createdAt: { $gte: weekAgo, $lt: tomorrow } } },
        { $unwind: '$items' },
        { $match: { 'items.supermarketId': supermarket } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ]),
      Order.aggregate([
        { $match: { 'items.supermarketId': supermarket, createdAt: { $gte: monthStart, $lt: tomorrow } } },
        { $unwind: '$items' },
        { $match: { 'items.supermarketId': supermarket } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ]),
      Product.countDocuments({ supermarketId: supermarket }),
      Product.countDocuments({ supermarketId: supermarket, stock: { $gt: 0, $lte: 5 } }),
      Order.find({ 'items.supermarketId': supermarket })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customerId', 'name')
    ]);

    res.json({
      success: true,
      stats: {
        orders: { today: todayOrders, week: weekOrders, month: monthOrders },
        revenue: { 
          today: todayRevenue[0]?.total || 0, 
          week: weekRevenue[0]?.total || 0, 
          month: monthRevenue[0]?.total || 0 
        },
        totalProducts,
        lowStockProducts,
        pendingOrders: weekOrders,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Vendor stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/sales', protect, vendor, async (req, res) => {
  try {
    const supermarket = req.user.supermarketId;
    const { period = 'monthly' } = req.query;
    
    let startDate = new Date();
    if (period === 'daily') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      'items.supermarketId': supermarket,
      createdAt: { $gte: startDate }
    });

    const salesByDay = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      order.items.filter(i => i.supermarketId.toString() === supermarket.toString()).forEach(item => {
        salesByDay[date] = (salesByDay[date] || 0) + (item.price * item.quantity);
      });
    });

    const salesData = Object.entries(salesByDay).map(([date, amount]) => ({
      day: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount
    })).sort((a, b) => new Date(a.day) - new Date(b.day));

    res.json({ success: true, sales: salesData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/top-products', protect, vendor, async (req, res) => {
  try {
    const supermarket = req.user.supermarketId;
    const { limit = 10 } = req.query;

    const productStats = await Order.aggregate([
      { $match: { 'items.supermarketId': supermarket } },
      { $unwind: '$items' },
      { $match: { 'items.supermarketId': supermarket } },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({ success: true, products: productStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stock', protect, vendor, async (req, res) => {
  try {
    const supermarket = req.user.supermarketId;

    const [inStock, lowStock, outOfStock] = await Promise.all([
      Product.countDocuments({ supermarketId: supermarket, stock: { $gt: 5 } }),
      Product.countDocuments({ supermarketId: supermarket, stock: { $gt: 0, $lte: 5 } }),
      Product.countDocuments({ supermarketId: supermarket, stock: 0 })
    ]);

    res.json({
      success: true,
      stock: { inStock, lowStock, outOfStock }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/orders-summary', protect, vendor, async (req, res) => {
  try {
    const supermarket = req.user.supermarketId;
    const { period = 'weekly' } = req.query;
    
    let days = 7;
    if (period === 'monthly') days = 30;
    else if (period === 'daily') days = 1;
    else if (period === 'yearly') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      'items.supermarketId': supermarket,
      createdAt: { $gte: startDate }
    });

    const ordersByDay = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      ordersByDay[date] = (ordersByDay[date] || 0) + 1;
    });

    const summaryData = Object.entries(ordersByDay).map(([date, count]) => ({
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      count
    })).sort((a, b) => new Date(a.day) - new Date(b.day));

    res.json({ success: true, orders: summaryData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
