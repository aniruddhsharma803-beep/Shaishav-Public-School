const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');

const requireAdmin = (req, res, next) => {
  const adminPass = process.env.ADMIN_PASSWORD || 'Shaishavp';
  if (req.headers['x-admin-password'] === adminPass) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized: Incorrect admin password." });
  }
};

// GET all notices
router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 }); // Newest first
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new notice
router.post('/', requireAdmin, async (req, res) => {
  const notice = new Notice({
    date: req.body.date,
    month: req.body.month,
    year: req.body.year || "2026",
    label: req.body.label,
    labelColor: req.body.labelColor,
    title: req.body.title,
    description: req.body.description
  });

  try {
    const newNotice = await notice.save();
    res.status(201).json(newNotice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a notice by ID
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
