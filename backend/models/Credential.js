const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  websiteName: { type: String, required: true },
  url: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Credential', CredentialSchema);
