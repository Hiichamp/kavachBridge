/**
 * useTrainSimulation.js — v3.0
 * Added: Black Box logging, Station Master alerts, Speed Violation detection,
 *        Kanchanjunga Replay trigger.
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
import { buildMessage, getSeverity } from '../components/BlackBoxLog';

const TICK_MS       = 200;
const SPEED_MULT    = 80;
const BASE_SPEED    = { min: 70, max: 100 };
const MANUAL_SPEED  = 45;
const WAITING_SPEED = 45;
const CRAWL_SPEED   = 30;

// Global counters — survive loop resets
let gTokenCounter       = 0;
let gConflictsPrevented = 0;
let gTokensTotal        = 0;

function makeTokenId() {
  gTokenCounter++;
  return `TKN-${Date.now().toString(36).slice(-4).toUpperCase()}${gTokenCounter}`;
}

function rnd(min, max) { return Math.random() * (max - min) + min; }

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildTrains(pathMetrics, zoneMap) {
  const shuffledNames = [...TRAIN_NAMES].sort(() => Math.random() - 0.5);
  return TRACKS.map((track, i) => {
    const metrics = pathMetrics[track.id];
    const SPAWN   = [0.20, 0.50, 0.80];
    const startP  = SPAWN[i] ?? rnd(0.1, 0.3);
    const pos     = interpolateAlongPath(metrics, startP);
    const zones   = zoneMap[track.id] || [];
    const zone    = getZoneAtProgress(zones, startP);
    const speed   = rnd(BASE_SPEED.min, BASE_SPEED.max);
    return {
      trainId: `T${i+1}`, name: shuffledNames[i], color: TRAIN_COLORS[i],
      trackId: track.id, progress: startP,
      lat: pos.lat, lng: pos.lng, speed, baseSpeed: speed,
      heading: getHeadingAtProgress(metrics, startP),
      zoneType: zone, prevZoneType: zone,
      tokenState: 'NONE', token: null, tokenWaitMs: 0, pendingStation: null,
      isViolating: false, completed: false,
    };
  });
}

function nearestStation(track, lat, lng) {
  if (!track?.stations?.length) return null;
  return track.stations.reduce((best, s) => {
    if (!best) return s;
    const dB = Math.abs(best.lat - lat) + Math.abs(best.lng - lng);
    const dS = Math.abs(s.lat   - lat) + Math.abs(s.lng   - lng);
    return dS < dB ? s : best;
  }, null);
}

// ============================================================================
export function useTrainSimulation() {
  const [running,          setRunning]         = useState(false);
  const [trains,           setTrains]          = useState([]);
  const [zones,            setZones]           = useState({});
  const [conflicts,        setConflicts]       = useState([]);
  const [tokenLog,         setTokenLog]        = useState([]);
  const [tokenAnimations,  setTokenAnimations] = useState([]);
  const [safeModeActive,   setSafeModeActive]  = useState(false);
  const [kanchanjungaActive, setKanchanjunga]  = useState(false);
  const [activeWeather,    setActiveWeather]   = useState({});
  const [stats,            setStats]           = useState({
    kavachCount: 0, manualCount: 0, activeTokens: 0,
    tokensIssuedTotal: 0, conflictsPrevented: 0, loopCount: 0,
  });

  // ── NEW Feature state ─────────────────────────────────────────────────────
  const [incidentLog,    setIncidentLog]   = useState([]);   // Feature 1: Black Box
  const [smAlerts,       setSmAlerts]      = useState([]);   // Feature 2: SM Alerts
  const [smEscalations,  setSmEscalations] = useState([]);   // Feature 2: Escalations
  const [violations,     setViolations]    = useState([]);   // Feature 3: Speed
  const [replayActive,   setReplayActive]  = useState(false);// Feature 4: Replay

  // Refs
  const pathMetricsRef  = useRef({});
  const trainsRef       = useRef([]);
  const zonesRef        = useRef({});
  const safeModeRef     = useRef(false);
  const kanchanRef      = useRef(false);
  const kanchanTimerRef = useRef(null);
  const loopCountRef    = useRef(0);
  const tickRef         = useRef(null);
  const weatherRef      = useRef({});

  // SM alert tracking — avoid duplicate escalation timers
  const smAlertTimersRef  = useRef({});  // trainId → timeoutId
  const smAlertsRef       = useRef([]);  // mirror of smAlerts state for tick closure
  const violationTimers   = useRef({});  // trainId → timeoutId

  // Build path metrics once
  useEffect(() => {
    const map = {};
    TRACKS.forEach(t => { map[t.id] = buildPathMetrics(t.points); });
    pathMetricsRef.current = map;
  }, []);

  // ── Incident logger ───────────────────────────────────────────────────────
  const logEvent = useCallback((type, data = {}) => {
    const entry = {
      id:        Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      type,
      message:   buildMessage(type, data),
      severity:  getSeverity(type),
      trainName: data.trainName || null,
      trackId:   data.trackId  || null,
      fresh:     true,
    };
    setIncidentLog(prev => [entry, ...prev].slice(0, 100));
    // Unmark fresh after animation
    setTimeout(() => {
      setIncidentLog(prev => prev.map(l => l.id === entry.id ? { ...l, fresh: false } : l));
    }, 400);
    return entry;
  }, []);

  // ── Token animation emitter ───────────────────────────────────────────────
  const emitTokenAnim = useCallback((tokenId, station, train, blocked) => {
    const anim = {
      id: tokenId,
      trainId: train.trainId,
      stationLat: station?.lat ?? train.lat,
      stationLng: station?.lng ?? train.lng,
      trainLat: train.lat, trainLng: train.lng,
      trainName: train.name,
      stationCode: station?.code ?? 'SYS',
      blocked, createdAt: Date.now(),
    };
    setTokenAnimations(prev => [...prev, anim]);
    setTimeout(() => setTokenAnimations(prev => prev.filter(a => a.id !== tokenId)), 3000);
  }, []);

  // ── Weather control ───────────────────────────────────────────────────────
  const applyWeather = useCallback((trackId, duration, type) => {
    const speedLimit = type === 'rain' ? 40 : 25;
    const endTime = Date.now() + duration * 1000;
    setActiveWeather(prev => {
      const next = { ...prev, [trackId]: { type, endTime, speedLimit } };
      weatherRef.current = next;
      return next;
    });
    setTimeout(() => {
      setActiveWeather(prev => {
        const next = { ...prev };
        delete next[trackId];
        weatherRef.current = next;
        return next;
      });
    }, duration * 1000);
  }, []);

  // ── Issue a token ─────────────────────────────────────────────────────────
  const issueToken = useCallback((train, station, trains) => {
    if (safeModeRef.current) return null;

    const conflict = trains.some(t =>
      t.trainId !== train.trainId &&
      t.trackId === train.trackId &&
      (t.zoneType === 'manual' || t.tokenState === 'ISSUED')
    );

    const tokenId  = makeTokenId();
    const issuedAt = Date.now();
    const token = {
      tokenId, trainId: train.trainId, trainName: train.name, trainColor: train.color,
      issuedBy: `SM-${station?.code ?? 'SYS'}`,
      stationCode: station?.code ?? 'SYS', stationName: station?.name ?? 'Station',
      fromKm: Math.round(train.progress * 300), toKm: Math.round(train.progress * 300) + 45,
      speedLimit: 45, issuedAt, expiresAt: issuedAt + 12 * 60 * 1000,
      status: conflict ? 'BLOCKED' : 'ACTIVE', blocked: conflict,
    };

    gTokensTotal++;
    if (conflict) gConflictsPrevented++;

    setTokenLog(prev => [{
      time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      tokenId, trainName: train.name, issuedBy: token.issuedBy, status: token.status,
    }, ...prev].slice(0, 80));

    // Log to black box
    logEvent(conflict ? 'TOKEN_BLOCKED' : 'TOKEN_ISSUED', {
      trainName: train.name,
      issuedBy:  token.issuedBy,
      trackId:   train.trackId,
    });

    emitTokenAnim(tokenId, station, train, conflict);
    return token;
  }, [emitTokenAnim, logEvent]);

  // ── Station Master alert engine ───────────────────────────────────────────
  const checkSmAlerts = useCallback((trains) => {
    const currentAlerts = smAlertsRef.current;

    trains.forEach(train => {
      const trackObj = TRACKS.find(t => t.id === train.trackId);
      if (!trackObj) return;

      if (train.zoneType === 'manual' && train.tokenState === 'WAITING') {
        const alreadyAlerted = currentAlerts.some(a => a.trainId === train.trainId);
        if (!alreadyAlerted) {
          const station = nearestStation(trackObj, train.lat, train.lng);
          if (!station) return;

          const dist = haversineKm(train.lat, train.lng, station.lat, station.lng);
          const alert = {
            stationId:      station.stationId || station.code,
            stationCode:    station.code,
            stationName:    station.name,
            trainId:        train.trainId,
            trainName:      train.name,
            trainColor:     train.color,
            distanceKm:     dist,
            alertStartTime: Date.now(),
          };

          const newAlerts = [...currentAlerts, alert];
          smAlertsRef.current = newAlerts;
          setSmAlerts(newAlerts);

          logEvent('CONFLICT_L1', {
            train1: train.name,
            train2: station.name,
            dist: dist.toFixed(1),
          });

          // Escalate if no token after 60s
          if (smAlertTimersRef.current[train.trainId]) return;
          smAlertTimersRef.current[train.trainId] = setTimeout(() => {
            const activeToken = trainsRef.current.find(t => t.trainId === train.trainId)?.token;
            if (!activeToken || activeToken.status !== 'ACTIVE') {
              setSmEscalations(prev => [...new Set([...prev, alert.stationId])]);
              logEvent('CONFLICT_L2', { trainName: train.name, trackId: train.trackId });
            }
            delete smAlertTimersRef.current[train.trainId];
          }, 60000);
        }
      }

      // Clear alert when train gets a token or leaves manual zone
      if (train.zoneType === 'kavach' || train.tokenState === 'ISSUED') {
        const filtered = currentAlerts.filter(a => a.trainId !== train.trainId);
        if (filtered.length !== currentAlerts.length) {
          smAlertsRef.current = filtered;
          setSmAlerts(filtered);
          setSmEscalations(prev => {
            const alert = currentAlerts.find(a => a.trainId === train.trainId);
            if (!alert) return prev;
            return prev.filter(id => id !== alert.stationId);
          });
          if (smAlertTimersRef.current[train.trainId]) {
            clearTimeout(smAlertTimersRef.current[train.trainId]);
            delete smAlertTimersRef.current[train.trainId];
          }
          if (train.zoneType === 'kavach') {
            logEvent('TOKEN_EXPIRED', { trainName: train.name });
          }
        }
      }
    });
  }, [logEvent]);

  // ── Speed violation detection ─────────────────────────────────────────────
  const checkSpeedViolations = useCallback((trains) => {
    const newViolations = [];

    trains.forEach(train => {
      if (train.zoneType === 'manual' && train.token?.status === 'ACTIVE') {
        const limit  = train.token.speedLimit; // 45 km/h
        const excess = Math.round(train.speed - limit);

        if (excess > 2 && !train.isViolating) {
          newViolations.push({
            trainId:      train.trainId,
            trainName:    train.name,
            currentSpeed: Math.round(train.speed),
            speedLimit:   limit,
            excess,
          });

          logEvent('SPEED_VIOLATION', {
            trainName: train.name,
            speed:     Math.round(train.speed),
            limit,
          });

          // Auto-correct speed after 3s via flag — tick reads isViolating
          train.isViolating = true;
          if (!violationTimers.current[train.trainId]) {
            violationTimers.current[train.trainId] = setTimeout(() => {
              trainsRef.current = trainsRef.current.map(t =>
                t.trainId === train.trainId ? { ...t, isViolating: false } : t
              );
              setViolations(prev => prev.filter(v => v.trainId !== train.trainId));
              delete violationTimers.current[train.trainId];
            }, 3000);
          }
        }
      }
    });

    if (newViolations.length > 0) {
      setViolations(prev => {
        const ids = new Set(prev.map(v => v.trainId));
        const added = newViolations.filter(v => !ids.has(v.trainId));
        return [...prev, ...added];
      });
    }
  }, [logEvent]);

  // ── Init a new loop ───────────────────────────────────────────────────────
  const initNewLoop = useCallback(() => {
    loopCountRef.current += 1;
    const newZones = {};
    TRACKS.forEach(t => { newZones[t.id] = generateZones(t.id); });
    zonesRef.current = newZones;
    setZones(newZones);

    const trains = buildTrains(pathMetricsRef.current, newZones);
    trainsRef.current = trains;
    setTrains([...trains]);

    // Reset SM alert tracking for new loop
    smAlertsRef.current = [];
    setSmAlerts([]);
    setSmEscalations([]);
    setViolations([]);

    logEvent('LOOP_COMPLETE', {
      loop:   loopCountRef.current,
      tokens: gTokensTotal,
    });

    setStats(prev => ({
      ...prev,
      loopCount:          loopCountRef.current,
      tokensIssuedTotal:  gTokensTotal,
      conflictsPrevented: gConflictsPrevented,
    }));
  }, [logEvent]);

  // ── MAIN TICK ─────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const metrics  = pathMetricsRef.current;
    const zonesMap = zonesRef.current;
    const trains   = trainsRef.current;
    if (!trains.length) return;

    let kavachCount = 0, manualCount = 0, activeTokens = 0;
    let anyIncomplete = false;

    const updated = trains.map(train => {
      const trackMetrics = metrics[train.trackId];
      if (!trackMetrics) return train;

      const trackObj   = TRACKS.find(t => t.id === train.trackId);
      const trackZones = zonesMap[train.trackId] || [];

      // 1. Zone detection
      const zone       = getZoneAtProgress(trackZones, train.progress);
      const zoneChanged = zone !== train.zoneType;
      let t = { ...train, zoneType: zone };

      if (zoneChanged) {
        t.prevZoneType = train.zoneType;
        logEvent('ZONE_ENTER', { trainName: t.name, zone, trackId: t.trackId });
      }

      // 2. Token state machine
      if (zone === 'manual' && t.tokenState === 'NONE') {
        const station = nearestStation(trackObj, t.lat, t.lng);
        t.tokenState     = 'WAITING';
        t.tokenWaitMs    = 1000;
        t.pendingStation = station;
        t.token          = null;
      }

      if (zone === 'kavach' && t.tokenState !== 'NONE') {
        if (t.token?.status === 'ACTIVE') {
          t.token = { ...t.token, status: 'EXPIRED' };
        }
        t.tokenState     = 'NONE';
        t.pendingStation = null;
        t.tokenWaitMs    = 0;
        t.isViolating    = false;
      }

      // 3. Token wait countdown
      if (t.tokenState === 'WAITING' && t.tokenWaitMs > 0) {
        t.tokenWaitMs -= TICK_MS;
        if (t.tokenWaitMs <= 0) {
          const token = issueToken(t, t.pendingStation, trains);
          if (token) {
            t.token      = token;
            t.tokenState = token.blocked ? 'BLOCKED' : 'ISSUED';
          }
          t.tokenWaitMs = 0;
        }
      }

      // 4. Speed targeting
      let targetSpeed = t.baseSpeed;

      if (zone === 'manual') {
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

      // Speed correction if violating
      if (t.isViolating && zone === 'manual' && t.token?.speedLimit) {
        targetSpeed = Math.min(targetSpeed, t.token.speedLimit);
      }

      t.speed = t.speed + (targetSpeed - t.speed) * 0.1;

      // 5. Move
      const delta = speedToProgressDelta(t.speed * SPEED_MULT, TICK_MS, trackMetrics.totalKm);
      t.progress += delta;

      if (t.progress >= 1.0) {
        t.progress = 1.0; t.completed = true;
      } else {
        anyIncomplete = true; t.completed = false;
      }

      const pos = interpolateAlongPath(trackMetrics, t.progress);
      t.lat     = pos.lat; t.lng = pos.lng;
      t.heading = getHeadingAtProgress(trackMetrics, t.progress);

      if (zone === 'kavach') kavachCount++;
      else if (zone === 'manual') manualCount++;
      if (t.token?.status === 'ACTIVE') activeTokens++;

      return t;
    });

    // 6. Conflict detection + logging
    const newConflicts = detectConflicts(updated);
    setConflicts(newConflicts);

    // Log new conflict levels
    newConflicts.forEach(c => {
      if (c.level === 2 && !c._logged) {
        c._logged = true;
        logEvent('CONFLICT_L2', {
          train1: c.train1?.name, train2: c.train2?.name,
          dist: typeof c.distanceKm === 'number' ? c.distanceKm.toFixed(1) : '?',
        });
      }
    });

    // Level 3: Kanchanjunga
    const kanchan = newConflicts.find(c => c.level === 3);
    if (kanchan && !kanchanRef.current) {
      kanchanRef.current = true;
      setKanchanjunga(true);
      logEvent('CONFLICT_L3', {});
      if (kanchanTimerRef.current) clearTimeout(kanchanTimerRef.current);
      kanchanTimerRef.current = setTimeout(() => {
        kanchanRef.current = false;
        setKanchanjunga(false);
        gConflictsPrevented++;
      }, 5000);
    }

    // 7. SM alerts + speed violations (every 5 ticks ≈ 1s to reduce spam)
    checkSmAlerts(updated);
    checkSpeedViolations(updated);


    trainsRef.current = updated;
    setTrains([...updated]);
    setStats({ kavachCount, manualCount, activeTokens,
      tokensIssuedTotal: gTokensTotal, conflictsPrevented: gConflictsPrevented,
      loopCount: loopCountRef.current });

    // 8. Loop restart
    if (!anyIncomplete && updated.every(t => t.completed)) {
      clearInterval(tickRef.current);
      setTimeout(() => {
        initNewLoop();
        tickRef.current = setInterval(tick, TICK_MS);
      }, 1500);
    }
  }, [issueToken, initNewLoop, logEvent, checkSmAlerts, checkSpeedViolations]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(tick, TICK_MS);
    return () => clearInterval(tickRef.current);
  }, [running, tick]);

  const startSimulation = useCallback(() => {
    setRunning(true);
    setTimeout(() => initNewLoop(), 50);
  }, [initNewLoop]);

  const toggleSafeMode = useCallback(() => {
    safeModeRef.current = !safeModeRef.current;
    setSafeModeActive(safeModeRef.current);
  }, []);

  // Feature 4: Trigger Kanchanjunga Replay
  const triggerReplay = useCallback(() => {
    logEvent('REPLAY_START', {});
    setReplayActive(true);
  }, [logEvent]);

  const onReplayComplete = useCallback(() => {
    setReplayActive(false);
    logEvent('REPLAY_SAVED', {});
  }, [logEvent]);

  return {
    running, trains, zones, conflicts, stats,
    tokenLog, tokenAnimations,
    safeModeActive, kanchanjungaActive,
    activeWeather, applyWeather,
    startSimulation, toggleSafeMode,
    // Feature 1
    incidentLog,
    // Feature 2
    smAlerts, smEscalations,
    // Feature 3
    violations,
    // Feature 4
    replayActive, triggerReplay, onReplayComplete,
  };
}
