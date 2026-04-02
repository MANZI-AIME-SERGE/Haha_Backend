const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');

// Import middleware
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Ensure upload directories exist
const uploadDirs = ['uploads/products', 'uploads/profiles', 'uploads/others'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    status: 'OK', 
    message: 'HAHA Supermarket API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'HAHA Supermarket API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout'
      },
      products: {
        list: 'GET /api/products',
        detail: 'GET /api/products/:id',
        create: 'POST /api/products (Admin)',
        update: 'PUT /api/products/:id (Admin)',
        delete: 'DELETE /api/products/:id (Admin)'
      },
      orders: {
        create: 'POST /api/orders',
        myOrders: 'GET /api/orders/myorders',
        detail: 'GET /api/orders/:id',
        allOrders: 'GET /api/orders (Admin)',
        updateStatus: 'PUT /api/orders/:id/status (Admin)',
        stats: 'GET /api/orders/stats/overview (Admin)'
      },
      users: {
        list: 'GET /api/users (Admin)',
        detail: 'GET /api/users/:id (Admin)',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id (Admin)',
        stats: 'GET /api/users/dashboard/stats (Admin)',
        uploadImage: 'POST /api/users/upload-profile-image'
      }
    }
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

module.exports = app;