/**
 * Dashboard.jsx — v3.0
 * Added: SM Alert Panel, Speed Violation Panel, Black Box Log.
 * Sidebar order: Stats → Trains → SM Alerts → Speed Violations → Token Log → Black Box → Footer
 */
import { useState, useEffect } from 'react';
import StationAlertPanel   from './StationAlertPanel';
import SpeedViolationPanel from './SpeedViolationPanel';
import BlackBoxLog          from './BlackBoxLog';

function haversineKm(lat1, lng1, lat2, lng2) {
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

export default function Dashboard({
  trains = [],
  conflicts = [],
  stats = {},
  tokenLog = [],
  safeModeActive = false,
  onToggleSafeMode,
  // Feature 1
  incidentLog = [],
  // Feature 2
  smAlerts = [],
  smEscalations = [],
  // Feature 3
  violations = [],
}) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <aside className="dashboard-sidebar">

      {/* ── Section D: Zone Stats strip ── */}
      <div className="stats-strip">
        <StatBox value={stats.kavachCount    ?? 0} label="Kavach"   color="#00C896" />
        <StatBox value={stats.manualCount    ?? 0} label="Manual"   color="#FF4444" />
        <StatBox value={stats.activeTokens   ?? 0} label="Tokens"   color="#4DA6FF" />
        <StatBox value={stats.tokensIssuedTotal ?? 0} label="Issued" color="#8b5cf6" />
        <StatBox value={stats.conflictsPrevented ?? 0} label="Saved" color="#f59e0b" />
      </div>

      {/* ── Section C: Conflict alerts ── */}
      {conflicts.length > 0 && (
        <div className="conflict-section">
          {conflicts.map((c, i) => (
            <ConflictAlert key={i} conflict={c} />
          ))}
        </div>
      )}

      {/* ── Section A: Active trains ── */}
      <div className="dash-section">
        <div className="dash-section-title">
          <span>🚂</span> Active Trains
          <span style={{ marginLeft: 4, fontSize: 9, color: 'var(--text-lo)' }}>
            Loop #{stats.loopCount ?? 0}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {trains.map((train) => (
            <TrainCard
              key={train.trainId}
              train={train}
              trains={trains}
              expanded={expandedId === train.trainId}
              onToggle={() =>
                setExpandedId((prev) => (prev === train.trainId ? null : train.trainId))
              }
            />
          ))}
          {trains.length === 0 && (
            <div className="empty-state-mini">Starting simulation…</div>
          )}
        </div>
      </div>

      {/* ── Feature 2: Station Master Alerts ── */}
      <div style={{ padding: '0 16px' }}>
        <StationAlertPanel alerts={smAlerts} escalations={smEscalations} />
      </div>

      {/* ── Feature 3: Speed Violations (only when active) ── */}
      {violations.length > 0 && (
        <div style={{ padding: '0 16px' }}>
          <SpeedViolationPanel violations={violations} />
        </div>
      )}

      {/* ── Section B: Token log ── */}
      <div className="dash-section" style={{ flex: 1, minHeight: 0 }}>
        <div className="dash-section-title">
          <span>📋</span> Token Log
          <span className="badge-count">{tokenLog.length}</span>
        </div>
        <div className="token-log-scroll">
          {tokenLog.length === 0 ? (
            <div className="empty-state-mini">Tokens will appear as trains approach manual zones…</div>
          ) : (
            tokenLog.map((entry, i) => (
              <div key={`${entry.tokenId}-${i}`} className={`log-entry`}>
                <span className="log-time">{entry.time}</span>
                <span className="log-token">{entry.tokenId}</span>
                <span className="log-train">{entry.trainName}</span>
                <span className={`log-status log-status-${(entry.status ?? '').toLowerCase()}`}>
                  {entry.status === 'ACTIVE'   ? '✅' :
                   entry.status === 'BLOCKED'  ? '🚫' : '⏱'}{' '}
                  {entry.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Feature 1: Black Box / Incident Log ── */}
      <div style={{ padding: '0 16px' }}>
        <BlackBoxLog logs={incidentLog} />
      </div>

      {/* ── Footer: Safe mode toggle ── */}
      <div className="dash-footer">
        <button
          className={`safe-mode-btn ${safeModeActive ? 'active' : ''}`}
          onClick={onToggleSafeMode}
          id="toggle-safe-mode"
        >
          {safeModeActive ? '🔓 Disable Network Cut' : '🔒 Simulate Network Cut'}
        </button>
        {safeModeActive && (
          <div className="safe-indicator">
            <span className="pulse-dot red" />
            SAFE MODE ACTIVE
          </div>
        )}
      </div>
    </aside>
  );
}

// ── StatBox ──────────────────────────────────────────────────────────────────
function StatBox({ value, label, color }) {
  return (
    <div className="stat-box">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ── ConflictAlert ─────────────────────────────────────────────────────────────
function ConflictAlert({ conflict }) {
  const { level, train1, train2, distanceKm } = conflict;
  const titles = {
    1: '⚠️ WARNING — Same Manual Zone',
    2: '🔴 CRITICAL — Collision Risk',
    3: '💀 KANCHANJUNGA SCENARIO',
  };
  const colors = { 1: '#FFD700', 2: '#FF4444', 3: '#ff0000' };
  const c = colors[level] || '#FF4444';

  return (
    <div style={{
      padding: '9px 13px', marginBottom: 6,
      background: `${c}12`, border: `1px solid ${c}55`,
      borderRadius: 10,
      animation: level >= 2 ? 'alertPulse 1s ease-in-out infinite' : 'none',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: c, marginBottom: 3 }}>
        {titles[level]}
      </div>
      <div style={{ fontSize: 11, color: '#8896b0' }}>
        {train1?.name} ↔ {train2?.name}
      </div>
      <div style={{ fontSize: 10, color: c, fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>
        {typeof distanceKm === 'number' ? distanceKm.toFixed(2) : distanceKm} km apart
      </div>
    </div>
  );
}

// ── TrainCard ─────────────────────────────────────────────────────────────────
function TrainCard({ train, trains, expanded, onToggle }) {
  const zoneColor = { kavach: '#00C896', manual: '#FF4444' }[train.zoneType] || '#8896b0';
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!train.token || train.token.status !== 'ACTIVE') { setCountdown(null); return; }
    const tick = () => {
      const rem = Math.max(0, Math.round((train.token.expiresAt - Date.now()) / 1000));
      setCountdown(rem);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [train.token]);

  // Distance to nearest train on same track (haversine)
  const sameTrack = trains.filter((t) => t.trainId !== train.trainId && t.trackId === train.trackId);
  const ahead  = sameTrack.filter((t) => t.progress > train.progress)
                           .sort((a, b) => a.progress - b.progress)[0];
  const behind = sameTrack.filter((t) => t.progress < train.progress)
                           .sort((a, b) => b.progress - a.progress)[0];

  const distToAhead  = ahead  ? haversineKm(train.lat, train.lng, ahead.lat,  ahead.lng)  : null;
  const distToBehind = behind ? haversineKm(train.lat, train.lng, behind.lat, behind.lng) : null;

  const zoneBadgeStyle = {
    fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
    padding: '2px 7px', borderRadius: 100,
    background: `${zoneColor}1a`,
    color: zoneColor,
    border: `1px solid ${zoneColor}44`,
    textTransform: 'uppercase',
  };

  const stateLabels = {
    NONE: null, WAITING: '⏳ Awaiting token', ISSUED: '🎫 Token active',
    BLOCKED: '🚫 Blocked', EXPIRING: '⏱ Expiring',
  };

  return (
    <div
      className={`train-card ${expanded ? 'expanded' : ''}`}
      style={{ borderColor: `${zoneColor}40`, cursor: 'pointer' }}
      onClick={onToggle}
    >
      <div className="train-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: train.color, boxShadow: `0 0 8px ${train.color}`,
            flexShrink: 0,
          }} />
          <div className="train-card-name">{train.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={zoneBadgeStyle}>
            {train.zoneType === 'kavach' ? 'KAVACH' : 'MANUAL'}
          </span>
          <span className="expand-caret">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      <div className="train-card-meta">
        <span className="speed-val" style={{ color: zoneColor }}>
          {Math.round(train.speed)}<span style={{ fontSize: 9, opacity: 0.6, marginLeft: 2 }}>km/h</span>
        </span>
        {train.tokenState === 'ISSUED' && countdown !== null && (
          <span className="token-countdown">🎫 {countdown}s</span>
        )}
        {train.tokenState === 'BLOCKED' && (
          <span className="token-blocked-badge">🚫 BLOCKED</span>
        )}
        {train.tokenState === 'WAITING' && (
          <span style={{
            fontSize: 10, color: '#FFD700',
            background: 'rgba(255,215,0,0.1)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 100, padding: '2px 7px',
          }}>⏳ Requesting…</span>
        )}
      </div>

      {expanded && (
        <div className="train-card-detail" onClick={(e) => e.stopPropagation()}>
          <div className="detail-row">
            <span>Track</span>
            <span className="mono">{train.trackId}</span>
          </div>
          <div className="detail-row">
            <span>Progress</span>
            <span className="mono">{(train.progress * 100).toFixed(1)}%</span>
          </div>
          <div className="detail-row">
            <span>Position</span>
            <span className="mono">{train.lat?.toFixed(3)}°N {train.lng?.toFixed(3)}°E</span>
          </div>

          {distToAhead !== null && (
            <div className="detail-row">
              <span>▲ Ahead</span>
              <span className="mono ahead">{distToAhead.toFixed(1)} km — {ahead.name}</span>
            </div>
          )}
          {distToBehind !== null && (
            <div className="detail-row">
              <span>▼ Behind</span>
              <span className="mono behind">{distToBehind.toFixed(1)} km — {behind.name}</span>
            </div>
          )}

          {train.token && (
            <div style={{
              marginTop: 8, padding: '8px 10px', borderRadius: 8,
              background: train.token.status === 'ACTIVE' ? 'rgba(0,200,150,0.07)' : 'rgba(255,68,68,0.07)',
              border: `1px solid ${train.token.status === 'ACTIVE' ? 'rgba(0,200,150,0.25)' : 'rgba(255,68,68,0.25)'}`,
            }}>
              <div style={{
                fontWeight: 700, fontSize: 11, marginBottom: 5,
                color: train.token.status === 'ACTIVE' ? '#00C896' : '#FF4444',
              }}>
                {train.token.tokenId}
              </div>
              <div className="detail-row">
                <span>Issued By</span><span className="mono">{train.token.issuedBy}</span>
              </div>
              <div className="detail-row">
                <span>Speed Limit</span><span className="mono">{train.token.speedLimit} km/h</span>
              </div>
              <div className="detail-row">
                <span>Status</span>
                <span className={`mono ${train.token.status === 'ACTIVE' ? 'text-green' : 'text-red'}`}>
                  {train.token.status}
                </span>
              </div>
              <div className="detail-row">
                <span>Km Range</span>
                <span className="mono">{train.token.fromKm}–{train.token.toKm} km</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
