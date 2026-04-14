const mongoose = require('mongoose');

const supermarketSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add supermarket name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add description'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  location: {
    type: String,
    required: [true, 'Please add location']
  },
  phone: {
    type: String,
    required: [true, 'Please add phone number']
  },
  email: {
    type: String,
    required: [true, 'Please add email'],
    lowercase: true
  },
  logo: {
    type: String,
    default: '/uploads/supermarkets/default-logo.jpg'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Supermarket = mongoose.model('Supermarket', supermarketSchema);

module.exports = Supermarket;