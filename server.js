require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');

// Fix Windows DNS querySrv ECONNREFUSED for MongoDB Atlas
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.log('DNS configuration note:', e.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON
app.use(express.static(path.join(__dirname, 'public'))); // Serve HTML frontend

// MongoDB Connection
const primaryUri = process.env.MONGODB_URI;
const directUri = "mongodb://aniruddhsharma803_db_user:ba9Rh4zd90QGOn1q@cluster0-shard-00-00.svwvmzr.mongodb.net:27017,cluster0-shard-00-01.svwvmzr.mongodb.net:27017,cluster0-shard-00-02.svwvmzr.mongodb.net:27017/shaishav_school?ssl=true&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(primaryUri)
  .then(() => console.log('Connected to MongoDB Successfully!'))
  .catch((err) => {
    console.warn('Primary SRV MongoDB connection failed, trying direct connection...', err.message);
    mongoose.connect(directUri)
      .then(() => console.log('Connected to MongoDB via Direct Seeds Successfully!'))
      .catch((err2) => console.error('MongoDB Direct Connection Error:', err2));
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
