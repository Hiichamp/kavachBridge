import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function LocoPilotView({ train, onClose }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!train) return;
    fetchToken();
  }, [train]);

  const fetchToken = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/tokens/${train.trainId}`);
      setToken(res.data);
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!token?.expiresAt) return;
    const update = () => {
      const remaining = new Date(token.expiresAt) - Date.now();
      if (remaining <= 0) {
        setCountdown('EXPIRED');
        clearInterval(intervalRef.current);
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${mins}m ${secs.toString().padStart(2, '0')}s remaining`);
    };
    update();
    intervalRef.current = setInterval(update, 1000);
    return () => clearInterval(intervalRef.current);
  }, [token]);

  if (!train) return null;

  const hasValidToken = token && new Date(token.expiresAt) > Date.now();
  const isProceed = hasValidToken && train.zoneType !== 'manual' || hasValidToken;
  const isHold = !hasValidToken && train.zoneType === 'manual';

  return (
    <div className="loco-view-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="loco-tablet">
        {/* Header */}
        <div className="loco-tablet-header">
          <div>
            <div className="loco-tablet-title">🖥 Loco Pilot Terminal</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {train.name}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            id="close-loco-view"
          >
            ✕ Close
          </button>
        </div>

        {/* Body */}
        <div className="loco-tablet-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              ⏳ Loading token data...
            </div>
          ) : (
            <>
              {/* Status Display */}
              <div className={`loco-status-display ${isHold ? 'loco-hold' : 'loco-proceed'}`}>
                <span className="loco-status-icon">
                  {isHold ? '🛑' : '🟢'}
                </span>
                <div className="loco-status-text">
                  {isHold ? 'HOLD' : 'PROCEED'}
                </div>
                {hasValidToken && (
                  <div className="loco-countdown">{countdown}</div>
                )}
                {isHold && (
                  <div style={{ fontSize: 12, color: 'rgba(239,68,68,0.8)', marginTop: 8 }}>
                    Await token from Station Master
                  </div>
                )}
              </div>

              {/* Token Details */}
              {hasValidToken ? (
                <>
                  <div className="loco-token-details">
                    <div className="loco-detail-box">
                      <div className="loco-detail-label">Token ID</div>
                      <div className="loco-detail-value" style={{ fontSize: 12 }}>
                        {token.tokenId}
                      </div>
                    </div>
                    <div className="loco-detail-box">
                      <div className="loco-detail-label">Speed Limit</div>
                      <div className="loco-detail-value" style={{ color: 'var(--transition-yellow)' }}>
                        {token.speedLimit} <span style={{ fontSize: 11, fontWeight: 400 }}>km/h</span>
                      </div>
                    </div>
                    <div className="loco-detail-box">
                      <div className="loco-detail-label">Section (km)</div>
                      <div className="loco-detail-value">
                        {token.fromKm}–{token.toKm}
                      </div>
                    </div>
                    <div className="loco-detail-box">
                      <div className="loco-detail-label">Valid Till</div>
                      <div className="loco-detail-value" style={{ fontSize: 13 }}>
                        {new Date(token.expiresAt).toLocaleTimeString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      fontFamily: 'JetBrains Mono',
                      wordBreak: 'break-all',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                      CRYPTO HASH
                    </span>
                    {token.cryptoHash}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 20,
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📛</div>
                  No active token found for this train.
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    Contact station master at next station.
                  </div>
                </div>
              )}

              <button
                className="btn btn-ghost w-full"
                style={{ marginTop: 12 }}
                onClick={fetchToken}
                id="refresh-token"
              >
                🔄 Refresh Token Status
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
