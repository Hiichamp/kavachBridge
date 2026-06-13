/**
 * BlackBoxLog.jsx — Feature 1: Incident Log / Black Box
 * Live scrolling feed of every system event.
 */
import { useEffect, useRef } from 'react';

export const LOG_EVENTS = {
  ZONE_ENTER:     'Train entered zone',
  TOKEN_ISSUED:   'Digital token issued',
  TOKEN_EXPIRED:  'Token expired — back in Kavach zone',
  TOKEN_BLOCKED:  'Token BLOCKED — conflict detected',
  SPEED_REDUCED:  'Speed reduced — token limit',
  CONFLICT_L1:    'Level 1 WARNING fired',
  CONFLICT_L2:    'Level 2 CRITICAL fired',
  CONFLICT_L3:    'KANCHANJUNGA scenario triggered',
  LOOP_COMPLETE:  'Loop cycle completed',
  REPLAY_START:   'Kanchanjunga Replay initiated',
  REPLAY_SAVED:   'Replay: Collision PREVENTED by KavachBridge',
  SPEED_VIOLATION:'Speed violation detected',
};

export function getSeverity(type) {
  if (['TOKEN_BLOCKED', 'CONFLICT_L2', 'CONFLICT_L3', 'SPEED_VIOLATION'].includes(type))
    return 'critical';
  if (['CONFLICT_L1', 'SPEED_REDUCED', 'TOKEN_EXPIRED'].includes(type))
    return 'warning';
  return 'info';
}

export function buildMessage(type, data = {}) {
  switch (type) {
    case 'ZONE_ENTER':      return `🚂 ${data.trainName || 'Train'} → ${(data.zone || '').toUpperCase()} zone${data.trackId ? ` [${data.trackId}]` : ''}`;
    case 'TOKEN_ISSUED':    return `🎫 Token issued to ${data.trainName || 'Train'} by ${data.issuedBy || 'SM'}`;
    case 'TOKEN_EXPIRED':   return `⏱ Token expired — ${data.trainName || 'Train'} re-entered Kavach`;
    case 'TOKEN_BLOCKED':   return `🚫 Token BLOCKED — ${data.trainName || 'Train'} conflict on ${data.trackId || 'track'}`;
    case 'SPEED_REDUCED':   return `⬇ Speed reduced: ${data.trainName || 'Train'} → ${data.speed || 45} km/h`;
    case 'CONFLICT_L1':     return `⚠️ L1 WARNING — ${data.train1 || '?'} ↔ ${data.train2 || '?'} (${data.dist || '?'} km)`;
    case 'CONFLICT_L2':     return `🔴 L2 CRITICAL — ${data.train1 || '?'} ↔ ${data.train2 || '?'} — Token blocked`;
    case 'CONFLICT_L3':     return `💀 KANCHANJUNGA SCENARIO triggered — system intervened`;
    case 'LOOP_COMPLETE':   return `🔄 Loop #${data.loop || '?'} completed — ${data.tokens || 0} tokens issued`;
    case 'REPLAY_START':    return `🎬 Kanchanjunga Replay started — June 17, 2024 scenario`;
    case 'REPLAY_SAVED':    return `✅ REPLAY: Collision prevented — 9 lives saved by KavachBridge`;
    case 'SPEED_VIOLATION': return `⚡ OVERSPEED — ${data.trainName}: ${data.speed} km/h (limit ${data.limit} km/h)`;
    default:                return type;
  }
}

export default function BlackBoxLog({ logs = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs.length]);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid #2a2a3a',
      borderRadius: 8,
      padding: '10px 12px',
      marginTop: 10,
    }}>
      {/* Header */}
      <div style={{
        fontSize: 11, fontWeight: 700,
        color: '#FFD700', marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        ⬛ BLACK BOX — INCIDENT LOG
        <span style={{
          fontSize: 9, padding: '1px 6px',
          background: '#1a1a1a', borderRadius: 10,
          color: '#666', border: '1px solid #333',
        }}>
          {logs.length} events
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#00C896',
            boxShadow: '0 0 6px #00C896',
            display: 'inline-block',
            animation: 'bbPulse 1.5s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 9, color: '#00C896', fontWeight: 700 }}>LIVE</span>
        </span>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {logs.length === 0 ? (
          <div style={{ fontSize: 10, color: '#555', padding: '8px 0' }}>
            Awaiting simulation events…
          </div>
        ) : (
          logs.slice(0, 60).map((log) => {
            const borderColor =
              log.severity === 'critical' ? '#FF4444' :
              log.severity === 'warning'  ? '#FFD700' : '#2a2a3a';
            const bg =
              log.severity === 'critical' ? 'rgba(255,68,68,0.07)' :
              log.severity === 'warning'  ? 'rgba(255,215,0,0.05)' :
              'rgba(255,255,255,0.02)';
            const textColor =
              log.severity === 'critical' ? '#ff9999' :
              log.severity === 'warning'  ? '#FFD700' : '#666';

            return (
              <div
                key={log.id}
                style={{
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: '3px 6px',
                  borderRadius: 4,
                  borderLeft: `3px solid ${borderColor}`,
                  background: bg,
                  color: textColor,
                  animation: log.fresh ? 'bbFadeIn 0.3s ease' : 'none',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: '#444', marginRight: 4 }}>{log.timestamp}</span>
                <span style={{ fontWeight: log.severity !== 'info' ? 700 : 400 }}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes bbFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bbPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
