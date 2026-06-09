const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema({
  zoneId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['kavach', 'transition', 'manual'], required: true },
  coordinates: [[Number]], // Array of [lat, lng] pairs
});

module.exports = mongoose.model('Zone', ZoneSchema);
