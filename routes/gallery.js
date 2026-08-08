const express = require('express');
const router = express.Router();
const multer = require('multer');
const GalleryItem = require('../models/GalleryItem');

// Configure Multer for in-memory storage (so images persist in MongoDB across deployments)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const adminPass = process.env.ADMIN_PASSWORD || 'Shaishavp';

// POST /upload — Secret photo upload form endpoint
router.post('/upload', upload.single('mediaFile'), async (req, res) => {
  try {
    const password = req.body.adminPassword;
    if (password !== adminPass) {
      return res.status(401).json({ error: 'Unauthorized: Incorrect admin password.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const newItem = new GalleryItem({
      title: req.body.title || 'Gallery Image',
      description: req.body.description || '',
      imageData: req.file.buffer,
      contentType: req.file.mimetype
    });

    await newItem.save();
    return res.status(200).json({ message: 'Image saved to database successfully!' });
  } catch (err) {
    console.error('Upload Error:', err);
    return res.status(500).json({ error: 'Server error saving image: ' + err.message });
  }
});

// GET /api/gallery — Retrieve list of all uploaded gallery photos
router.get('/api/gallery', async (req, res) => {
  try {
    const items = await GalleryItem.find({}, '_id title description createdAt').sort({ createdAt: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/image/:id — Serve image binary stream
router.get('/api/image/:id', async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item || !item.imageData) {
      return res.status(404).send('Image not found');
    }
    res.set('Content-Type', item.contentType);
    res.send(item.imageData);
  } catch (err) {
    res.status(500).send('Error retrieving image');
  }
});

// DELETE /api/image/:id — Delete gallery photo
router.delete('/api/image/:id', async (req, res) => {
  try {
    const { adminPassword } = req.body || {};
    if (adminPassword !== adminPass) {
      return res.status(401).json({ error: 'Unauthorized: Incorrect admin password.' });
    }
    await GalleryItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Photo deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/image/:id — Edit title/description
router.put('/api/image/:id', async (req, res) => {
  try {
    const { title, description, adminPassword } = req.body || {};
    if (adminPassword !== adminPass) {
      return res.status(401).json({ error: 'Unauthorized: Incorrect admin password.' });
    }
    await GalleryItem.findByIdAndUpdate(req.params.id, { title, description });
    res.json({ message: 'Photo updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
