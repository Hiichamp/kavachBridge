import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const API = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function TokenPanel({ trains, safeModeActive }) {
  const { socket } = useSocket();
  const [tokenResults, setTokenResults] = useState({});
  const [tokenLog, setTokenLog] = useState([]);
  const [issuing, setIssuing] = useState({});
  const [formState, setFormState] = useState({});

  const manualTrains = trains.filter((t) => t.zoneType === 'manual');

  // Load token log on mount
  useEffect(() => {
    axios.get(`${API}/api/tokens`).then((r) => setTokenLog(r.data)).catch(() => {});
  }, []);

  // Listen for new tokens issued by anyone
  useEffect(() => {
    if (!socket) return;
    socket.on('token_issued', (token) => {
      setTokenLog((prev) => [token, ...prev].slice(0, 30));
    });
    return () => socket.off('token_issued');
  }, [socket]);

  const initForm = (trainId) => ({
    stationId: 'KIR',
    fromKm: 412,
    toKm: 458,
    issuedBy: 'SM-Katihar',
  });

  const handleFormChange = (trainId, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [trainId]: { ...(prev[trainId] || initForm(trainId)), [field]: value },
    }));
  };

  const handleIssueToken = async (train) => {
    const form = formState[train.trainId] || initForm(train.trainId);
    setIssuing((p) => ({ ...p, [train.trainId]: true }));

    try {
      const res = await axios.post(`${API}/api/tokens/issue`, {
        trainId: train.trainId,
        stationId: form.stationId,
        fromKm: Number(form.fromKm),
        toKm: Number(form.toKm),
        issuedBy: form.issuedBy,
      });

      setTokenResults((p) => ({ ...p, [train.trainId]: res.data }));

      if (!res.data.blocked && res.data.token) {
        setTokenLog((prev) => [res.data.token, ...prev].slice(0, 30));
      }
    } catch (err) {
      setTokenResults((p) => ({
        ...p,
        [train.trainId]: { blocked: true, reason: 'Server error: ' + err.message },
      }));
    } finally {
      setIssuing((p) => ({ ...p, [train.trainId]: false }));
    }
  };

  return (
    <div className="token-panel">
      {/* Section: Trains in Manual Zone */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="section-title">
            <span>🚂</span> Manual Zone Trains
            {manualTrains.length > 0 && (
              <span className="tag tag-red" style={{ marginLeft: 6 }}>{manualTrains.length}</span>
            )}
          </span>
          {safeModeActive && (
            <span className="tag tag-yellow">Safe Mode</span>
          )}
        </div>

        {manualTrains.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🟢</div>
            <div>No trains in manual zone</div>
            <div className="text-xs text-muted" style={{ marginTop: 4 }}>
              Start demo to see trains
            </div>
          </div>
        ) : (
          manualTrains.map((train) => {
            const result = tokenResults[train.trainId];
            const form = formState[train.trainId] || initForm(train.trainId);
            const isLoading = issuing[train.trainId];

            return (
              <div key={train.trainId} style={{ marginBottom: 16 }}>
                <div className="card" style={{ marginBottom: 8 }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {train.name}
                      </div>
                      <div className="flex gap-1 mt-1">
                        <span className="zone-badge zone-manual">Manual Zone</span>
                        <span className="tag tag-blue">{train.trackSegment}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger-red)', fontFamily: 'JetBrains Mono' }}>
                        {train.speed}
                      </div>
                      <div className="text-xs text-muted">km/h</div>
                    </div>
                  </div>

                  {/* Token Form */}
                  <div className="divider" />
                  <div className="input-row">
                    <div className="input-group">
                      <label className="input-label">Station ID</label>
                      <input
                        className="input"
                        value={form.stationId}
                        onChange={(e) => handleFormChange(train.trainId, 'stationId', e.target.value)}
                        placeholder="KIR"
                        id={`station-${train.trainId}`}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Issued By</label>
                      <input
                        className="input"
                        value={form.issuedBy}
                        onChange={(e) => handleFormChange(train.trainId, 'issuedBy', e.target.value)}
                        placeholder="SM-Katihar"
                        id={`issued-by-${train.trainId}`}
                      />
                    </div>
                  </div>
                  <div className="input-row">
                    <div className="input-group">
                      <label className="input-label">From Km</label>
                      <input
                        className="input"
                        type="number"
                        value={form.fromKm}
                        onChange={(e) => handleFormChange(train.trainId, 'fromKm', e.target.value)}
                        id={`from-km-${train.trainId}`}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">To Km</label>
                      <input
                        className="input"
                        type="number"
                        value={form.toKm}
                        onChange={(e) => handleFormChange(train.trainId, 'toKm', e.target.value)}
                        id={`to-km-${train.trainId}`}
                      />
                    </div>
                  </div>

                  <button
                    className={`btn btn-success w-full ${isLoading ? '' : ''}`}
                    style={{ marginTop: 8 }}
                    onClick={() => handleIssueToken(train)}
                    disabled={isLoading || safeModeActive}
                    id={`issue-token-${train.trainId}`}
                  >
                    {isLoading ? (
                      <>⏳ Issuing Token...</>
                    ) : (
                      <>🎫 Issue Digital Token</>
                    )}
                  </button>
                </div>

                {/* Token Result */}
                {result && (
                  <TokenResultCard result={result} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Token Log */}
      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-section-header">
          <span className="section-title">
            <span>📋</span> Token Log
          </span>
          <span className="text-xs text-muted">{tokenLog.length} records</span>
        </div>

        {tokenLog.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div>No tokens issued yet</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="token-log-table">
              <thead>
                <tr>
                  <th>Token ID</th>
                  <th>Train</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tokenLog.map((token, i) => {
                  const exp = new Date(token.expiresAt);
                  const expired = exp < new Date();
                  const status = expired ? 'expired' : token.status;

                  return (
                    <tr key={token.tokenId || i}>
                      <td className="text-mono" style={{ fontSize: 10 }}>
                        {token.tokenId?.slice(0, 12)}
                      </td>
                      <td style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {token.trainName || token.trainId}
                      </td>
                      <td className="text-mono" style={{ fontSize: 10 }}>
                        {exp.toLocaleTimeString('en-IN')}
                      </td>
                      <td>
                        <span className={`status-${status}`}>
                          {status === 'active' ? '✅' : status === 'expired' ? '⏱' : '🚫'}{' '}
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TokenResultCard({ result }) {
  if (!result) return null;

  if (result.blocked) {
    return (
      <div className="token-result-card token-blocked">
        <div className="token-result-title">🚫 Token Blocked</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {result.reason}
        </div>
      </div>
    );
  }

  const token = result.token;
  const exp = new Date(token.expiresAt);

  return (
    <div className="token-result-card token-success">
      <div className="token-result-title">✅ Token Issued Successfully</div>
      <div className="token-detail-row">
        <span className="token-detail-label">Token ID</span>
        <span className="token-detail-value">{token.tokenId}</span>
      </div>
      <div className="token-detail-row">
        <span className="token-detail-label">Speed Limit</span>
        <span className="token-detail-value">{token.speedLimit} km/h</span>
      </div>
      <div className="token-detail-row">
        <span className="token-detail-label">Km Range</span>
        <span className="token-detail-value">{token.fromKm}–{token.toKm} km</span>
      </div>
      <div className="token-detail-row">
        <span className="token-detail-label">Valid Till</span>
        <span className="token-detail-value">{exp.toLocaleTimeString('en-IN')}</span>
      </div>
      <div className="token-detail-row">
        <span className="token-detail-label">Hash</span>
        <span className="token-detail-value" style={{ fontSize: 9 }}>{token.cryptoHash?.slice(0, 18)}…</span>
      </div>
    </div>
  );
}
