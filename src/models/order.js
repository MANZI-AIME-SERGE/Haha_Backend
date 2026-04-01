const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Mobile Money'],
    default: 'Cash'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  shippingAddress: {
    street: String,
    city: String,
    country: String
  },
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

orderSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Completed') {
    this.completedAt = new Date();
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;