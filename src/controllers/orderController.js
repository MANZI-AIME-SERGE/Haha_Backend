const Order = require('../models/OrderModel');
const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const Delivery = require('../models/DeliveryModel');

const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order'
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
          message: `${product.name} has insufficient stock. Available: ${product.stock}`
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        supermarketId: product.supermarketId
      });

      product.stock -= item.quantity;
      product.isAvailable = product.stock > 0;
      await product.save();
    }

    const deliveryFee = 500 + Math.floor(Math.random() * 500);
    const grandTotal = totalAmount + deliveryFee;

    const order = await Order.create({
      customerId: req.user._id,
      items: orderItems,
      totalAmount,
      deliveryFee,
      grandTotal,
      deliveryAddress,
      paymentMethod: paymentMethod || 'cash',
      notes
    });

    const supermarket = await Supermarket.findById(orderItems[0].supermarketId);
    const pickupAddress = supermarket ? `${supermarket.name}, ${supermarket.location}` : 'Store pickup';

    const delivery = await Delivery.create({
      orderId: order._id,
      pickupAddress,
      deliveryAddress: `${deliveryAddress.street}, ${deliveryAddress.district}, ${deliveryAddress.city}`,
      customerPhone: deliveryAddress.phone,
      fee: deliveryFee,
      status: 'pending'
    });

    order.deliveryId = delivery._id;
    await order.save();

    res.status(201).json({
      success: true,
      order,
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

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate('deliveryId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getVendorOrders = async (req, res) => {
  try {
    const supermarket = await Supermarket.findOne({ ownerId: req.user._id });
    if (!supermarket) {
      return res.json({
        success: true,
        orders: []
      });
    }

    const orders = await Order.find({
      'items.supermarketId': supermarket._id
    })
      .populate('customerId', 'name phone location')
      .populate('deliveryId')
      .sort({ createdAt: -1 });

    const filteredOrders = orders.map(order => ({
      ...order._doc,
      items: order.items.filter(item => item.supermarketId.toString() === supermarket._id.toString())
    }));

    res.json({
      success: true,
      orders: filteredOrders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('customerId', 'name email phone')
      .populate('deliveryId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
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

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('deliveryId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (status === 'delivered' || status === 'completed') {
      if (order.deliveryId) {
        await Delivery.findByIdAndUpdate(order.deliveryId._id, {
          status: 'delivered',
          actualDelivery: new Date()
        });
      }
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone location')
      .populate('items.productId')
      .populate('deliveryId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getVendorOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById
};
