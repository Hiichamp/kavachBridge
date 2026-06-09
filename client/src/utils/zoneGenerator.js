/**
 * zoneGenerator.js
 * Randomly generates Kavach / Transition / Manual zone segments for each track.
 * Returns an array of segments with zoneType and progress [0..1] boundaries.
 */

const ZONE_PATTERNS = ['kavach', 'manual', 'kavach', 'manual', 'kavach', 'manual', 'kavach'];

/**
 * Generate zone segments for a track.
 * Each call produces a new random seed — call this on each loop restart.
 * @returns Array<{ zoneType, start, end }> where start/end are [0..1] progress.
 */
export function generateZones(trackId) {
  const segments = [];
  const pattern = [...ZONE_PATTERNS];

  // Randomize segment lengths — must sum to 1.0
  const counts = pattern.length;
  let remaining = 1.0;
  const lengths = [];

  for (let i = 0; i < counts; i++) {
    if (i === counts - 1) {
      lengths.push(remaining);
    } else {
      const zone = pattern[i];
      let min, max;
      if (zone === 'kavach') { min = 0.15; max = 0.25; }
      else { min = 0.08; max = 0.18; } // manual

      const val = Math.random() * (max - min) + min;
      const capped = Math.min(val, remaining - (counts - i - 1) * 0.03);
      lengths.push(Math.max(capped, 0.03));
      remaining -= lengths[i];
    }
  }

  // Normalize so they sum to exactly 1.0
  const total = lengths.reduce((a, b) => a + b, 0);
  let cursor = 0;
  for (let i = 0; i < counts; i++) {
    const len = lengths[i] / total;
    segments.push({
      zoneType: pattern[i],
      start: cursor,
      end: cursor + len,
      trackId,
    });
    cursor += len;
  }

  return segments;
}

/**
 * Given progress [0..1], return the zone type from a segments array.
 */
export function getZoneAtProgress(segments, progress) {
  for (const seg of segments) {
    if (progress >= seg.start && progress <= seg.end) {
      return seg.zoneType;
    }
  }
  return 'kavach';
}

/**
 * Given progress, find the nearest manual zone station for this track's segments.
 */
export function getNearestManualZone(segments) {
  return segments.filter((s) => s.zoneType === 'manual');
}
