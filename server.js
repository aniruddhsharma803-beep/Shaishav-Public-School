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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

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
