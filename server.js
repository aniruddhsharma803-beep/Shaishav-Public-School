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
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/school_db')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

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

app.post('/upload', upload.single('mediaFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { section, title, description } = req.body;

        if (section !== 'gallery') {
            return res.status(400).json({ error: 'Unsupported section for dynamic injection' });
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
        console.error(err);
        res.status(500).json({ error: 'Server error during upload processing' });
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

app.listen(PORT, () => {
    console.log(`Admin Server running at http://localhost:${PORT}`);
    console.log(`Access the admin panel at http://localhost:${PORT}/admin.html`);
});
