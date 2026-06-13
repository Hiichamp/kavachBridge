/**
 * KanchanjungaReplay.jsx — Feature 4: Kanchanjunga Replay Mode
 * Full-screen cinematic replay of June 17, 2024 scenario.
 * Phase 1: Without KavachBridge → Collision
 * Phase 2: With KavachBridge → Prevented
 */
import { useState, useEffect, useRef } from 'react';

const PHASES = [
  {
    id: 'setup',
    title: 'June 17, 2024 — 08:55 AM',
    subtitle: 'Siliguri–Agarpara section, West Bengal',
    detail: 'Kanchanjunga Express proceeding on Paper Token Authority\nGoods Train following from behind — signal missed',
    color: '#7B0000',
    bg: 'rgba(40,0,0,0.97)',
    icon: '🚂',
    duration: 2500,
  },
  {
    id: 'without',
    title: 'WITHOUT KavachBridge',
    subtitle: 'Manual zone · Paper token system · No digital record',
    detail: 'Station master issued paper token by phone call.\nGoods train driver missed red signal at 80 km/h.',
    color: '#CC0000',
    bg: 'rgba(40,0,0,0.97)',
    icon: '📄',
    duration: 3000,
  },
  {
    id: 'collision',
    title: '💥 COLLISION',
    subtitle: '9 people killed · 40+ injured · 3 coaches derailed',
    detail: 'No digital record · No prior warning · No conflict detection\nPaper token had no way to detect duplicate movement authority',
    color: '#FF0000',
    bg: 'rgba(60,0,0,0.98)',
    icon: '💥',
    duration: 3500,
    shake: true,
  },
  {
    id: 'reset',
    title: 'Rewinding…',
    subtitle: 'Now let\'s see what KavachBridge would have done',
    detail: '',
    color: '#555',
    bg: 'rgba(5,5,15,0.97)',
    icon: '⏮',
    duration: 1500,
  },
  {
    id: 'with',
    title: 'WITH KavachBridge',
    subtitle: 'Digital token system active · Conflict engine running',
    detail: 'Both trains detected on same manual section.\nConflict engine fires at 8 km separation.',
    color: '#00C896',
    bg: 'rgba(0,20,15,0.97)',
    icon: '🛡',
    duration: 2500,
  },
  {
    id: 'l1',
    title: '⚠️ Level 1 WARNING',
    subtitle: 'Kanchanjunga ↔ Goods Train — 7.2 km apart',
    detail: 'Station master alerted automatically.\nToken issuance paused — awaiting clearance.',
    color: '#FFD700',
    bg: 'rgba(20,15,0,0.97)',
    icon: '⚠️',
    duration: 2500,
  },
  {
    id: 'l2',
    title: '🔴 Level 2 CRITICAL',
    subtitle: 'Distance: 2.8 km — Token BLOCKED',
    detail: 'New token issuance automatically blocked.\nStop command transmitted to Goods Train loco pilot.',
    color: '#FF4444',
    bg: 'rgba(30,0,0,0.97)',
    icon: '🚨',
    duration: 2500,
    flash: true,
  },
  {
    id: 'saved',
    title: '✅ COLLISION PREVENTED',
    subtitle: 'KavachBridge detected conflict 6 minutes before impact',
    detail: 'Token blocked automatically\nGoods train halted safely\n9 lives saved · 40+ injuries prevented',
    color: '#00C896',
    bg: 'rgba(0,20,12,0.97)',
    icon: '🛡',
    duration: 4000,
    glow: true,
  },
];

export default function KanchanjungaReplay({ onComplete }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [visible, setVisible]   = useState(true);
  const timerRef = useRef(null);

  const phase = PHASES[phaseIdx];

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (phaseIdx < PHASES.length - 1) {
        setPhaseIdx((p) => p + 1);
      } else {
        setVisible(false);
        setTimeout(() => onComplete?.(), 500);
      }
    }, phase.duration);

    return () => clearTimeout(timerRef.current);
  }, [phaseIdx]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: phase.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.6s ease',
      animation: 'replayFadeIn 0.4s ease',
    }}>
      {/* Red border flash on collision */}
      {phase.flash && (
        <div style={{
          position: 'absolute', inset: 0,
          border: '6px solid #FF4444',
          animation: 'replayFlash 0.5s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      )}

      {/* Progress dots */}
      <div style={{
        position: 'absolute', top: 28,
        display: 'flex', gap: 8,
      }}>
        {PHASES.map((p, i) => (
          <div key={p.id} style={{
            width: i === phaseIdx ? 20 : 6,
            height: 6, borderRadius: 3,
            background: i <= phaseIdx ? phase.color : '#333',
            transition: 'all 0.4s ease',
          }} />
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={() => { setVisible(false); onComplete?.(); }}
        style={{
          position: 'absolute', top: 20, right: 24,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6, padding: '5px 12px',
          color: '#666', fontSize: 11, cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Skip ✕
      </button>

      {/* Main content */}
      <div style={{
        textAlign: 'center',
        padding: '0 48px',
        maxWidth: 640,
        position: 'relative', zIndex: 2,
        animation: 'replaySlideUp 0.5s ease',
      }}>

        {/* Icon */}
        <div style={{
          fontSize: 72,
          marginBottom: 20,
          filter: `drop-shadow(0 0 24px ${phase.color})`,
          animation: phase.shake ? 'replayShake 0.3s ease-in-out infinite' :
                     phase.glow  ? 'replayGlow 1.5s ease-in-out infinite' : 'none',
        }}>
          {phase.icon}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 'clamp(22px, 3.5vw, 36px)',
          fontWeight: 900,
          color: phase.color,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 10,
          textShadow: `0 0 40px ${phase.color}88`,
          fontFamily: 'Inter, sans-serif',
          animation: phase.flash ? 'replayTextFlash 0.6s ease-in-out infinite' : 'none',
        }}>
          {phase.title}
        </div>

        {/* Subtitle */}
        {phase.subtitle && (
          <div style={{
            fontSize: 17,
            color: 'rgba(255,255,255,0.75)',
            marginBottom: 16,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
          }}>
            {phase.subtitle}
          </div>
        )}

        {/* Detail */}
        {phase.detail && (
          <div style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.9,
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'pre-line',
            maxWidth: 480,
            margin: '0 auto',
          }}>
            {phase.detail}
          </div>
        )}

        {/* KavachBridge badge on saved phase */}
        {phase.id === 'saved' && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 28,
            padding: '14px 32px',
            borderRadius: 16,
            background: 'rgba(0,200,150,0.12)',
            border: '2px solid rgba(0,200,150,0.5)',
            boxShadow: '0 0 40px rgba(0,200,150,0.35)',
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#00C896',
            animation: 'replayGlow 1.2s ease-in-out infinite',
          }}>
            <span style={{ fontSize: 28 }}>🛡</span>
            KavachBridge — Software Safety That Works
          </div>
        )}

        {/* Next phase indicator */}
        {phaseIdx < PHASES.length - 1 && (
          <div style={{
            marginTop: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 11,
            color: 'rgba(255,255,255,0.2)',
          }}>
            <PhaseTimer duration={phase.duration} color={phase.color} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes replayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes replaySlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes replayShake {
          0%, 100% { transform: rotate(-4deg) scale(1); }
          50% { transform: rotate(4deg) scale(1.08); }
        }
        @keyframes replayGlow {
          0%, 100% { filter: drop-shadow(0 0 12px currentColor); }
          50% { filter: drop-shadow(0 0 32px currentColor); }
        }
        @keyframes replayFlash {
          0%, 100% { border-color: rgba(255,68,68,0.4); }
          50% { border-color: rgba(255,68,68,1); box-shadow: inset 0 0 80px rgba(255,68,68,0.15); }
        }
        @keyframes replayTextFlash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

// Thin progress bar at bottom showing how long until next phase
function PhaseTimer({ duration, color }) {
  const [pct, setPct] = useState(100);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setPct(Math.max(0, 100 - (elapsed / duration) * 100));
    }, 50);
    return () => clearInterval(id);
  }, [duration]);

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: color,
        transition: 'width 0.05s linear',
        opacity: 0.5,
      }} />
    </div>
  );
}
