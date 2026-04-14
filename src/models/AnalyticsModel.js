const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalProducts: {
    type: Number,
    default: 0
  },
  totalCustomers: {
    type: Number,
    default: 0
  },
  totalVendors: {
    type: Number,
    default: 0
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  completedDeliveries: {
    type: Number,
    default: 0
  },
  pendingDeliveries: {
    type: Number,
    default: 0
  },
  cancelledOrders: {
    type: Number,
    default: 0
  },
  categoryBreakdown: {
    type: Map,
    of: Number,
    default: {}
  },
  topProducts: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    count: Number,
    revenue: Number
  }],
  topSupermarkets: [{
    supermarketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supermarket' },
    name: String,
    orderCount: Number,
    revenue: Number
  }],
  revenueByDay: [{
    day: String,
    amount: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

analyticsSchema.index({ type: 1, date: 1 }, { unique: true });

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
