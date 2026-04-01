const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI);

const products = [
  { name: "Coca-Cola 500ml", description: "Refreshing carbonated soft drink", price: 800, discount: 10, category: "Drinks", image: "/uploads/products/default-product.jpg", stock: 100, ratings: 4.5, numReviews: 128 },
  { name: "Fanta Orange 500ml", description: "Orange flavored carbonated soft drink", price: 800, discount: 5, category: "Drinks", image: "/uploads/products/default-product.jpg", stock: 85, ratings: 4.3, numReviews: 95 },
  { name: "Sprite 500ml", description: "Lemon-lime flavored carbonated soft drink", price: 800, discount: 0, category: "Drinks", image: "/uploads/products/default-product.jpg", stock: 120, ratings: 4.4, numReviews: 87 },
  { name: "Mineral Water 1L", description: "Pure natural mineral water", price: 500, discount: 0, category: "Drinks", image: "/uploads/products/default-product.jpg", stock: 200, ratings: 4.7, numReviews: 234 },
  { name: "White Bread 500g", description: "Freshly baked white bread", price: 1200, discount: 0, category: "Foods", image: "/uploads/products/default-product.jpg", stock: 50, ratings: 4.6, numReviews: 156 },
  { name: "Brown Bread 500g", description: "Healthy whole wheat bread", price: 1500, discount: 5, category: "Foods", image: "/uploads/products/default-product.jpg", stock: 45, ratings: 4.8, numReviews: 112 },
  { name: "Fresh Milk 1L", description: "Pasteurized fresh milk", price: 1800, discount: 0, category: "Foods", image: "/uploads/products/default-product.jpg", stock: 60, ratings: 4.9, numReviews: 289 },
  { name: "Cheese Slices 200g", description: "Cheddar cheese slices", price: 3500, discount: 10, category: "Foods", image: "/uploads/products/default-product.jpg", stock: 30, ratings: 4.5, numReviews: 67 },
  { name: "Toothpaste 100ml", description: "Fluoride toothpaste", price: 2500, discount: 5, category: "Hygiene", image: "/uploads/products/default-product.jpg", stock: 75, ratings: 4.6, numReviews: 234 },
  { name: "Shampoo 250ml", description: "Anti-dandruff shampoo", price: 4500, discount: 15, category: "Hygiene", image: "/uploads/products/default-product.jpg", stock: 45, ratings: 4.5, numReviews: 145 },
  { name: "Tomatoes 1kg", description: "Fresh ripe tomatoes", price: 1500, discount: 0, category: "Vegetables", image: "/uploads/products/default-product.jpg", stock: 100, ratings: 4.8, numReviews: 267 },
  { name: "Onions 1kg", description: "Fresh red onions", price: 1200, discount: 5, category: "Vegetables", image: "/uploads/products/default-product.jpg", stock: 120, ratings: 4.6, numReviews: 189 },
  { name: "Potatoes 1kg", description: "Fresh Irish potatoes", price: 1000, discount: 0, category: "Vegetables", image: "/uploads/products/default-product.jpg", stock: 200, ratings: 4.7, numReviews: 234 }
];

const seedDatabase = async () => {
  try {
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    
    const admin = await User.create({
      name: 'HAHA Supermarket',
      email: 'haha@gmail.com',
      password: 'Haha@supermarket12',
      role: 'admin',
      phone: '+250788888888',
      profileImage: '/uploads/profiles/default-profile.jpg'
    });
    
    await Product.insertMany(products);
    
    console.log('✅ Database seeded!');
    console.log('Admin: haha@gmail.com / Haha@supermarket12');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seedDatabase();