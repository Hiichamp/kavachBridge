/**
 * MapView.jsx — v2.3 FIXED
 *
 * ROOT CAUSE: CSS `transform: rotate()` on the Leaflet DivIcon wrapper shifts
 * the visual content away from the marker's anchor point, making trains appear
 * at the wrong position on the map.
 *
 * FIX: Never rotate the wrapper div. The icon anchor [cx, cy] must always
 * match the visual center of the un-transformed HTML. Train SVG always faces
 * right (east) — no rotation applied. Direction arrow shown separately inside.
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TRACKS, ALL_STATIONS, MAP_CENTER, MAP_ZOOM } from '../utils/trackData';
import { buildPathMetrics, interpolateAlongPath } from '../utils/trackInterpolation';

const ZONE_COLORS = {
  kavach:     null,        // use track's own color
  manual:     '#FF4444',
};

// ─── Train icon — NO rotation on wrapper, anchor must match visual center ─────
function createTrainIcon(train) {
  const { color, name, speed, zoneType } = train;
  const isManual  = zoneType === 'manual';
  const dot       = isManual ? '#FF4444' : '#00E096';

  // Train SVG naturally faces East (0deg rotation)
  // heading: 0°=North, 90°=East, 180°=South, 270°=West.
  // So if heading=90(East), rotate=0.
  const rotateDeg = (train.heading || 90) - 90;

  const html = `
    <div style="
      position: relative;
      width: 58px;
      height: 52px;
      pointer-events: none;
    ">
      <!-- Name label — centered above train body -->
      <div style="
        position: absolute;
        top: 0;
        left: 0; right: 0;
        text-align: center;
        height: 16px;
        line-height: 16px;
      ">
        <span style="
          display: inline-block;
          background: rgba(8,10,20,0.95);
          color: ${color};
          font-size: 9px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          padding: 1px 5px;
          border-radius: 4px;
          border: 1px solid ${color}66;
          white-space: nowrap;
          letter-spacing: 0.3px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.7);
        ">${name}</span>
      </div>

      <!-- Train SVG (Rotated independently around its center) -->
      <div style="
        position: absolute;
        top: 18px; left: 3px;
        transform: rotate(${rotateDeg}deg);
        transform-origin: 26px 11px;
      ">
        <svg width="52" height="22" viewBox="0 0 52 22" fill="none" xmlns="http://www.w3.org/2000/svg"
             style="display:block; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.7));">

          <!-- Manual zone ring -->
          ${isManual ? `<rect x="1" y="1" width="50" height="16" rx="5"
            fill="none" stroke="#FF4444" stroke-width="1.5"
            stroke-dasharray="4 2" opacity="0.85"/>` : ''}

          <!-- Body -->
          <rect x="3" y="3" width="42" height="12" rx="4"
            fill="${color}" opacity="0.95"/>

          <!-- Cab nose →  -->
          <polygon points="45,3 52,9 45,15" fill="${color}"/>

          <!-- Roof line -->
          <line x1="4" y1="6" x2="44" y2="6"
            stroke="rgba(255,255,255,0.25)" stroke-width="1"/>

          <!-- Windows -->
          <rect x="8"  y="5" width="7" height="6" rx="1.5"
            fill="rgba(200,240,255,0.35)" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>
          <rect x="19" y="5" width="7" height="6" rx="1.5"
            fill="rgba(200,240,255,0.35)" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>
          <rect x="30" y="5" width="7" height="6" rx="1.5"
            fill="rgba(200,240,255,0.35)" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>

          <!-- Chassis -->
          <rect x="3" y="15" width="42" height="3" rx="1"
            fill="rgba(0,0,0,0.4)"/>

          <!-- Wheels -->
          <circle cx="11" cy="19" r="3" fill="#1a1a2e" stroke="${color}" stroke-width="1.2"/>
          <circle cx="11" cy="19" r="1"  fill="${color}" opacity="0.6"/>
          <circle cx="26" cy="19" r="3" fill="#1a1a2e" stroke="${color}" stroke-width="1.2"/>
          <circle cx="26" cy="19" r="1"  fill="${color}" opacity="0.6"/>
          <circle cx="40" cy="19" r="3" fill="#1a1a2e" stroke="${color}" stroke-width="1.2"/>
          <circle cx="40" cy="19" r="1"  fill="${color}" opacity="0.6"/>

          <!-- Headlight -->
          <circle cx="50" cy="9" r="2.2" fill="rgba(255,255,200,0.95)"/>

          <!-- Zone status dot -->
          <circle cx="6" cy="6" r="2.5" fill="${dot}"/>
        </svg>
      </div>

      <!-- Speed badge — sits below train -->
      <div style="
        position: absolute;
        bottom: 0;
        left: 0; right: 0;
        text-align: center;
        height: 12px;
        line-height: 12px;
      ">
        <span style="
          display: inline-block;
          background: rgba(0,0,0,0.9);
          color: #999;
          font-size: 9px;
          font-family: 'JetBrains Mono', monospace;
          padding: 0 5px;
          border-radius: 3px;
          white-space: nowrap;
        ">${Math.round(speed)} km/h</span>
      </div>
    </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize:   [58, 52],
    // anchor = middle of the train SVG body = [29, 29]
    // (18px name label + half of 22px train = 18+11 = 29)
    iconAnchor: [29, 29],
  });
}

// ─── Station icon ─────────────────────────────────────────────────────────────
function createStationIcon(station, glowing) {
  const gc = glowing ? '#FFD700' : '#4a5568';
  return L.divIcon({
    html: `
      <div style="text-align:center; pointer-events:none; width:44px;">
        <div style="
          width:28px; height:28px; margin:0 auto;
          background:rgba(8,12,24,0.92);
          border:2px solid ${gc};
          border-radius:7px;
          display:flex; align-items:center; justify-content:center;
          font-size:13px;
          box-shadow:${glowing ? `0 0 14px ${gc}, 0 0 28px ${gc}44` : '0 2px 8px rgba(0,0,0,0.5)'};
        ">🏛</div>
        <div style="
          font-size:8px; font-weight:700;
          color:${gc};
          font-family:'JetBrains Mono',monospace;
          margin-top:2px; white-space:nowrap;
          text-shadow:${glowing ? `0 0 6px ${gc}` : 'none'};
        ">${station.code}</div>
      </div>`,
    className: '',
    iconSize:   [44, 38],
    iconAnchor: [22, 14],   // top-center of the station box
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MapView({ trains, zones, tokenAnimations, onTrainSelect }) {
  const mapRef            = useRef(null);
  const mapInstance       = useRef(null);
  const trainMarkersRef   = useRef({});
  const segmentLayersRef  = useRef({});
  const stationMarkersRef = useRef({});
  const prevZonesKey      = useRef('');

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center:             MAP_CENTER,
      zoom:               MAP_ZOOM,
      zoomControl:        false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom:    19,
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap · CARTO' }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Legend
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.style.cssText = `
        background:rgba(8,12,24,0.94); border:1px solid rgba(255,255,255,0.07);
        border-radius:12px; padding:14px 16px; font-family:Inter,sans-serif;
        font-size:12px; color:#8896b0; line-height:2.1; backdrop-filter:blur(10px);
        box-shadow:0 4px 24px rgba(0,0,0,0.6);`;
      div.innerHTML = `
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#3d5068;margin-bottom:8px;">Zone Legend</div>
        <div><span style="display:inline-block;width:24px;height:4px;background:#00E096;border-radius:2px;margin-right:8px;box-shadow:0 0 5px #00E096;vertical-align:middle"></span>Kavach Active</div>
        <div><span style="display:inline-block;width:24px;height:4px;background:#FF4444;border-radius:2px;margin-right:8px;box-shadow:0 0 5px #FF4444;vertical-align:middle"></span>Manual / Danger</div>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.05);margin:8px 0">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#3d5068;margin-bottom:6px;">Tracks</div>
        ${TRACKS.map(t => `<div>
          <span style="display:inline-block;width:22px;height:3px;background:${t.color};border-radius:2px;margin-right:8px;vertical-align:middle;box-shadow:0 0 4px ${t.color}"></span>
          <span style="font-size:11px">${t.name}</span>
        </div>`).join('')}
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.05);margin:8px 0">
        <div>🏛 Station Master</div>`;
      return div;
    };
    legend.addTo(map);
    mapInstance.current = map;

    // ── Draw base tracks ────────────────────────────────────────────────────
    TRACKS.forEach((track) => {
      // Glow halo
      L.polyline(track.points, {
        color: track.color, weight: 12, opacity: 0.08,
        lineJoin: 'round', lineCap: 'round',
      }).addTo(map);
      // Base line (visible under zone segments)
      L.polyline(track.points, {
        color: track.color, weight: 4, opacity: 0.22,
        lineJoin: 'round', lineCap: 'round',
      }).addTo(map);
    });


    // ── Station markers ─────────────────────────────────────────────────────
    ALL_STATIONS.forEach((station) => {
      const m = L.marker([station.lat, station.lng], {
        icon: createStationIcon(station, false),
        zIndexOffset: 100,
      }).addTo(map);
      m.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:12px;font-weight:600;
          color:#FFD700;background:#0d1227;border:1px solid rgba(255,215,0,0.2);
          padding:5px 12px;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,0.5);">
          ${station.name}
        </div>`,
        { permanent: false, sticky: true, className: 'custom-tooltip' }
      );
      stationMarkersRef.current[station.stationId] = m;
    });
  }, []);

  // ── Zone-coloured segments ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !zones || !Object.keys(zones).length) return;

    const key = JSON.stringify(zones);
    if (key === prevZonesKey.current) return;
    prevZonesKey.current = key;

    Object.values(segmentLayersRef.current).flat().forEach((l) => l.remove());
    segmentLayersRef.current = {};

    TRACKS.forEach((track) => {
      const trackZones = zones[track.id];
      if (!trackZones) return;

      const layers = [];
      const metrics = buildPathMetrics(track.points);

      trackZones.forEach((seg) => {
        // Interpolate exact geographical points based on progress percentages
        const pts = [];
        const startPt = interpolateAlongPath(metrics, seg.start);
        pts.push([startPt.lat, startPt.lng]);

        let cumKm = 0;
        for (let i = 0; i < track.points.length - 1; i++) {
          const p2 = track.points[i + 1];
          const dist = metrics.segments[i].km;
          
          const p2Progress = (cumKm + dist) / metrics.totalKm;
          if (p2Progress > seg.start && p2Progress < seg.end) {
            pts.push(p2);
          }
          cumKm += dist;
        }

        const endPt = interpolateAlongPath(metrics, seg.end);
        pts.push([endPt.lat, endPt.lng]);

        if (pts.length < 2) return;

        const color    = ZONE_COLORS[seg.zoneType] || track.color;
        const isManual = seg.zoneType === 'manual';

        if (isManual) {
          layers.push(L.polyline(pts, {
            color, weight: 10, opacity: 0.14,
            lineJoin: 'round', lineCap: 'round',
          }).addTo(map));
        }

        layers.push(L.polyline(pts, {
          color,
          weight:    4,
          opacity:   0.90,
          dashArray: isManual ? '16,4' : null,
          lineJoin:  'round',
          lineCap:   'round',
        }).addTo(map));
      });

      segmentLayersRef.current[track.id] = layers;
    });
  }, [zones]);

  // ── Train markers (update every tick) ────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const seen = new Set();

    trains.forEach((train) => {
      seen.add(train.trainId);
      const icon = createTrainIcon(train);

      if (trainMarkersRef.current[train.trainId]) {
        trainMarkersRef.current[train.trainId].setLatLng([train.lat, train.lng]);
        trainMarkersRef.current[train.trainId].setIcon(icon);
      } else {
        const m = L.marker([train.lat, train.lng], {
          icon,
          zIndexOffset: 500,
        }).addTo(map);
        m.on('click', () => onTrainSelect?.(train));
        trainMarkersRef.current[train.trainId] = m;
      }

      // Station glow when non-kavach
      const needsGlow = train.zoneType !== 'kavach';
      TRACKS.find((t) => t.id === train.trackId)
        ?.stations?.forEach((s) => {
          stationMarkersRef.current[s.stationId]
            ?.setIcon(createStationIcon(s, needsGlow));
        });
    });

    // Dim stations on fully-kavach tracks
    const nonKavachTracks = new Set(
      trains.filter((t) => t.zoneType !== 'kavach').map((t) => t.trackId)
    );
    ALL_STATIONS.forEach((s) => {
      const track = TRACKS.find((t) => t.stations.some((st) => st.stationId === s.stationId));
      if (track && !nonKavachTracks.has(track.id)) {
        stationMarkersRef.current[s.stationId]?.setIcon(createStationIcon(s, false));
      }
    });

    // Remove stale markers
    Object.keys(trainMarkersRef.current).forEach((id) => {
      if (!seen.has(id)) {
        trainMarkersRef.current[id].remove();
        delete trainMarkersRef.current[id];
      }
    });
  }, [trains, onTrainSelect]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} id="main-map" />

      {tokenAnimations.map((anim) => (
        <TokenFlyCard key={anim.id} anim={anim} map={mapInstance.current} />
      ))}
    </div>
  );
}

// ── Token animation — dashed line + card pop ──────────────────────────────────
function TokenFlyCard({ anim, map }) {
  if (!map) return null;

  const toPixel = (lat, lng) => {
    try {
      const p = map.latLngToContainerPoint([lat, lng]);
      return { x: p.x, y: p.y };
    } catch { return { x: 60, y: 60 }; }
  };

  const from  = toPixel(anim.stationLat, anim.stationLng);
  const to    = toPixel(anim.trainLat,   anim.trainLng);
  const color = anim.blocked ? '#FF4444' : '#00E096';
  const dx    = to.x - from.x;
  const dy    = to.y - from.y;
  const len   = Math.sqrt(dx * dx + dy * dy) || 1;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 3000 }}>
      {/* Dashed sweep line — only the div is rotated, not a train marker */}
      <div style={{
        position:        'absolute',
        left:            from.x,
        top:             from.y,
        width:           len,
        height:          2,
        transformOrigin: '0 50%',
        transform:       `rotate(${angle}deg)`,
        background:      `repeating-linear-gradient(90deg,${color} 0,${color} 6px,transparent 6px,transparent 12px)`,
        animation:       'lineSweep 1.2s ease-out forwards',
        opacity:         0.85,
      }} />

      {/* Token card pops at train */}
      <div style={{
        position:  'absolute',
        left:      to.x - 50,
        top:       to.y - 36,
        animation: 'cardPop 1.2s ease-out forwards',
      }}>
        <div style={{
          background:   anim.blocked
            ? 'linear-gradient(135deg,#450a0a,#7f1d1d)'
            : 'linear-gradient(135deg,#022c22,#064e3b)',
          border:       `1px solid ${color}`,
          borderRadius: 8,
          padding:      '5px 10px',
          boxShadow:    `0 0 16px ${color}88, 0 4px 20px rgba(0,0,0,0.7)`,
          fontFamily:   "'JetBrains Mono',monospace",
          fontSize:     10,
          fontWeight:   700,
          color:        '#fff',
          whiteSpace:   'nowrap',
        }}>
          <div style={{ color, marginBottom: 2 }}>
            {anim.blocked ? '🚫 BLOCKED' : '🎫 TOKEN ✓'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9 }}>{anim.trainName}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)',  fontSize: 8 }}>SM-{anim.stationCode}</div>
        </div>
      </div>

      <style>{`
        @keyframes lineSweep {
          0%   { clip-path: inset(0 100% 0 0); }
          65%  { clip-path: inset(0 0% 0 0); opacity: 0.85; }
          100% { clip-path: inset(0 0% 0 0); opacity: 0; }
        }
        @keyframes cardPop {
          0%   { opacity:0; transform:scale(0.3) translateY(8px); }
          40%  { opacity:1; transform:scale(1.1) translateY(-3px); }
          65%  { opacity:1; transform:scale(1)   translateY(0); }
          88%  { opacity:1; transform:scale(1)   translateY(0); }
          100% { opacity:0; transform:scale(0.9) translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
