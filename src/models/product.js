const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be positive']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount must be positive'],
    max: [100, 'Discount cannot exceed 100%']
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
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  ratings: {
    type: Number,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

productSchema.virtual('discountedPrice').get(function() {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;