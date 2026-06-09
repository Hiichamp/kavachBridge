const mongoose = require('mongoose');

const TrainSchema = new mongoose.Schema({
  trainId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speed: { type: Number, default: 60 },
  direction: { type: String, default: 'north' },
  zoneType: { type: String, enum: ['kavach', 'transition', 'manual'], default: 'kavach' },
  trackSegment: { type: String, default: 'T1' },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Train', TrainSchema);
