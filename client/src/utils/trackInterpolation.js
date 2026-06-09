/**
 * trackInterpolation.js — v2.1 FIXED
 * Robust path following using haversine distances.
 * Progress is 0–100 (percent) matching the spec.
 * Internally we normalize to 0–1 for consistency but accept both.
 */

function haversineKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Build path metrics: total km + per-segment cumulative distances.
 * Accepts array of [lat, lng] points.
 * Returns { totalKm, segments }
 */
export function buildPathMetrics(points) {
  const segments = [];
  let cumKm = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end   = points[i + 1];
    const km    = haversineKm(start, end);
    segments.push({
      lat1: start[0], lng1: start[1],
      lat2: end[0],   lng2: end[1],
      km,
      cumKm,
    });
    cumKm += km;
  }

  return { totalKm: cumKm, segments };
}

/**
 * Given progress [0..1], return { lat, lng } on the polyline.
 * Uses the spec's algorithm: find which segment contains the target distance,
 * then linearly interpolate within that segment.
 */
export function interpolateAlongPath(metrics, progress) {
  const { totalKm, segments } = metrics;

  if (!segments || segments.length === 0) return { lat: 0, lng: 0 };

  // Clamp progress
  const p = Math.max(0, Math.min(1, progress));
  const targetKm = p * totalKm;

  let covered = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (covered + seg.km >= targetKm || i === segments.length - 1) {
      const segProgress = seg.km === 0 ? 0 : (targetKm - covered) / seg.km;
      const t = Math.max(0, Math.min(1, segProgress));
      return {
        lat: seg.lat1 + (seg.lat2 - seg.lat1) * t,
        lng: seg.lng1 + (seg.lng2 - seg.lng1) * t,
      };
    }

    covered += seg.km;
  }

  // Fallback: end of track
  const last = segments[segments.length - 1];
  return { lat: last.lat2, lng: last.lng2 };
}

/**
 * Get heading in degrees at given progress [0..1].
 * 0° = north, 90° = east.
 */
export function getHeadingAtProgress(metrics, progress) {
  const { totalKm, segments } = metrics;
  if (!segments || segments.length === 0) return 0;

  const p = Math.max(0, Math.min(0.9999, progress));
  const targetKm = p * totalKm;

  let covered = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (covered + seg.km >= targetKm || i === segments.length - 1) {
      const dLat = seg.lat2 - seg.lat1;
      const dLng = seg.lng2 - seg.lng1;
      // atan2(dLng, dLat) gives clockwise angle from north
      return (Math.atan2(dLng, dLat) * 180) / Math.PI;
    }
    covered += seg.km;
  }
  return 0;
}

/**
 * Compute speed-based progress delta per tick.
 * @param speedKmh — current speed in km/h
 * @param tickMs   — tick interval in milliseconds
 * @param totalKm  — total track length in km
 * @returns delta to add to progress [0..1]
 */
export function speedToProgressDelta(speedKmh, tickMs, totalKm) {
  if (!totalKm || totalKm === 0) return 0;
  const distPerTick = (speedKmh / 3600) * (tickMs / 1000); // km moved in this tick
  return distPerTick / totalKm;
}
