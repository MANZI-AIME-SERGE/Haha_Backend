const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/authRoutes');
const supermarketRoutes = require('./routes/supermarketRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');

// Import middleware
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Ensure upload directories exist
const uploadDirs = ['uploads/products', 'uploads/supermarkets'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/supermarkets', supermarketRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'HAHA Platform API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'HAHA Platform API',
    version: '1.0.0',
    description: 'Multi-Supermarket Platform for Rwanda',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      supermarkets: {
        list: 'GET /api/supermarkets',
        detail: 'GET /api/supermarkets/:id',
        register: 'POST /api/supermarkets/register (Vendor)',
        mySupermarket: 'GET /api/supermarkets/my-supermarket/me (Vendor)',
        adminList: 'GET /api/supermarkets/admin/all (Admin)',
        updateStatus: 'PUT /api/supermarkets/:id/status (Admin)'
      },
      products: {
        list: 'GET /api/products',
        detail: 'GET /api/products/:id',
        create: 'POST /api/products (Vendor)',
        myProducts: 'GET /api/products/my-products/list (Vendor)',
        update: 'PUT /api/products/:id (Vendor)',
        delete: 'DELETE /api/products/:id (Vendor)'
      },
      orders: {
        create: 'POST /api/orders',
        myOrders: 'GET /api/orders/my-orders',
        vendorOrders: 'GET /api/orders/vendor-orders (Vendor)',
        allOrders: 'GET /api/orders/all (Admin)',
        updateStatus: 'PUT /api/orders/:id/status (Admin)'
      }
    }
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;