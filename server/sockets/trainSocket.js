/**
 * trainSocket.js
 * Manages in-memory train state and broadcasts real-time updates.
 * Also receives simulator updates via socket events.
 */

const { startConflictDetector } = require('../engine/conflictDetector');

// Initial 5 trains with Indian Railway names
const INITIAL_TRAINS = [
  {
    trainId: 'T1',
    name: '12503 Humsafar Express',
    lat: 26.45,
    lng: 84.35,
    speed: 72,
    direction: 'north',
    zoneType: 'kavach',
    trackSegment: 'A1',
    lastUpdated: new Date().toISOString(),
  },
  {
    trainId: 'T2',
    name: '13149 Kanchanjunga Express',
    lat: 26.82,
    lng: 88.42,
    speed: 65,
    direction: 'south',
    zoneType: 'kavach',
    trackSegment: 'B1',
    lastUpdated: new Date().toISOString(),
  },
  {
    trainId: 'T3',
    name: '14056 Brahmaputra Goods',
    lat: 25.58,
    lng: 85.12,
    speed: 45,
    direction: 'east',
    zoneType: 'kavach',
    trackSegment: 'C1',
    lastUpdated: new Date().toISOString(),
  },
  {
    trainId: 'T4',
    name: '15643 Guwahati Express',
    lat: 27.1,
    lng: 88.0,
    speed: 80,
    direction: 'north',
    zoneType: 'kavach',
    trackSegment: 'D1',
    lastUpdated: new Date().toISOString(),
  },
  {
    trainId: 'T5',
    name: '12345 Saraighat Express',
    lat: 26.18,
    lng: 91.75,
    speed: 55,
    direction: 'west',
    zoneType: 'kavach',
    trackSegment: 'E1',
    lastUpdated: new Date().toISOString(),
  },
];

// Deep copy initial state
let trains = JSON.parse(JSON.stringify(INITIAL_TRAINS));
let demoRunning = false;
let demoTimers = [];

function getTrains() {
  return trains;
}

function resetTrains() {
  trains = JSON.parse(JSON.stringify(INITIAL_TRAINS));
  demoRunning = false;
  demoTimers.forEach(clearTimeout);
  demoTimers = [];
}

function updateTrainPosition(train) {
  const delta = 0.005; // ~0.5km per step
  switch (train.direction) {
    case 'north': train.lat += delta; break;
    case 'south': train.lat -= delta; break;
    case 'east':  train.lng += delta; break;
    case 'west':  train.lng -= delta; break;
    default: break;
  }
  train.lastUpdated = new Date().toISOString();
}

function startDemoScenario(io) {
  if (demoRunning) return;
  demoRunning = true;

  // Broadcast initial train positions
  io.emit('trains_update', trains);

  // Every 3 seconds: move all trains
  const moveInterval = setInterval(() => {
    trains.forEach(updateTrainPosition);
    io.emit('trains_update', trains);
  }, 3000);
  demoTimers.push(moveInterval);

  // After 8s: T1 enters transition zone
  const t1 = setTimeout(() => {
    const humsafar = trains.find((t) => t.trainId === 'T1');
    if (humsafar) {
      humsafar.zoneType = 'transition';
      io.emit('trains_update', trains);
      io.emit('zone_change', { trainId: 'T1', name: humsafar.name, newZone: 'transition' });
    }
  }, 8000);
  demoTimers.push(t1);

  // After 12s: T1 enters manual zone
  const t2 = setTimeout(() => {
    const humsafar = trains.find((t) => t.trainId === 'T1');
    if (humsafar) {
      humsafar.zoneType = 'manual';
      // Move it to the "danger corridor"
      humsafar.lat = 27.35;
      humsafar.lng = 88.62;
      io.emit('trains_update', trains);
      io.emit('zone_change', { trainId: 'T1', name: humsafar.name, newZone: 'manual' });
    }
  }, 12000);
  demoTimers.push(t2);

  // After 20s: T3 (Goods Train) injected into same manual zone section
  const t3 = setTimeout(() => {
    const goods = trains.find((t) => t.trainId === 'T3');
    if (goods) {
      goods.zoneType = 'manual';
      goods.trackSegment = 'A1'; // same as T1
      // Place it ~7km from T1 → Level 1 alert
      goods.lat = 27.29;
      goods.lng = 88.62;
      goods.direction = 'north';
      goods.speed = 50;
      io.emit('trains_update', trains);
      io.emit('zone_change', { trainId: 'T3', name: goods.name, newZone: 'manual' });
    }
  }, 20000);
  demoTimers.push(t3);

  // After 30s: Bring trains closer → Level 2 (critical)
  const t4 = setTimeout(() => {
    const goods = trains.find((t) => t.trainId === 'T3');
    if (goods) {
      goods.lat = 27.34; // Very close to T1
      goods.lng = 88.62;
      io.emit('trains_update', trains);
    }
  }, 30000);
  demoTimers.push(t4);
}

function initTrainSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send current state on connect
    socket.emit('trains_update', trains);

    // Simulator can push updates
    socket.on('train_position_update', (updatedTrain) => {
      const idx = trains.findIndex((t) => t.trainId === updatedTrain.trainId);
      if (idx !== -1) {
        trains[idx] = { ...trains[idx], ...updatedTrain, lastUpdated: new Date().toISOString() };
        io.emit('trains_update', trains);
      }
    });

    // Demo control events
    socket.on('start_demo', () => {
      resetTrains();
      startDemoScenario(io);
    });

    socket.on('reset_demo', () => {
      resetTrains();
      io.emit('trains_update', trains);
      io.emit('demo_reset', {});
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Start conflict detection loop
  startConflictDetector(io, getTrains);
}

module.exports = { initTrainSocket, getTrains, resetTrains };
