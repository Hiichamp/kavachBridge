/**
 * SplashScreen.jsx
 * Full-screen splash shown before demo starts. One-click to begin.
 */
import { useEffect, useRef } from 'react';

export default function SplashScreen({ onStart }) {
  const particlesRef = useRef([]);

  // Generate random animated particles
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 4,
    duration: Math.random() * 8 + 6,
  }));

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(ellipse at 40% 50%, #0d1b3e 0%, #060b1a 60%, #020408 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      overflow: 'hidden',
    }}>
      {/* Animated particles */}
      {particles.map((p) => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: '#3b82f6',
          opacity: 0.4,
          animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite alternate`,
        }} />
      ))}

      {/* Grid lines overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Glow orbs */}
      <div style={{
        position: 'absolute',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,208,132,0.08) 0%, transparent 70%)',
        top: '10%',
        left: '10%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
        bottom: '5%',
        right: '5%',
        pointerEvents: 'none',
      }} />

      {/* Main content */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
        {/* Logo */}
        <div style={{
          width: 100,
          height: 100,
          margin: '0 auto 32px',
          background: 'linear-gradient(135deg, #00d084 0%, #3b82f6 50%, #8b5cf6 100%)',
          borderRadius: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          boxShadow: '0 0 60px rgba(0,208,132,0.4), 0 20px 60px rgba(0,0,0,0.5)',
          animation: 'logoPulse 3s ease-in-out infinite',
        }}>
          🛡
        </div>

        {/* Title */}
        <div style={{
          fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 900,
          letterSpacing: '-2px',
          lineHeight: 1,
          marginBottom: 12,
          background: 'linear-gradient(135deg, #ffffff 0%, #94c7ff 50%, #00d084 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          KavachBridge
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 18,
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 500,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Digital Safety Layer for Indian Railways
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.3)',
          marginBottom: 48,
          maxWidth: 480,
          lineHeight: 1.7,
        }}>
          Bridging Kavach-protected and manual zones with cryptographic tokens —
          preventing the next Kanchanjunga.
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 56, flexWrap: 'wrap' }}>
          {[
            { icon: '🚂', label: '3 Live Trains' },
            { icon: '🛤', label: 'Real NE India Tracks' },
            { icon: '🎫', label: 'Auto Token System' },
            { icon: '⚡', label: 'Conflict Detection' },
            { icon: '🔄', label: 'Infinite Loop' },
          ].map((f) => (
            <div key={f.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 100,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 13,
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
            }}>
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Start Button */}
        <button
          id="start-demo-btn"
          onClick={onStart}
          style={{
            padding: '18px 56px',
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 1,
            background: 'linear-gradient(135deg, #00d084, #3b82f6)',
            border: 'none',
            borderRadius: 16,
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 0 40px rgba(0,208,132,0.5), 0 20px 60px rgba(0,0,0,0.4)',
            transition: 'all 0.3s ease',
            animation: 'btnPulse 2.5s ease-in-out infinite',
            fontFamily: 'Inter, sans-serif',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.04)';
            e.currentTarget.style.boxShadow = '0 0 60px rgba(0,208,132,0.7), 0 30px 80px rgba(0,0,0,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 0 40px rgba(0,208,132,0.5), 0 20px 60px rgba(0,0,0,0.4)';
          }}
        >
          ▶ Start Demo
        </button>

        <div style={{
          marginTop: 20,
          fontSize: 12,
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: 0.5,
        }}>
          No interaction required after start · Simulation runs infinitely
        </div>

        {/* Hackathon badge */}
        <div style={{
          marginTop: 48,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 20px',
          borderRadius: 100,
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.2)',
          fontSize: 12,
          color: '#fbbf24',
          fontWeight: 600,
          letterSpacing: 1,
        }}>
          🏆 FAR AWAY Hackathon 2026 — Railways Theme
        </div>
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0) scale(1); opacity: 0.2; }
          to { transform: translateY(-30px) scale(1.5); opacity: 0.6; }
        }
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 60px rgba(0,208,132,0.4), 0 20px 60px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 100px rgba(0,208,132,0.7), 0 20px 80px rgba(0,0,0,0.6); }
        }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(0,208,132,0.5), 0 20px 60px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 70px rgba(59,130,246,0.7), 0 20px 60px rgba(0,0,0,0.4); }
        }
      `}</style>
    </div>
  );
}
