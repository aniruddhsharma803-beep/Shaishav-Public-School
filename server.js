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

// Direct shard fallback URI bypassing DNS SRV lookups
const DIRECT_URI = "mongodb://aniruddhsharma803_db_user:ba9Rh4zd90QGOn1q@ac-gmmxuf5-shard-00-00.svwvmzr.mongodb.net:27017,ac-gmmxuf5-shard-00-01.svwvmzr.mongodb.net:27017,ac-gmmxuf5-shard-00-02.svwvmzr.mongodb.net:27017/shaishav_school?ssl=true&replicaSet=atlas-13w1l4-shard-0&authSource=admin&retryWrites=true&w=majority";

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB Atlas SRV Successfully!');
  } catch (err) {
    console.warn('SRV MongoDB connection note:', err.message);
    try {
      await mongoose.connect(DIRECT_URI, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to MongoDB Atlas Direct Shards Successfully!');
    } catch (err2) {
      console.error('MongoDB Atlas Connection Error:', err2.message);
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
        message: "Database Authentication or Connection Failed. Please check MongoDB Atlas -> Database Access username/password." 
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
