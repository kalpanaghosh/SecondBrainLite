const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = broadcast to all
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'event', 'system'], default: 'info' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isBroadcast: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
