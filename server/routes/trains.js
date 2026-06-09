const express = require('express');
const router = express.Router();
const { getTrains } = require('../sockets/trainSocket');

// GET /api/trains - return all current train positions
router.get('/', (_req, res) => {
  const trains = getTrains();
  res.json(trains);
});

// GET /api/trains/:trainId - return single train
router.get('/:trainId', (req, res) => {
  const trains = getTrains();
  const train = trains.find((t) => t.trainId === req.params.trainId);
  if (!train) return res.status(404).json({ error: 'Train not found' });
  res.json(train);
});

module.exports = router;
