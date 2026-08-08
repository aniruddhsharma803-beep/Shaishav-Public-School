require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON
app.use(express.static(path.join(__dirname, 'public'))); // Serve HTML frontend

// MongoDB Connection Handling
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://aniruddhsharma803_db_user:ba9Rh4zd90QGOn1q@cluster0.svwvmzr.mongodb.net/shaishav_school?retryWrites=true&w=majority&appName=Cluster0";

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB Successfully!');
  } catch (err) {
    console.warn('Primary SRV MongoDB connection failed, attempting fallback...', err.message);
    const directUri = "mongodb://aniruddhsharma803_db_user:ba9Rh4zd90QGOn1q@cluster0-shard-00-00.svwvmzr.mongodb.net:27017,cluster0-shard-00-01.svwvmzr.mongodb.net:27017,cluster0-shard-00-02.svwvmzr.mongodb.net:27017/shaishav_school?ssl=true&authSource=admin&retryWrites=true&w=majority";
    try {
      await mongoose.connect(directUri, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to MongoDB via Direct Seeds Successfully!');
    } catch (err2) {
      console.error('Fallback Direct MongoDB Connection Error:', err2.message);
    }
  } finally {
    isConnecting = false;
  }
};

// Initial Connection
connectDB();

// Dynamic Reconnect & DB Readiness Middleware
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') && req.path !== '/api/notices/login') {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: "Database connection is initializing or blocked. Please verify MongoDB Atlas IP Whitelist includes 0.0.0.0/0." 
      });
    }
  }
  next();
});

// Routes
const noticeRoutes = require('./routes/notices');
app.use('/api/notices', noticeRoutes);

// Catch all for routes - Send back to home (or 404 page if you like)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
