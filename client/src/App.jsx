/**
 * App.jsx — KavachBridge v3.0
 * Added: Black Box Log, SM Alerts, Speed Violations, Kanchanjunga Replay
 */
import { useState } from 'react';
import './index.css';
import SplashScreen          from './components/SplashScreen';
import MapView               from './components/MapView';
import Dashboard             from './components/Dashboard';
import KanchanjungaOverlay   from './components/KanchanjungaOverlay';
import KanchanjungaReplay    from './components/KanchanjungaReplay';
import { useTrainSimulation } from './hooks/useTrainSimulation';

export default function App() {
  const [started, setStarted] = useState(false);

  const {
    running, trains, zones, conflicts, stats,
    tokenLog, tokenAnimations,
    safeModeActive, kanchanjungaActive,
    startSimulation, toggleSafeMode,
    // Feature 1
    incidentLog,
    // Feature 2
    smAlerts, smEscalations,
    // Feature 3
    violations,
    // Feature 4
    replayActive, triggerReplay, onReplayComplete,
  } = useTrainSimulation();

  const handleStart = () => {
    setStarted(true);
    startSimulation();
  };

  return (
    <>
      {!started && <SplashScreen onStart={handleStart} />}

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
            <StatPill value={trains.filter(t => t.zoneType === 'kavach').length} label="Kavach"   color="#00C896" />
            <StatPill value={trains.filter(t => t.zoneType === 'manual').length} label="Manual"   color="#FF4444" />
            <StatPill value={stats.activeTokens       ?? 0} label="Tokens"   color="#4DA6FF" />
            <StatPill value={stats.conflictsPrevented ?? 0} label="Prevented" color="#f59e0b" />
            <StatPill value={`#${stats.loopCount ?? 0}`}   label="Loop"      color="#8b5cf6" />
          </div>

          <div className="header-right">
            <div className="live-badge">
              <span className="live-dot" />
              {running ? 'LIVE' : 'READY'}
            </div>

            {/* Feature 4 — Replay button */}
            {running && (
              <button
                onClick={triggerReplay}
                title="Replay the June 17, 2024 Kanchanjunga crash scenario"
                style={{
                  padding: '7px 13px',
                  background: 'linear-gradient(135deg, #7B0000, #CC0000)',
                  border: '1px solid rgba(255,68,68,0.6)',
                  borderRadius: 6,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(255,0,0,0.3)',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'box-shadow 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.target.style.boxShadow = '0 0 24px rgba(255,0,0,0.6)'}
                onMouseLeave={e => e.target.style.boxShadow = '0 0 12px rgba(255,0,0,0.3)'}
                id="replay-kanchanjunga"
              >
                🔴 Replay Kanchanjunga
              </button>
            )}
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

            {running && (
              <div className="loop-badge">
                🔄 Loop #{stats.loopCount} · {stats.tokensIssuedTotal} tokens · {stats.conflictsPrevented} prevented
              </div>
            )}
          </div>

          {/* Dashboard sidebar with all 4 features wired */}
          <Dashboard
            trains={trains}
            conflicts={conflicts}
            stats={stats}
            tokenLog={tokenLog}
            safeModeActive={safeModeActive}
            onToggleSafeMode={toggleSafeMode}
            incidentLog={incidentLog}
            smAlerts={smAlerts}
            smEscalations={smEscalations}
            violations={violations}
          />
        </div>

        {/* Level 3: Kanchanjunga overlay (natural sim event) */}
        <KanchanjungaOverlay active={kanchanjungaActive} />

        {/* Feature 4: Kanchanjunga Replay (manual button) */}
        {replayActive && (
          <KanchanjungaReplay onComplete={onReplayComplete} />
        )}
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
