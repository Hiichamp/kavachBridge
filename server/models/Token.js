const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true },
  trainId: { type: String, required: true },
  stationId: { type: String, required: true },
  fromKm: { type: Number, required: true },
  toKm: { type: Number, required: true },
  speedLimit: { type: Number, default: 45 },
  issuedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  issuedBy: { type: String, required: true },
  status: { type: String, enum: ['active', 'expired', 'blocked'], default: 'active' },
  cryptoHash: { type: String, required: true },
});

module.exports = mongoose.model('Token', TokenSchema);
