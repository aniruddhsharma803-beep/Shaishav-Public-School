const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB Connection
let mongoError = null;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/school_db')
  .then(() => {
    console.log('Connected to MongoDB');
    mongoError = null;
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    mongoError = err.message;
  });

// Define Gallery Schema
const gallerySchema = new mongoose.Schema({
  title: String,
  description: String,
  section: String,
  img: {
    data: Buffer,
    contentType: String
  },
  createdAt: { type: Date, default: Date.now }
});

const GalleryImage = mongoose.model('GalleryImage', gallerySchema);

// Multer memory storage (keeps file in memory instead of disk)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Health check endpoint to verify MongoDB connection
app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    const result = {
        status: states[dbState] || 'unknown',
        mongoUri: process.env.MONGO_URI ? 'SET (hidden)' : 'NOT SET - using localhost fallback',
        readyState: dbState
    };
    if (mongoError) result.connectionError = mongoError;
    res.json(result);
});

// Admin Password Middleware
const checkAuth = (req, res, next) => {
    const requiredPassword = process.env.ADMIN_PASSWORD || 'Shaishavp';
    
    // Check both body and headers for the password, depending on route type
    const providedPassword = req.body?.adminPassword || req.headers['x-admin-password'];
    if (providedPassword !== requiredPassword) {
        return res.status(401).json({ error: 'Unauthorized: Incorrect Admin Password' });
    }
    next();
};

app.post('/upload', upload.single('mediaFile'), checkAuth, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { section, title, description } = req.body;

        if (section !== 'gallery') {
            return res.status(400).json({ error: 'Unsupported section for dynamic injection' });
        }

        // Check if MongoDB is connected before attempting save
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Please check MONGO_URI environment variable on Render.' });
        }

        // Save to MongoDB
        const newImage = new GalleryImage({
            title: title || 'Gallery Image',
            description: description || '',
            section: section,
            img: {
                data: req.file.buffer,
                contentType: req.file.mimetype
            }
        });

        await newImage.save();

        res.json({ success: true, message: 'Upload successfully saved to MongoDB!' });
    } catch (err) {
        console.error('Upload error details:', err.message, err.stack);
        res.status(500).json({ error: 'Upload failed: ' + err.message });
    }
});

// Endpoint to get the list of gallery metadata (excluding heavy image buffers)
app.get('/api/gallery', async (req, res) => {
    try {
        // Select only necessary fields to keep payload small
        const images = await GalleryImage.find({ section: 'gallery' }, 'title description createdAt').sort('-createdAt');
        res.json(images);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching gallery data' });
    }
});

// Endpoint to fetch the actual image binary
app.get('/api/image/:id', async (req, res) => {
    try {
        const image = await GalleryImage.findById(req.params.id);
        if (!image || !image.img.data) {
            return res.status(404).send('Image not found');
        }
        res.set('Content-Type', image.img.contentType);
        res.send(image.img.data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to update existing image metadata
app.put('/api/image/:id', checkAuth, async (req, res) => {
    try {
        const { title, description } = req.body;
        const updatedImage = await GalleryImage.findByIdAndUpdate(
            req.params.id,
            { title: title || 'Gallery Image', description: description || '' },
            { new: true }
        );
        if (!updatedImage) return res.status(404).json({ error: 'Image not found' });
        res.json({ success: true, message: 'Image details updated successfully!' });
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Failed to update image details' });
    }
});

// Endpoint to delete an image entirely
app.delete('/api/image/:id', checkAuth, async (req, res) => {
    try {
        const deletedImage = await GalleryImage.findByIdAndDelete(req.params.id);
        if (!deletedImage) return res.status(404).json({ error: 'Image not found' });
        res.json({ success: true, message: 'Image deleted successfully!' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

app.listen(PORT, () => {
    console.log(`Admin Server running at http://localhost:${PORT}`);
    console.log(`Access the admin panel at http://localhost:${PORT}/admin.html`);
});
