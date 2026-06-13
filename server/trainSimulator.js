const { io } = require('socket.io-client');

const port = process.env.PORT || 4000;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${port}`;

console.log(`🚂 KavachBridge Train Simulator connecting to ${SERVER_URL}...`);

const socket = io(SERVER_URL, { transports: ['websocket'] });

const TRAINS = [
  {
    trainId: 'T1',
    name: '12503 Humsafar Express',
    lat: 26.45,
    lng: 84.35,
    speed: 72,
    direction: 'north',
    zoneType: 'kavach',
    trackSegment: 'A1',
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
  },
];

function moveTrains() {
  const delta = 0.006;
  TRAINS.forEach((train) => {
    switch (train.direction) {
      case 'north': train.lat += delta; break;
      case 'south': train.lat -= delta; break;
      case 'east':  train.lng += delta; break;
      case 'west':  train.lng -= delta; break;
    }
    train.lastUpdated = new Date().toISOString();
    socket.emit('train_position_update', { ...train });
  });
}

socket.on('connect', () => {
  console.log('✅ Simulator connected to server');

  // Emit initial positions
  TRAINS.forEach((train) => socket.emit('train_position_update', { ...train }));

  // Update every 3 seconds
  setInterval(moveTrains, 3000);

  // After 10 seconds: T1 enters manual zone
  setTimeout(() => {
    const t1 = TRAINS.find((t) => t.trainId === 'T1');
    if (t1) {
      t1.zoneType = 'manual';
      t1.lat = 27.35;
      t1.lng = 88.62;
      console.log('⚠️  T1 (Humsafar Express) entered MANUAL zone');
      socket.emit('train_position_update', { ...t1 });
    }
  }, 10000);

  // After 25 seconds: T3 enters same manual zone segment (conflict!)
  setTimeout(() => {
    const t3 = TRAINS.find((t) => t.trainId === 'T3');
    if (t3) {
      t3.zoneType = 'manual';
      t3.trackSegment = 'A1';
      t3.lat = 27.28;
      t3.lng = 88.62;
      t3.direction = 'north';
      console.log('🚨 T3 (Goods Train) injected into MANUAL zone — CONFLICT IMMINENT');
      socket.emit('train_position_update', { ...t3 });
    }
  }, 25000);
});

socket.on('disconnect', () => {
  console.log('❌ Simulator disconnected from server');
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});
