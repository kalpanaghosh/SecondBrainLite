const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  time: { type: String, required: true }, // Format HH:MM
  description: { type: String },
  location: { type: String, default: '' },
  notified1Hour: { type: Boolean, default: false },
  notified30Min: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
