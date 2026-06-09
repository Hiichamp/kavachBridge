require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const trainRoutes = require('./routes/trains');
const tokenRoutes = require('./routes/tokens');
const { initTrainSocket } = require('./sockets/trainSocket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Attach io to req so routes can emit
app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.use('/api/trains', trainRoutes);
app.use('/api/tokens', tokenRoutes);

// Safe mode — use global so token routes can read it
global.safeModeActive = false;

app.get('/api/safemode', (_req, res) => res.json({ safeModeActive: global.safeModeActive }));
app.post('/api/safemode', (req, res) => {
  global.safeModeActive = req.body.active;
  io.emit('safe_mode', { active: global.safeModeActive });
  res.json({ safeModeActive: global.safeModeActive });
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kavachbridge';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    initTrainSocket(io);
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => console.log(`🚂 KavachBridge server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('⚠️  MongoDB not available — running in-memory mode:', err.message);
    // Still start server for demo without DB
    initTrainSocket(io);
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () =>
      console.log(`🚂 KavachBridge server running on port ${PORT} (in-memory mode)`)
    );
  });
