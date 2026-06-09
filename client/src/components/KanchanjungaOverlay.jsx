/**
 * KanchanjungaOverlay.jsx
 * Full-screen overlay shown when Level 3 (Kanchanjunga) conflict detected.
 * Auto-resolves after 5 seconds.
 */
export default function KanchanjungaOverlay({ active }) {
  if (!active) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(16px)',
      animation: 'kanchanIn 0.4s ease',
    }}>
      {/* Red border flash */}
      <div style={{
        position: 'absolute',
        inset: 0,
        border: '6px solid #ef4444',
        animation: 'borderFlash 0.5s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 40px' }}>
        <div style={{ fontSize: 72, marginBottom: 20, animation: 'shake 0.3s ease-in-out infinite' }}>
          💀
        </div>

        <div style={{
          fontSize: 'clamp(24px, 4vw, 40px)',
          fontWeight: 900,
          color: '#ef4444',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 12,
          textShadow: '0 0 40px rgba(239,68,68,0.8)',
          animation: 'textPulse 0.8s ease-in-out infinite',
        }}>
          KANCHANJUNGA SCENARIO
        </div>

        <div style={{
          fontSize: 18,
          color: 'rgba(255,255,255,0.7)',
          marginBottom: 8,
          fontWeight: 600,
        }}>
          ACTIVE — Token Missing, Collision Imminent
        </div>

        <div style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.4)',
          marginBottom: 36,
          lineHeight: 1.7,
          maxWidth: 480,
        }}>
          Two trains on the same manual section with no valid digital token.
          This is how the Kanchanjunga Express disaster happened on June 17, 2024.
        </div>

        {/* Resolution indicator */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 28px',
          borderRadius: 16,
          background: 'rgba(0,208,132,0.12)',
          border: '2px solid rgba(0,208,132,0.5)',
          fontSize: 16,
          fontWeight: 700,
          color: '#00d084',
          boxShadow: '0 0 30px rgba(0,208,132,0.3)',
          animation: 'resolveGlow 1s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 24 }}>🛡</span>
          KavachBridge Prevented This
        </div>

        <div style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          Auto-resolving in 5 seconds…
        </div>
      </div>

      <style>{`
        @keyframes kanchanIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes borderFlash {
          0%, 100% { border-color: rgba(239,68,68,0.5); }
          50% { border-color: rgba(239,68,68,1); box-shadow: inset 0 0 60px rgba(239,68,68,0.2); }
        }
        @keyframes shake {
          0%, 100% { transform: rotate(-5deg) scale(1); }
          50% { transform: rotate(5deg) scale(1.1); }
        }
        @keyframes textPulse {
          0%, 100% { text-shadow: 0 0 40px rgba(239,68,68,0.8); }
          50% { text-shadow: 0 0 80px rgba(239,68,68,1), 0 0 120px rgba(239,68,68,0.5); }
        }
        @keyframes resolveGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(0,208,132,0.3); }
          50% { box-shadow: 0 0 60px rgba(0,208,132,0.7); }
        }
      `}</style>
    </div>
  );
}
