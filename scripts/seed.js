const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/haha_supermarket';

const products = [
  { name: "Coca-Cola 500ml", description: "Refreshing carbonated soft drink", price: 800, discount: 10, category: "Drinks", stock: 100, ratings: 4.5, numReviews: 128 },
  { name: "Fanta Orange 500ml", description: "Orange flavored carbonated soft drink", price: 800, discount: 5, category: "Drinks", stock: 85, ratings: 4.3, numReviews: 95 },
  { name: "Sprite 500ml", description: "Lemon-lime flavored carbonated soft drink", price: 800, discount: 0, category: "Drinks", stock: 120, ratings: 4.4, numReviews: 87 },
  { name: "Mineral Water 1L", description: "Pure natural mineral water", price: 500, discount: 0, category: "Drinks", stock: 200, ratings: 4.7, numReviews: 234 },
  { name: "White Bread 500g", description: "Freshly baked white bread", price: 1200, discount: 0, category: "Foods", stock: 50, ratings: 4.6, numReviews: 156 },
  { name: "Brown Bread 500g", description: "Healthy whole wheat bread", price: 1500, discount: 5, category: "Foods", stock: 45, ratings: 4.8, numReviews: 112 },
  { name: "Fresh Milk 1L", description: "Pasteurized fresh milk", price: 1800, discount: 0, category: "Foods", stock: 60, ratings: 4.9, numReviews: 289 },
  { name: "Cheese Slices 200g", description: "Cheddar cheese slices", price: 3500, discount: 10, category: "Foods", stock: 30, ratings: 4.5, numReviews: 67 },
  { name: "Toothpaste 100ml", description: "Fluoride toothpaste", price: 2500, discount: 5, category: "Hygiene", stock: 75, ratings: 4.6, numReviews: 234 },
  { name: "Shampoo 250ml", description: "Anti-dandruff shampoo", price: 4500, discount: 15, category: "Hygiene", stock: 45, ratings: 4.5, numReviews: 145 },
  { name: "Tomatoes 1kg", description: "Fresh ripe tomatoes", price: 1500, discount: 0, category: "Vegetables", stock: 100, ratings: 4.8, numReviews: 267 },
  { name: "Onions 1kg", description: "Fresh red onions", price: 1200, discount: 5, category: "Vegetables", stock: 120, ratings: 4.6, numReviews: 189 },
  { name: "Potatoes 1kg", description: "Fresh Irish potatoes", price: 1000, discount: 0, category: "Vegetables", stock: 200, ratings: 4.7, numReviews: 234 },
  { name: "Carrots 1kg", description: "Fresh orange carrots", price: 1800, discount: 10, category: "Vegetables", stock: 90, ratings: 4.9, numReviews: 198 }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 SEEDING DATABASE');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    console.log('Cleared existing data');

    const adminPassword = await bcrypt.hash('Haha@supermarket12', 10);
    const admin = await User.create({
      name: 'HAHA Supermarket',
      email: 'haha@gmail.com',
      password: adminPassword,
      role: 'admin',
      phone: '+250788888888',
      profileImage: '/uploads/profiles/default-profile.jpg',
      isActive: true
    });

    const customerPassword = await bcrypt.hash('password123', 10);
    const customers = await User.insertMany([
      {
        name: 'GIKUNDIRO Annick',
        email: 'annick@example.com',
        password: customerPassword,
        role: 'customer',
        phone: '+250788123456',
        profileImage: '/uploads/profiles/default-profile.jpg',
        isActive: true,
        address: { street: 'KG 123 St', city: 'Kigali', country: 'Rwanda' }
      },
      {
        name: 'MANZI Aime Serge',
        email: 'aimeserge13@gmail.com',
        password: customerPassword,
        role: 'customer',
        phone: '+250788654321',
        profileImage: '/uploads/profiles/default-profile.jpg',
        isActive: true,
        address: { street: 'KN 456 Ave', city: 'Kigali', country: 'Rwanda' }
      }
    ]);

    const insertedProducts = await Product.insertMany(products);

    const sampleOrder = await Order.create({
      userId: customers[0]._id,
      items: [
        { productId: insertedProducts[0]._id, name: insertedProducts[0].name, quantity: 2, price: insertedProducts[0].price * (1 - insertedProducts[0].discount / 100) },
        { productId: insertedProducts[4]._id, name: insertedProducts[4].name, quantity: 1, price: insertedProducts[4].price * (1 - insertedProducts[4].discount / 100) }
      ],
      totalAmount: (insertedProducts[0].price * (1 - insertedProducts[0].discount / 100) * 2) + (insertedProducts[4].price * (1 - insertedProducts[4].discount / 100)),
      status: 'Completed',
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      completedAt: new Date()
    });

    console.log('🎉 DATABASE SEEDING COMPLETED!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();