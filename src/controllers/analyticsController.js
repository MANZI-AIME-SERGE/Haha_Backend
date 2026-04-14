const Analytics = require('../models/AnalyticsModel');
const Order = require('../models/OrderModel');
const Product = require('../models/ProductModel');
const User = require('../models/UserModel');
const Supermarket = require('../models/SupermarketModel');
const Delivery = require('../models/DeliveryModel');

const generateAnalytics = async (type) => {
  const now = new Date();
  let startDate, endDate;

  switch (type) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      break;
    case 'weekly':
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
      break;
    default:
      return null;
  }

  const dateStr = startDate.toISOString().split('T')[0];

  const existing = await Analytics.findOne({ type, date: { $gte: startDate, $lt: endDate } });
  if (existing) return existing;

  const orders = await Order.find({
    createdAt: { $gte: startDate, $lt: endDate }
  });

  const deliveries = await Delivery.find({
    createdAt: { $gte: startDate, $lt: endDate }
  });

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  const completedDeliveries = deliveries.filter(d => d.status === 'delivered').length;
  const pendingDeliveries = deliveries.filter(d => ['pending', 'assigned', 'picked_up', 'in_transit'].includes(d.status)).length;

  const categoryBreakdown = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const product = item.name;
      const category = item.name.split(' ')[0];
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });
  });

  const productCounts = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const key = item.productId.toString();
      if (!productCounts[key]) {
        productCounts[key] = { count: 0, revenue: 0, name: item.name };
      }
      productCounts[key].count += item.quantity;
      productCounts[key].revenue += item.price * item.quantity;
    });
  });

  const topProducts = Object.entries(productCounts)
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const supermarketCounts = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const key = item.supermarketId.toString();
      if (!supermarketCounts[key]) {
        supermarketCounts[key] = { orderCount: 0, revenue: 0 };
      }
      supermarketCounts[key].orderCount += 1;
      supermarketCounts[key].revenue += item.price * item.quantity;
    });
  });

  let topSupermarkets = [];
  for (const [supermarketId, data] of Object.entries(supermarketCounts)) {
    const supermarket = await Supermarket.findById(supermarketId);
    if (supermarket) {
      topSupermarkets.push({
        supermarketId,
        name: supermarket.name,
        ...data
      });
    }
  }
  topSupermarkets = topSupermarkets.sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const revenueByDay = [];
  if (type === 'monthly' || type === 'weekly') {
    const days = type === 'monthly' ? endDate.getDate() : 7;
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(startDate.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayOrders = orders.filter(o =>
        o.createdAt >= dayStart && o.createdAt < dayEnd
      );
      const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      revenueByDay.push({
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        amount: dayRevenue
      });
    }
  }

  const analytics = await Analytics.create({
    type,
    date: startDate,
    totalOrders,
    totalRevenue,
    totalProducts: await Product.countDocuments(),
    totalCustomers: await User.countDocuments({ role: 'customer' }),
    totalVendors: await Supermarket.countDocuments({ status: 'approved' }),
    totalDeliveries: deliveries.length,
    completedDeliveries,
    pendingDeliveries,
    cancelledOrders,
    categoryBreakdown,
    topProducts,
    topSupermarkets,
    revenueByDay
  });

  return analytics;
};

const getDashboardStats = async (req, res) => {
  try {
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
      totalCustomers,
      totalProducts,
      approvedSupermarkets,
      pendingDeliveries,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Order.countDocuments({ createdAt: { $gte: weekAgo, $lt: tomorrow } }),
      Order.countDocuments({ createdAt: { $gte: monthStart, $lt: tomorrow } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: weekAgo, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: monthStart, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Supermarket.countDocuments({ status: 'approved' }),
      Delivery.countDocuments({ status: { $in: ['pending', 'assigned', 'picked_up', 'in_transit'] } }),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('customerId', 'name')
    ]);

    res.json({
      success: true,
      stats: {
        orders: {
          today: todayOrders,
          week: weekOrders,
          month: monthOrders
        },
        revenue: {
          today: todayRevenue[0]?.total || 0,
          week: weekRevenue[0]?.total || 0,
          month: monthRevenue[0]?.total || 0
        },
        customers: totalCustomers,
        products: totalProducts,
        supermarkets: approvedSupermarkets,
        pendingDeliveries,
        recentOrders
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { type = 'monthly' } = req.query;

    const analytics = await generateAnalytics(type);

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query).populate('customerId', 'name email');

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByStatus = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0
    };
    orders.forEach(o => {
      if (ordersByStatus.hasOwnProperty(o.status)) {
        ordersByStatus[o.status]++;
      }
    });

    const revenueByDate = {};
    orders.forEach(o => {
      const date = o.createdAt.toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + o.totalAmount;
    });

    res.json({
      success: true,
      report: {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        ordersByStatus,
        revenueByDate,
        orders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const productStats = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      products: productStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getTopSupermarkets = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const supermarketStats = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.supermarketId',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalProducts: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'supermarkets',
          localField: '_id',
          foreignField: '_id',
          as: 'supermarket'
        }
      },
      { $unwind: '$supermarket' },
      {
        $project: {
          _id: 1,
          name: '$supermarket.name',
          location: '$supermarket.location',
          totalOrders: 1,
          totalRevenue: 1,
          totalProducts: 1
        }
      }
    ]);

    res.json({
      success: true,
      supermarkets: supermarketStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getAnalytics,
  getSalesReport,
  getTopProducts,
  getTopSupermarkets
};
