const Delivery = require('../models/DeliveryModel');
const Order = require('../models/OrderModel');
const User = require('../models/UserModel');

const generateTransactionId = () => {
  return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

const generateDeliveryId = () => {
  return 'DEL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

const calculateEstimatedTime = (distanceKm) => {
  const baseTime = 30;
  const timePerKm = 5;
  return new Date(Date.now() + (baseTime + distanceKm * timePerKm) * 60000);
};

const createDelivery = async (req, res) => {
  try {
    const { orderId, pickupAddress, deliveryAddress, customerPhone, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const fee = 500 + Math.floor(Math.random() * 500);
    const estimatedDelivery = calculateEstimatedTime(Math.random() * 10);

    const delivery = await Delivery.create({
      orderId,
      pickupAddress,
      deliveryAddress,
      customerPhone,
      notes,
      fee,
      estimatedDelivery
    });

    order.deliveryId = delivery._id;
    order.deliveryFee = fee;
    await order.save();

    res.status(201).json({
      success: true,
      delivery
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getDeliveryByOrder = async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ orderId: req.params.orderId });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    res.json({
      success: true,
      delivery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getVendorDeliveries = async (req, res) => {
  try {
    const supermarket = await require('../models/SupermarketModel').findOne({ ownerId: req.user._id });

    if (!supermarket) {
      return res.json({
        success: true,
        deliveries: []
      });
    }

    const orders = await Order.find({
      'items.supermarketId': supermarket._id,
      deliveryId: { $exists: true }
    }).populate('deliveryId');

    const deliveries = orders
      .filter(order => order.deliveryId)
      .map(order => ({
        ...order.deliveryId._doc,
        order: {
          _id: order._id,
          totalAmount: order.totalAmount,
          status: order.status,
          items: order.items.filter(item => item.supermarketId.toString() === supermarket._id.toString())
        }
      }));

    res.json({
      success: true,
      deliveries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getDriverDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      driverId: req.user._id
    }).populate('orderId').sort({ createdAt: -1 });

    res.json({
      success: true,
      deliveries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllDeliveries = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const deliveries = await Delivery.find(query)
      .populate('orderId')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Delivery.countDocuments(query);

    res.json({
      success: true,
      deliveries,
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

const assignDriver = async (req, res) => {
  try {
    const { driverId, driverName, driverPhone } = req.body;

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      {
        driverId,
        driverName,
        driverPhone,
        status: 'assigned'
      },
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    res.json({
      success: true,
      delivery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const updateData = { status };

    if (status === 'delivered') {
      updateData.actualDelivery = new Date();
    }

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    if (status === 'delivered') {
      const order = await Order.findById(delivery.orderId);
      if (order) {
        order.status = 'completed';
        await order.save();
      }
    }

    res.json({
      success: true,
      delivery
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await User.find({
      role: 'driver',
      isActive: true
    }).select('name phone location');

    res.json({
      success: true,
      drivers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createDelivery,
  getDeliveryByOrder,
  getVendorDeliveries,
  getDriverDeliveries,
  getAllDeliveries,
  assignDriver,
  updateDeliveryStatus,
  getAvailableDrivers
};
