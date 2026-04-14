const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

//==========Load env variables=========
dotenv.config();

//======Connect to database=========
connectDB();

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`📡 app is runnong on the port: http://localhost:${PORT}/api`);

});