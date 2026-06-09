/**
 * conflictDetector.js (client-side)
 * Detects conflicts between trains sharing the same track and manual zone.
 */

const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Detect conflicts among all trains.
 * Returns an array of conflict objects with level, train pair, distance.
 */
export function detectConflicts(trains) {
  const conflicts = [];
  const manualTrains = trains.filter((t) => t.zoneType === 'manual');

  for (let i = 0; i < manualTrains.length; i++) {
    for (let j = i + 1; j < manualTrains.length; j++) {
      const t1 = manualTrains[i];
      const t2 = manualTrains[j];

      // Only flag if on same track
      if (t1.trackId !== t2.trackId) continue;

      const dist = haversineKm(t1.lat, t1.lng, t2.lat, t2.lng);
      let level = null;

      if (dist < 1.0) level = 3;       // KANCHANJUNGA
      else if (dist < 3.0) level = 2;  // CRITICAL
      else if (dist < 8.0) level = 1;  // WARNING

      if (level !== null) {
        conflicts.push({
          level,
          train1: t1,
          train2: t2,
          distanceKm: dist,
          timestamp: Date.now(),
        });
      }
    }
  }

  return conflicts;
}
