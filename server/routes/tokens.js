const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getTrains } = require('../sockets/trainSocket');
const { getBlockTokenIssuance } = require('../engine/conflictDetector');

// In-memory token store (fallback if MongoDB not available)
const inMemoryTokens = [];

let Token;
try {
  Token = require('../models/Token');
} catch (e) {
  Token = null;
}

// Helper: check if MongoDB is connected
function isDbConnected() {
  try {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
}

/**
 * POST /api/tokens/issue
 * Issues a digital token for a train entering manual zone.
 */
router.post('/issue', async (req, res) => {
  const { trainId, stationId, fromKm, toKm, issuedBy } = req.body;

  if (!trainId || !stationId || fromKm == null || toKm == null || !issuedBy) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Safe mode check
  if (global.safeModeActive) {
    return res.json({
      blocked: true,
      reason: 'SAFE MODE ACTIVE — Network cut simulated. New token issuance suspended.',
    });
  }

  // Conflict block check
  if (getBlockTokenIssuance()) {
    return res.json({
      blocked: true,
      reason: 'CRITICAL CONFLICT DETECTED — Level 2 alert active. Token issuance blocked to prevent collision.',
    });
  }

  // Check for conflicting trains in the same zone segment
  const trains = getTrains();
  const targetTrain = trains.find((t) => t.trainId === trainId);
  if (!targetTrain) {
    return res.status(404).json({ error: 'Train not found' });
  }

  const conflictingTrains = trains.filter(
    (t) =>
      t.trainId !== trainId &&
      t.zoneType === 'manual' &&
      t.trackSegment === targetTrain.trackSegment
  );

  if (conflictingTrains.length > 0) {
    return res.json({
      blocked: true,
      reason: `CONFLICT DETECTED — Train(s) ${conflictingTrains.map((t) => t.name).join(', ')} already in section. Token blocked.`,
    });
  }

  // Generate token
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 12 * 60 * 1000); // 12 min expiry
  const tokenId = `TKN-${Date.now().toString(36).toUpperCase()}`;
  const cryptoHash = uuidv4();

  const tokenData = {
    tokenId,
    trainId,
    stationId,
    fromKm: Number(fromKm),
    toKm: Number(toKm),
    speedLimit: 45,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    issuedBy,
    status: 'active',
    cryptoHash,
    trainName: targetTrain.name,
  };

  // Persist to DB if available
  if (isDbConnected() && Token) {
    try {
      const token = new Token(tokenData);
      await token.save();
    } catch (dbErr) {
      console.warn('DB save failed, using in-memory:', dbErr.message);
      inMemoryTokens.push(tokenData);
    }
  } else {
    inMemoryTokens.push(tokenData);
  }

  // Emit token issuance event
  if (req.io) {
    req.io.emit('token_issued', tokenData);
  }

  return res.json({ blocked: false, token: tokenData });
});

/**
 * GET /api/tokens/:trainId
 * Fetch active token for a specific train.
 */
router.get('/:trainId', async (req, res) => {
  const { trainId } = req.params;
  const now = new Date();

  if (isDbConnected() && Token) {
    try {
      const token = await Token.findOne({
        trainId,
        status: 'active',
        expiresAt: { $gt: now },
      }).sort({ issuedAt: -1 });

      if (token) return res.json(token);
    } catch (err) {
      console.warn('DB query failed, checking memory:', err.message);
    }
  }

  // Fallback: in-memory
  const token = inMemoryTokens
    .filter((t) => t.trainId === trainId && t.status === 'active' && new Date(t.expiresAt) > now)
    .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))[0];

  if (token) return res.json(token);
  return res.json(null);
});

/**
 * GET /api/tokens
 * Fetch all tokens (for log table).
 */
router.get('/', async (_req, res) => {
  if (isDbConnected() && Token) {
    try {
      const tokens = await Token.find().sort({ issuedAt: -1 }).limit(50);
      return res.json(tokens);
    } catch (err) {
      console.warn('DB list failed, using memory');
    }
  }
  return res.json(inMemoryTokens.slice().reverse());
});

module.exports = router;
