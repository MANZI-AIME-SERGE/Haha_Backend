const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['cash', 'mtn_mobile', 'airtel_money', 'card'],
    default: 'cash'
  },
  transactionId: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentProof: {
    type: String
  },
  paidAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.paidAt) {
    this.paidAt = Date.now();
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
