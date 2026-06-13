/**
 * StationAlertPanel.jsx — Feature 2: Station Master Alert Panel
 * Shows approaching trains with countdown timer. Escalates if no token in 60s.
 */
import { useState, useEffect, useRef } from 'react';

function CountdownBar({ startTime, duration = 60 }) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setRemaining(Math.max(0, duration - elapsed));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [startTime, duration]);

  const pct = (remaining / duration) * 100;
  const barColor =
    remaining > 30 ? '#00C896' :
    remaining > 15 ? '#FFD700' : '#FF4444';

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>
        Issue token in: <span style={{ color: barColor, fontWeight: 700 }}>{remaining}s</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: '#1a1a1a', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor,
          transition: 'width 0.5s linear, background 0.5s',
          boxShadow: `0 0 6px ${barColor}`,
        }} />
      </div>
    </div>
  );
}

export default function StationAlertPanel({ alerts = [], escalations = [] }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.45)',
      border: '1px solid #2a2a3a',
      borderRadius: 8,
      padding: '10px 12px',
      marginTop: 10,
    }}>
      {/* Header */}
      <div style={{
        fontSize: 11, fontWeight: 700,
        color: '#4DA6FF', marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        🏛️ STATION MASTER ALERTS
        {alerts.length > 0 && (
          <span style={{
            fontSize: 9, padding: '1px 6px',
            background: 'rgba(77,166,255,0.15)',
            border: '1px solid rgba(77,166,255,0.3)',
            borderRadius: 10, color: '#4DA6FF', fontWeight: 700,
          }}>
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div style={{ fontSize: 10, color: '#444', fontStyle: 'italic' }}>
          All stations — no approaching trains
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {alerts.map((alert) => {
            const isEscalated = escalations.includes(alert.stationId);
            const borderColor = isEscalated ? '#FF4444' : '#FFD700';
            const titleColor  = isEscalated ? '#FF4444' : '#FFD700';
            const bg          = isEscalated ? 'rgba(255,68,68,0.1)' : 'rgba(255,215,0,0.07)';

            return (
              <div
                key={alert.stationId}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: `1px solid ${borderColor}`,
                  background: bg,
                  animation: isEscalated ? 'smPulse 1s ease-in-out infinite' : 'none',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: titleColor }}>
                  {isEscalated ? '🆘 ESCALATED' : '⚠️ ALERT'} — {alert.stationCode}
                </div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 3, lineHeight: 1.6 }}>
                  <span style={{ color: alert.trainColor || '#fff', fontWeight: 600 }}>
                    {alert.trainName}
                  </span>{' '}approaching
                  <br />
                  Distance: <span style={{ fontFamily: 'monospace', color: '#ddd' }}>
                    {typeof alert.distanceKm === 'number' ? alert.distanceKm.toFixed(1) : '?'} km
                  </span>
                </div>

                {isEscalated ? (
                  <div style={{
                    marginTop: 6, fontSize: 10, fontWeight: 700,
                    color: '#FF4444',
                    padding: '4px 8px',
                    background: 'rgba(255,68,68,0.12)',
                    borderRadius: 4,
                  }}>
                    TOKEN OVERDUE — Manual protocol required immediately
                  </div>
                ) : (
                  <CountdownBar startTime={alert.alertStartTime} duration={60} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes smPulse {
          0%, 100% { box-shadow: 0 0 0px rgba(255,68,68,0.2); }
          50%       { box-shadow: 0 0 12px rgba(255,68,68,0.5); }
        }
      `}</style>
    </div>
  );
}
