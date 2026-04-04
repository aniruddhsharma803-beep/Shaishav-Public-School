const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  date: { type: String, required: true },     // e.g. "02"
  month: { type: String, required: true },    // e.g. "APR"
  year: { type: String, default: "2026" },
  label: { type: String, required: true },    // "NEW", "IMPORTANT", "UPDATE"
  labelColor: { type: String, required: true }, // "accent", "primary", "green"
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notice', noticeSchema);
