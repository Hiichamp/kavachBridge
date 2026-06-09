/**
 * conflictDetector.js
 * Checks all trains in "manual" zone every 3 seconds.
 * Fires conflict alerts via Socket.io based on proximity.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula to calculate distance in km between two lat/lng points
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Estimate time to conflict in minutes based on speeds and distance
 */
function estimateTimeToConflict(train1, train2, distanceKm) {
  const combinedSpeed = (train1.speed || 45) + (train2.speed || 45);
  if (combinedSpeed === 0) return Infinity;
  return ((distanceKm / combinedSpeed) * 60).toFixed(1);
}

let blockTokenIssuance = false;
let lastAlerts = [];

function getBlockTokenIssuance() {
  return blockTokenIssuance;
}

function getLastAlerts() {
  return lastAlerts;
}

/**
 * Start the conflict detection loop.
 * @param {import('socket.io').Server} io
 * @param {Function} getTrains - returns current in-memory train state
 */
function startConflictDetector(io, getTrains) {
  setInterval(() => {
    const trains = getTrains();
    const manualTrains = trains.filter((t) => t.zoneType === 'manual');

    lastAlerts = [];
    blockTokenIssuance = false;

    if (manualTrains.length < 2) return;

    // Check all pairs
    for (let i = 0; i < manualTrains.length; i++) {
      for (let j = i + 1; j < manualTrains.length; j++) {
        const t1 = manualTrains[i];
        const t2 = manualTrains[j];

        const dist = haversineDistance(t1.lat, t1.lng, t2.lat, t2.lng);

        let level = null;
        if (dist < 3) {
          level = 2; // CRITICAL
          blockTokenIssuance = true;
        } else if (dist < 8) {
          level = 1; // WARNING
        }

        if (level) {
          const alert = {
            level,
            train1: { id: t1.trainId, name: t1.name },
            train2: { id: t2.trainId, name: t2.name },
            distanceKm: dist.toFixed(2),
            timeToConflictMin: estimateTimeToConflict(t1, t2, dist),
            timestamp: new Date().toISOString(),
            blocked: level === 2,
          };
          lastAlerts.push(alert);
          io.emit('conflict_alert', alert);
        }
      }
    }

    // If no alerts, emit clear
    if (lastAlerts.length === 0) {
      blockTokenIssuance = false;
      io.emit('conflict_clear', { timestamp: new Date().toISOString() });
    }
  }, 3000);
}

module.exports = { startConflictDetector, getBlockTokenIssuance, getLastAlerts };
