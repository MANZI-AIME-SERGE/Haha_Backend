const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
dotenv.config();

//=======CONNECTION TO DB==========
connectDB();

const app = require('./src/app');
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on the Port: http://localhost:${PORT}/api`);
});

//=========HANDLE UNHANDLED PROMISE REJECTIONS=========//
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});