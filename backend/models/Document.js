const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['ID', 'Certificate', 'Personal', 'Other'], required: true },
  uploadDate: { type: Date, default: Date.now },
  originalName: { type: String, required: true }, // The original name of the file uploaded
  filename: { type: String, required: true }, // The stored file name (uuid or similar)
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  shareId: { type: String, unique: true, required: true },
  isShared: { type: Boolean, default: false }, // Whether the share link is active
  password: { type: String, default: null }, // Hashed password if the share is protected
  expiresAt: { type: Date, default: null } // Optional expiration date for the share link
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
