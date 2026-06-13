/**
 * SpeedViolationPanel.jsx — Feature 3: Speed Violation Detection
 * Shows pulsing violation cards when trains exceed token speed limit.
 */

export default function SpeedViolationPanel({ violations = [] }) {
  if (violations.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(255,68,68,0.06)',
      border: '1px solid rgba(255,68,68,0.4)',
      borderRadius: 8,
      padding: '10px 12px',
      marginTop: 10,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#FF4444',
        marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        ⚡ SPEED VIOLATIONS
        <span style={{
          fontSize: 9, padding: '1px 6px',
          background: 'rgba(255,68,68,0.2)',
          border: '1px solid rgba(255,68,68,0.4)',
          borderRadius: 10, color: '#FF4444', fontWeight: 700,
        }}>
          {violations.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {violations.map((v) => (
          <div
            key={v.trainId}
            style={{
              padding: '8px 10px',
              background: 'rgba(255,68,68,0.12)',
              border: '1px solid rgba(255,68,68,0.5)',
              borderRadius: 6,
              animation: 'svPulse 0.8s ease-in-out infinite',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FF4444', marginBottom: 4 }}>
              ⚡ {v.trainName}
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '2px 12px', fontSize: 10, color: '#ffaaaa',
            }}>
              <span style={{ color: '#888' }}>Current</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#FF4444' }}>
                {v.currentSpeed} km/h
              </span>
              <span style={{ color: '#888' }}>Token Limit</span>
              <span style={{ fontFamily: 'monospace', color: '#FFD700' }}>
                {v.speedLimit} km/h
              </span>
              <span style={{ color: '#888' }}>Excess</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#FF4444' }}>
                +{v.excess} km/h
              </span>
            </div>
            <div style={{
              marginTop: 6, fontSize: 9, color: 'rgba(255,100,100,0.7)',
              fontStyle: 'italic',
            }}>
              Auto-correcting speed in 3s…
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes svPulse {
          0%, 100% { box-shadow: 0 0 4px rgba(255,68,68,0.2); border-color: rgba(255,68,68,0.3); }
          50%       { box-shadow: 0 0 16px rgba(255,68,68,0.6); border-color: rgba(255,68,68,0.7); }
        }
      `}</style>
    </div>
  );
}
