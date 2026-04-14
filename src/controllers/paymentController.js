const Payment = require('../models/PaymentModel');
const Order = require('../models/OrderModel');

const generateTransactionId = () => {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

const processDemoPayment = async (paymentData) => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const success = Math.random() > 0.1;

  return {
    success,
    transactionId: generateTransactionId(),
    message: success ? 'Payment successful' : 'Payment failed - Insufficient funds',
    timestamp: new Date().toISOString()
  };
};

const initiatePayment = async (req, res) => {
  try {
    const { orderId, method, phoneNumber, amount, deliveryFee } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const existingPayment = await Payment.findOne({ orderId, status: 'completed' });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Order already paid'
      });
    }

    const totalAmount = amount + (deliveryFee || 0);

    let payment = await Payment.findOne({ orderId });
    if (payment) {
      payment.method = method;
      payment.phoneNumber = phoneNumber;
      payment.amount = amount;
      payment.deliveryFee = deliveryFee || 0;
      payment.totalAmount = totalAmount;
      payment.status = 'pending';
      await payment.save();
    } else {
      payment = await Payment.create({
        orderId,
        customerId: req.user._id,
        method,
        phoneNumber,
        amount,
        deliveryFee: deliveryFee || 0,
        totalAmount
      });
    }

    const demoResult = await processDemoPayment({
      amount: totalAmount,
      method,
      phoneNumber
    });

    if (demoResult.success) {
      payment.status = 'completed';
      payment.transactionId = demoResult.transactionId;
      payment.paidAt = new Date();
      await payment.save();

      order.paymentStatus = 'paid';
      order.paymentId = payment._id;
      await order.save();
    }

    res.json({
      success: demoResult.success,
      payment: {
        _id: payment._id,
        status: payment.status,
        transactionId: payment.transactionId,
        totalAmount: payment.totalAmount
      },
      message: demoResult.message
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findOne({ transactionId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment: {
        _id: payment._id,
        status: payment.status,
        amount: payment.totalAmount,
        method: payment.method,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getPaymentByOrder = async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getCustomerPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ customerId: req.user._id })
      .populate('orderId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const { status, method, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (method) query.method = method;

    const payments = await Payment.find(query)
      .populate('customerId', 'name email')
      .populate('orderId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    const stats = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      payments,
      stats: stats[0] || { totalRevenue: 0, count: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    payment.status = 'refunded';
    await payment.save();

    const order = await Order.findById(payment.orderId);
    if (order) {
      order.paymentStatus = 'refunded';
      await order.save();
    }

    res.json({
      success: true,
      message: 'Payment refunded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  getPaymentByOrder,
  getCustomerPayments,
  getAllPayments,
  refundPayment
};
