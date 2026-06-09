/**
 * useTrainSimulation.js — v2.1 FIXED
 *
 * FIXES APPLIED:
 * 1. Token engine: zone detection runs every tick (200ms), uses stable ref comparison
 * 2. Token trigger: fires reliably on transition entry, clears properly on kavach re-entry
 * 3. Track interpolation: uses speedToProgressDelta with actual track totalKm
 * 4. Train color = track color for clear visual distinction
 * 5. Loop: resets per-train token/state but preserves global counters
 * 6. allCompleted: checks individually per train, not all-or-nothing
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { TRACKS, TRAIN_NAMES, TRAIN_COLORS } from '../utils/trackData';
import {
  buildPathMetrics,
  interpolateAlongPath,
  getHeadingAtProgress,
  speedToProgressDelta,
} from '../utils/trackInterpolation';
import { generateZones, getZoneAtProgress } from '../utils/zoneGenerator';
import { detectConflicts } from '../utils/conflictDetector';

const TICK_MS = 200;

// Simulation is geographically real-scale (300–600 km tracks).
// Need a large multiplier so trains visibly move at zoom 7.
// 80× = train crosses map in ~3–4 minutes at 80 km/h base speed.
const SPEED_MULT     = 80;
const BASE_SPEED     = { min: 70, max: 100 }; // km/h in Kavach zone
const MANUAL_SPEED    = 45;              // km/h with token
const WAITING_SPEED   = 45;              // km/h waiting for token (was 12 — too slow!)
const CRAWL_SPEED     = 30;              // km/h when blocked / safe mode

// --- Global counters survive loop resets ---
let gTokenCounter = 0;
let gConflictsPrevented = 0;
let gTokensTotal = 0;

function makeTokenId() {
  gTokenCounter++;
  return `TKN-${Date.now().toString(36).slice(-4).toUpperCase()}${gTokenCounter}`;
}

function rnd(min, max) {
  return Math.random() * (max - min) + min;
}

// ─── build fresh train objects for a new loop ───────────────────────────────
function buildTrains(pathMetrics, zoneMap) {
  const shuffledNames = [...TRAIN_NAMES].sort(() => Math.random() - 0.5);

  return TRACKS.map((track, i) => {
    const metrics = pathMetrics[track.id];
    // Spread trains: T1@20%, T2@50%, T3@80% — clearly separated on map
    const SPAWN_POSITIONS = [0.20, 0.50, 0.80];
    const startP  = SPAWN_POSITIONS[i] ?? rnd(0.1, 0.3);
    const pos     = interpolateAlongPath(metrics, startP);
    const zones   = zoneMap[track.id] || [];
    const zone    = getZoneAtProgress(zones, startP);
    const speed   = rnd(BASE_SPEED.min, BASE_SPEED.max);

    return {
      trainId:       `T${i + 1}`,
      name:          shuffledNames[i],
      color:         TRAIN_COLORS[i],   // matches track color
      trackId:       track.id,
      progress:      startP,
      lat:           pos.lat,
      lng:           pos.lng,
      speed,
      baseSpeed:     speed,
      heading:       getHeadingAtProgress(metrics, startP),

      // zone state
      zoneType:      zone,
      prevZoneType:  zone,

      // token state machine
      tokenState:    'NONE',  // NONE | WAITING | ISSUED | BLOCKED | EXPIRING
      token:         null,
      tokenWaitMs:   0,       // countdown timer before token is issued
      pendingStation: null,

      completed:     false,
    };
  });
}

// ─── find nearest station on a track ────────────────────────────────────────
function nearestStation(track, lat, lng) {
  if (!track?.stations?.length) return null;
  return track.stations.reduce((best, s) => {
    if (!best) return s;
    const dBest = Math.abs(best.lat - lat) + Math.abs(best.lng - lng);
    const dS    = Math.abs(s.lat   - lat) + Math.abs(s.lng   - lng);
    return dS < dBest ? s : best;
  }, null);
}

// ============================================================================
export function useTrainSimulation() {
  const [running, setRunning]                 = useState(false);
  const [trains,  setTrains]                  = useState([]);
  const [zones,   setZones]                   = useState({});
  const [conflicts, setConflicts]             = useState([]);
  const [tokenLog,  setTokenLog]              = useState([]);
  const [tokenAnimations, setTokenAnimations] = useState([]);
  const [safeModeActive, setSafeModeActive]   = useState(false);
  const [kanchanjungaActive, setKanchanjunga] = useState(false);
  const [activeWeather, setActiveWeather]     = useState({}); // { trackId: { type, endTime, speedLimit } }
  const [stats, setStats]                     = useState({
    kavachCount: 0, manualCount: 0, activeTokens: 0,
    tokensIssuedTotal: 0, conflictsPrevented: 0, loopCount: 0,
  });

  // refs that tick closure reads (no stale captures)
  const pathMetricsRef  = useRef({});
  const trainsRef       = useRef([]);
  const zonesRef        = useRef({});
  const safeModeRef     = useRef(false);
  const kanchanRef      = useRef(false);
  const kanchanTimerRef = useRef(null);
  const loopCountRef    = useRef(0);
  const tickRef         = useRef(null);
  const weatherRef      = useRef({}); // fast access to activeWeather in tick

  // ── build path metrics once ──────────────────────────────────────────────
  useEffect(() => {
    const map = {};
    TRACKS.forEach((t) => { map[t.id] = buildPathMetrics(t.points); });
    pathMetricsRef.current = map;
  }, []);

  // ── emit a token animation ────────────────────────────────────────────────
  const emitTokenAnim = useCallback((tokenId, station, train, blocked) => {
    const anim = {
      id:         tokenId,
      trainId:    train.trainId,
      stationLat: station?.lat ?? train.lat,
      stationLng: station?.lng ?? train.lng,
      trainLat:   train.lat,
      trainLng:   train.lng,
      trainName:  train.name,
      stationCode: station?.code ?? 'SYS',
      blocked,
      createdAt:  Date.now(),
    };
    setTokenAnimations((prev) => [...prev, anim]);
    setTimeout(() => {
      setTokenAnimations((prev) => prev.filter((a) => a.id !== tokenId));
    }, 3000);
  }, []);

  // ── weather control ───────────────────────────────────────────────────────
  const applyWeather = useCallback((trackId, duration, type) => {
    const speedLimit = type === 'rain' ? 40 : 25;
    const endTime = Date.now() + duration * 1000;
    
    setTokenLog((prev) => [
      {
        time:      new Date().toLocaleTimeString('en-IN', { hour12: false }),
        tokenId:   `WX-${type.toUpperCase()}`,
        trainName: `Track ${trackId.replace('track', '')}`,
        issuedBy:  'SYS',
        status:    'ALERT',
      },
      ...prev,
    ].slice(0, 80));

    setActiveWeather((prev) => {
      const next = { ...prev, [trackId]: { type, endTime, speedLimit } };
      weatherRef.current = next;
      return next;
    });

    // Auto-clear weather after duration
    setTimeout(() => {
      setActiveWeather((prev) => {
        const next = { ...prev };
        delete next[trackId];
        weatherRef.current = next;
        return next;
      });
    }, duration * 1000);
  }, []);

  // ── issue a token (called from tick, so uses refs not state) ──────────────
  const issueToken = useCallback((train, station, trains) => {
    if (safeModeRef.current) return null;

    // Check for conflict — another train already in manual on same track
    const conflict = trains.some(
      (t) =>
        t.trainId !== train.trainId &&
        t.trackId === train.trackId &&
        (t.zoneType === 'manual' || t.tokenState === 'ISSUED')
    );

    const tokenId  = makeTokenId();
    const issuedAt = Date.now();
    const token = {
      tokenId,
      trainId:     train.trainId,
      trainName:   train.name,
      trainColor:  train.color,
      issuedBy:    `SM-${station?.code ?? 'SYS'}`,
      stationCode: station?.code ?? 'SYS',
      stationName: station?.name ?? 'Station',
      fromKm:      Math.round(train.progress * 300),
      toKm:        Math.round(train.progress * 300) + 45,
      speedLimit:  45,
      issuedAt,
      expiresAt:   issuedAt + 12 * 60 * 1000,
      status:      conflict ? 'BLOCKED' : 'ACTIVE',
      blocked:     conflict,
    };

    gTokensTotal++;
    if (conflict) gConflictsPrevented++;

    // Update log (React state — ok outside tight loop)
    setTokenLog((prev) => [
      {
        time:      new Date().toLocaleTimeString('en-IN', { hour12: false }),
        tokenId,
        trainName: train.name,
        issuedBy:  token.issuedBy,
        status:    token.status,
      },
      ...prev,
    ].slice(0, 80));

    emitTokenAnim(tokenId, station, train, conflict);

    return token;
  }, [emitTokenAnim]);

  // ── init a new loop ───────────────────────────────────────────────────────
  const initNewLoop = useCallback(() => {
    loopCountRef.current += 1;

    // Generate fresh zones
    const newZones = {};
    TRACKS.forEach((t) => { newZones[t.id] = generateZones(t.id); });
    zonesRef.current = newZones;
    setZones(newZones);

    // Build trains (must wait for pathMetrics)
    const trains = buildTrains(pathMetricsRef.current, newZones);
    trainsRef.current = trains;
    setTrains([...trains]);

    setStats((prev) => ({
      ...prev,
      loopCount:         loopCountRef.current,
      tokensIssuedTotal: gTokensTotal,
      conflictsPrevented: gConflictsPrevented,
    }));
  }, []);

  // ── MAIN TICK ─────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const metrics = pathMetricsRef.current;
    const zonesMap = zonesRef.current;
    const trains   = trainsRef.current;

    if (!trains.length) return;

    let kavachCount = 0, manualCount = 0, activeTokens = 0;
    let anyIncomplete = false;

    const updated = trains.map((train) => {
      const trackMetrics = metrics[train.trackId];
      if (!trackMetrics) return train;

      const trackObj  = TRACKS.find((t) => t.id === train.trackId);
      const trackZones = zonesMap[train.trackId] || [];

      // ── 1. Detect current zone ──────────────────────────────────────────
      const zone = getZoneAtProgress(trackZones, train.progress);
      const zoneChanged = zone !== train.zoneType;

      let t = { ...train, zoneType: zone };

      // ── 2. Zone token logic (State-based, not just edge-triggered) ───────
      if (zoneChanged) {
        t.prevZoneType = train.zoneType;
      }

      if (zone === 'manual' && t.tokenState === 'NONE') {
        const station = nearestStation(trackObj, t.lat, t.lng);
        t.tokenState    = 'WAITING';
        t.tokenWaitMs   = 1000;   // wait 1s before token issues
        t.pendingStation = station;
        t.token         = null;
      }

      if (zone === 'kavach' && t.tokenState !== 'NONE') {
        if (t.token && t.token.status === 'ACTIVE') {
          t.token = { ...t.token, status: 'EXPIRED' };
        }
        t.tokenState    = 'NONE';
        t.pendingStation = null;
        t.tokenWaitMs   = 0;
      }

      // ── 3. Token wait countdown ─────────────────────────────────────────
      if (t.tokenState === 'WAITING' && t.tokenWaitMs > 0) {
        t.tokenWaitMs -= TICK_MS;

        if (t.tokenWaitMs <= 0) {
          // Issue the token
          const token = issueToken(t, t.pendingStation, trains);
          if (token) {
            t.token      = token;
            t.tokenState = token.blocked ? 'BLOCKED' : 'ISSUED';
          }
          t.tokenWaitMs = 0;
        }
      }

      // ── 4. Speed targeting ──────────────────────────────────────────────
      let targetSpeed = t.baseSpeed;

      if (zone === 'kavach') {
        targetSpeed = t.baseSpeed;
      } else if (zone === 'manual') {
        if (safeModeRef.current) {
          targetSpeed = 10;
        } else if (t.tokenState === 'ISSUED' && t.token?.status === 'ACTIVE') {
          targetSpeed = MANUAL_SPEED;
        } else if (t.tokenState === 'BLOCKED') {
          targetSpeed = CRAWL_SPEED;
        } else {
          targetSpeed = WAITING_SPEED;
        }
      }

      // Weather override
      const weather = weatherRef.current[train.trackId];
      if (weather && Date.now() < weather.endTime) {
        targetSpeed = Math.min(targetSpeed, weather.speedLimit);
      }

      // Smooth speed interpolation
      const speedDiff = targetSpeed - t.speed;
      t.speed = t.speed + speedDiff * 0.1;

      // ── 5. Move along track (apply sim multiplier) ──────────────────────
      const delta = speedToProgressDelta(t.speed * SPEED_MULT, TICK_MS, trackMetrics.totalKm);
      t.progress += delta;

      if (t.progress >= 1.0) {
        // Train completed this loop
        t.progress  = 1.0;
        t.completed = true;
      } else {
        anyIncomplete = true;
        t.completed = false;
      }

      const pos = interpolateAlongPath(trackMetrics, t.progress);
      t.lat     = pos.lat;
      t.lng     = pos.lng;
      t.heading = getHeadingAtProgress(trackMetrics, t.progress);

      // Count stats
      if (zone === 'kavach') kavachCount++;
      else if (zone === 'manual') manualCount++;
      if (t.token?.status === 'ACTIVE') activeTokens++;

      return t;
    });

    // ── 6. Conflict detection ───────────────────────────────────────────────
    const newConflicts = detectConflicts(updated);
    setConflicts(newConflicts);

    // Level 3: Kanchanjunga
    const kanchan = newConflicts.find((c) => c.level === 3);
    if (kanchan && !kanchanRef.current) {
      kanchanRef.current = true;
      setKanchanjunga(true);
      if (kanchanTimerRef.current) clearTimeout(kanchanTimerRef.current);
      kanchanTimerRef.current = setTimeout(() => {
        kanchanRef.current = false;
        setKanchanjunga(false);
        gConflictsPrevented++;
      }, 5000);
    }

    trainsRef.current = updated;
    setTrains([...updated]);

    setStats({
      kavachCount,
      manualCount,
      activeTokens,
      tokensIssuedTotal:   gTokensTotal,
      conflictsPrevented:  gConflictsPrevented,
      loopCount:           loopCountRef.current,
    });

    // ── 7. All trains complete → restart loop ───────────────────────────────
    if (!anyIncomplete && updated.every((t) => t.completed)) {
      clearInterval(tickRef.current);
      setTimeout(() => {
        initNewLoop();
        // Restart tick after loop init
        tickRef.current = setInterval(tick, TICK_MS);
      }, 1500);
    }
  }, [issueToken, initNewLoop]);

  // ── start / stop tick loop ────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(tick, TICK_MS);
    return () => clearInterval(tickRef.current);
  }, [running, tick]);

  const startSimulation = useCallback(() => {
    setRunning(true);
    // Wait one frame for pathMetrics to be ready
    setTimeout(() => initNewLoop(), 50);
  }, [initNewLoop]);

  const toggleSafeMode = useCallback(() => {
    safeModeRef.current = !safeModeRef.current;
    setSafeModeActive(safeModeRef.current);
  }, []);

  return {
    running,
    trains,
    zones,
    conflicts,
    stats,
    tokenLog,
    tokenAnimations,
    safeModeActive,
    kanchanjungaActive,
    tokenLog,
    activeWeather,
    applyWeather,
    startSimulation,
    toggleSafeMode,
  };
}
