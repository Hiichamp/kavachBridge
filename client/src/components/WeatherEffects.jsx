import React, { useState } from 'react';

export function WeatherControlModal({ trackId, trackColor, onApply, onClose }) {
  const [duration, setDuration] = useState(4); // default 4 sec
  const [weatherType, setWeatherType] = useState('rain'); // 'rain' | 'fog'

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(10,10,25,0.98)',
      border: `2px solid ${trackColor}`,
      borderRadius: 12,
      padding: 20,
      width: 380,
      zIndex: 10000,
      boxShadow: '0 0 30px rgba(0,0,0,0.8)',
      fontFamily: "'JetBrains Mono', monospace"
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: trackColor, marginBottom: 16 }}>
        ⚠️ WEATHER CONTROL — {trackId.toUpperCase()}
      </div>

      {/* Duration Slider */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 8 }}>
          Weather Duration: {duration}s
        </label>
        <input
          type="range"
          min="2"
          max="8"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          style={{ width: '100%', cursor: 'pointer' }}
        />
        <div style={{ fontSize: 9, color: '#777', marginTop: 4, textAlign: 'center' }}>
          ← 2s | 3s | 4s | 5s | 6s | 7s | 8s →
        </div>
      </div>

      {/* Weather Type Toggle */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: '#aaa', display: 'block', marginBottom: 8 }}>
          Weather Type:
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setWeatherType('rain')}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: weatherType === 'rain' ? trackColor : 'rgba(100,100,120,0.3)',
              border: `1px solid ${weatherType === 'rain' ? trackColor : '#444'}`,
              borderRadius: 6,
              color: weatherType === 'rain' ? '#000' : '#aaa',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ☔ RAIN
          </button>
          <button
            onClick={() => setWeatherType('fog')}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: weatherType === 'fog' ? trackColor : 'rgba(100,100,120,0.3)',
              border: `1px solid ${weatherType === 'fog' ? trackColor : '#444'}`,
              borderRadius: 6,
              color: weatherType === 'fog' ? '#000' : '#aaa',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🌫️ FOG
          </button>
        </div>
      </div>

      {/* Info box */}
      <div style={{
        background: 'rgba(255,200,0,0.1)',
        border: '1px solid #FFD700',
        borderRadius: 6,
        padding: 10,
        marginBottom: 16,
        fontSize: 10,
        color: '#FFD700',
        lineHeight: 1.5
      }}>
        <strong>⚠️ When {weatherType === 'rain' ? 'RAIN' : 'FOG'} is active:</strong>
        <br/>
        • All trains on this track reduce to {weatherType === 'rain' ? '40' : '25'} km/h
        <br/>
        • Signal visibility reduced
        <br/>
        • Manual zone becomes HIGH RISK
        <br/>
        • Duration: {duration} seconds
      </div>

      {/* Apply & Cancel */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => { onApply({ trackId, duration, type: weatherType }); onClose(); }}
          style={{
            flex: 1,
            padding: 10,
            background: trackColor,
            border: 'none',
            borderRadius: 6,
            color: '#000',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          ⚡ APPLY WEATHER
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: 10,
            background: 'rgba(100,100,120,0.2)',
            border: '1px solid #444',
            borderRadius: 6,
            color: '#aaa',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

export function RainOverlay() {
  // Static set of raindrops so they don't re-render wildly
  const [raindrops] = useState(() => Array(100).fill(0).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 0.6
  })));

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 500
      }}
    >
      <defs>
        <style>{
          `@keyframes rainfall {
            0% { transform: translateY(-10px) translateX(0); opacity: 1; }
            100% { transform: translateY(300px) translateX(30px); opacity: 0; }
          }
          .raindrop {
            animation: rainfall 0.6s linear infinite;
          }`
        }</style>
      </defs>
      {raindrops.map(drop => (
        <line
          key={drop.id}
          x1={drop.x + '%'}
          y1={drop.y + '%'}
          x2={drop.x + 2 + '%'}
          y2={drop.y + 3 + '%'}
          stroke="#4DA6FF"
          strokeWidth="2"
          opacity="0.8"
          className="raindrop"
          style={{ animationDelay: drop.delay + 's' }}
        />
      ))}
    </svg>
  );
}

export function FogOverlay() {
  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0,
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at center, rgba(200,200,220,0.2) 0%, rgba(100,100,130,0.4) 100%)',
      pointerEvents: 'none',
      zIndex: 500,
      backdropFilter: 'blur(4px)',
      animation: 'fogDrift 6s ease-in-out infinite'
    }}>
      <style>{
        `@keyframes fogDrift {
          0% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.8; transform: scale(1); }
        }`
      }</style>
    </div>
  );
}
