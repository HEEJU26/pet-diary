const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    date: { type: String, required: true } // YYYY-MM-DD
  },
  { timestamps: true }
);

module.exports = mongoose.model('Entry', entrySchema);
