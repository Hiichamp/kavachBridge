/**
 * App.jsx — KavachBridge v2.1 FIXED
 * Removed stale `tokens` prop. Updated stat pill colors to match new palette.
 */
import { useState } from 'react';
import './index.css';
import SplashScreen from './components/SplashScreen';
import MapView from './components/MapView';
import Dashboard from './components/Dashboard';
import KanchanjungaOverlay from './components/KanchanjungaOverlay';
import { WeatherControlModal, RainOverlay, FogOverlay } from './components/WeatherEffects';
import { useTrainSimulation } from './hooks/useTrainSimulation';

export default function App() {
  const [started, setStarted] = useState(false);
  const [weatherModal, setWeatherModal] = useState({ visible: false, trackId: '', trackColor: '' });

  const {
    running,
    trains,
    zones,
    conflicts,
    stats,
    tokenAnimations,
    safeModeActive,
    kanchanjungaActive,
    tokenLog,
    activeWeather,
    applyWeather,
    startSimulation,
    toggleSafeMode,
  } = useTrainSimulation();

  // Expose global function for map buttons
  if (typeof window !== 'undefined') {
    window.openWeatherModal = (trackId, color) => {
      setWeatherModal({ visible: true, trackId, trackColor: color });
    };
  }

  const handleStart = () => {
    setStarted(true);
    startSimulation();
  };

  return (
    <>
      {/* Splash — shown until "Start Demo" clicked */}
      {!started && <SplashScreen onStart={handleStart} />}

      {/* Main app shell — always rendered so Leaflet map initialises */}
      <div className="app-v2">

        {/* ── Header ── */}
        <header className="header-v2">
          <div className="header-brand">
            <div className="brand-logo-v2">🛡</div>
            <div>
              <div className="brand-name">KavachBridge</div>
              <div className="brand-sub">Northeast India Railway Safety Simulation</div>
            </div>
          </div>

          {/* Live stat pills */}
          <div className="header-stats">
            <StatPill
              value={trains.filter((t) => t.zoneType === 'kavach').length}
              label="Kavach" color="#00C896"
            />
            <StatPill
              value={trains.filter((t) => t.zoneType === 'manual').length}
              label="Manual" color="#FF4444"
            />
            <StatPill value={stats.activeTokens ?? 0}           label="Tokens"   color="#4DA6FF" />
            <StatPill value={stats.conflictsPrevented ?? 0}     label="Prevented" color="#f59e0b" />
            <StatPill value={`#${stats.loopCount ?? 0}`}        label="Loop"     color="#8b5cf6" />
          </div>

          <div className="header-right">
            <div className="live-badge">
              <span className="live-dot" />
              {running ? 'LIVE' : 'READY'}
            </div>
          </div>
        </header>

        {/* Safe mode banner */}
        {safeModeActive && (
          <div className="safemode-banner">
            <span>🔒</span>
            <div>
              <div className="safemode-title">SAFE MODE ACTIVE — Network Cut Simulated</div>
              <div className="safemode-sub">Token issuance suspended · Trains crawling in manual zones</div>
            </div>
          </div>
        )}

        {/* Map + sidebar */}
        <div className="main-area" style={{ paddingTop: safeModeActive ? 56 : 0 }}>
          <div className="map-container">
            <MapView
              trains={trains}
              zones={zones}
              tokenAnimations={tokenAnimations}
              onTrainSelect={() => {}}
            />

            {/* Weather overlays */}
            {Object.values(activeWeather).some(w => w.type === 'rain') && <RainOverlay />}
            {Object.values(activeWeather).some(w => w.type === 'fog')  && <FogOverlay />}

            {running && (
              <div className="loop-badge">
                🔄 Loop #{stats.loopCount} · {stats.tokensIssuedTotal} tokens · {stats.conflictsPrevented} prevented
              </div>
            )}
          </div>

          <Dashboard
            trains={trains}
            conflicts={conflicts}
            stats={stats}
            tokenLog={tokenLog}
            safeModeActive={safeModeActive}
            activeWeather={activeWeather}
            onToggleSafeMode={toggleSafeMode}
          />
        </div>

        {/* Modals & Overlays */}
        {weatherModal.visible && (
          <WeatherControlModal
            trackId={weatherModal.trackId}
            trackColor={weatherModal.trackColor}
            onApply={({ trackId, duration, type }) => {
              applyWeather(trackId, duration, type);
            }}
            onClose={() => setWeatherModal({ visible: false, trackId: '', trackColor: '' })}
          />
        )}

        {/* Level 3: Kanchanjunga overlay */}
        <KanchanjungaOverlay active={kanchanjungaActive} />
      </div>
    </>
  );
}

function StatPill({ value, label, color }) {
  return (
    <div className="header-pill">
      <span className="pill-value" style={{ color }}>{value}</span>
      {label && <span className="pill-label">{label}</span>}
    </div>
  );
}
