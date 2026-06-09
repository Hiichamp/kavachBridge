import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export default function AlertPanel() {
  const { socket } = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [hasCritical, setHasCritical] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('conflict_alert', (alert) => {
      setAlerts((prev) => {
        // Replace or add alert for this pair
        const key = [alert.train1.id, alert.train2.id].sort().join('-');
        const filtered = prev.filter((a) => {
          const k = [a.train1.id, a.train2.id].sort().join('-');
          return k !== key;
        });
        return [{ ...alert, key }, ...filtered].slice(0, 10);
      });

      if (alert.level === 2) setHasCritical(true);
    });

    socket.on('conflict_clear', () => {
      setAlerts([]);
      setHasCritical(false);
    });

    socket.on('demo_reset', () => {
      setAlerts([]);
      setHasCritical(false);
    });

    return () => {
      socket.off('conflict_alert');
      socket.off('conflict_clear');
      socket.off('demo_reset');
    };
  }, [socket]);

  return (
    <>
      {/* Critical red border overlay */}
      {hasCritical && <div className="critical-overlay" aria-hidden="true" />}

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="section-title">
            <span>⚠️</span> Conflict Alerts
            {alerts.length > 0 && (
              <span
                className={`tag ${hasCritical ? 'tag-red' : 'tag-yellow'}`}
                style={{ marginLeft: 6 }}
              >
                {alerts.length}
              </span>
            )}
          </span>
          {alerts.length > 0 && (
            <span
              className="live-indicator"
              style={{ color: hasCritical ? 'var(--danger-red)' : 'var(--transition-yellow)' }}
            >
              <span
                className="live-dot"
                style={{ background: hasCritical ? 'var(--danger-red)' : 'var(--transition-yellow)' }}
              />
              LIVE
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div>All clear — No conflicts detected</div>
            <div className="text-xs text-muted" style={{ marginTop: 4 }}>
              Monitoring {' '}
              <span style={{ color: 'var(--kavach-green)' }}>real-time</span>
            </div>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <AlertBanner key={alert.key || i} alert={alert} />
          ))
        )}
      </div>
    </>
  );
}

function AlertBanner({ alert }) {
  const isLevel2 = alert.level === 2;

  return (
    <div className={`alert-banner alert-level-${alert.level}`} role="alert">
      <div className="alert-header">
        <span className="alert-icon">{isLevel2 ? '🚨' : '⚠️'}</span>
        <div>
          <div className="alert-title">
            {isLevel2
              ? 'CRITICAL — Imminent Collision Risk'
              : 'WARNING — Trains Approaching Same Section'}
          </div>
          {isLevel2 && (
            <div style={{ fontSize: 11, color: 'var(--danger-red)', opacity: 0.8, marginTop: 2 }}>
              Token issuance BLOCKED
            </div>
          )}
        </div>
      </div>

      <div className="alert-detail">
        <span className="alert-detail-chip">🚂 {alert.train1?.name || alert.train1?.id}</span>
        <span style={{ color: 'var(--text-muted)' }}>↔</span>
        <span className="alert-detail-chip">🚂 {alert.train2?.name || alert.train2?.id}</span>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
        <StatItem
          label="Distance"
          value={`${alert.distanceKm} km`}
          danger={parseFloat(alert.distanceKm) < 3}
        />
        <StatItem
          label="Time to Conflict"
          value={`${alert.timeToConflictMin} min`}
          danger={parseFloat(alert.timeToConflictMin) < 3}
        />
        <StatItem
          label="Level"
          value={isLevel2 ? 'CRITICAL' : 'WARNING'}
          danger={isLevel2}
        />
      </div>

      <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
        {new Date(alert.timestamp).toLocaleTimeString('en-IN')}
      </div>
    </div>
  );
}

function StatItem({ label, value, danger }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        fontFamily: 'JetBrains Mono',
        color: danger ? 'var(--danger-red)' : 'var(--transition-yellow)',
      }}>
        {value}
      </span>
    </div>
  );
}
