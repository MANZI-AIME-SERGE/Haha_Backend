const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add product name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add description'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add price'],
    min: [0, 'Price must be positive']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Drinks', 'Foods', 'Hygiene', 'Vegetables', 'Other']
  },
  image: {
    type: String,
    default: '/uploads/products/default-product.jpg'
  },
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  supermarketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supermarket',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;