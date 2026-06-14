<div align="center">
  <h1>🛡️ KavachBridge</h1>
  <p><b>Bridging the gap between Kavach-protected and manual railway zones to prevent the next Kanchanjunga.</b></p>
  <p><i>Built for FAR AWAY Hackathon 2026 — Railways Theme</i></p>
</div>

---

## 🚂 The Real Problem — Kanchanjunga Reference

On June 17, 2024, the Kanchanjunga Express collided with a goods train near New Jalpaiguri in West Bengal, resulting in devastating loss of life and injuries. 
**The root cause:** The goods train entered a manual block section without proper digital token authority, and the automated *Kavach* collision-avoidance system was not installed on that specific stretch.

**KavachBridge v2** is a real-time, infinitely looping simulation demonstrating exactly how a **dynamic digital token system** could have bridged the gap between electrified Kavach zones and older, manually-operated corridors to prevent such disasters.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 🗺️ **Geospatial Mapping** | Real NE India railway corridor coordinates (Siliguri→Patna, NJP→Guwahati, Hill Branch) rendered accurately on Leaflet.js. |
| 🚥 **Live Track Zoning** | Tracks are segmented into **Kavach (Green)** and **Manual (Red)** zones, which randomize dynamically on each loop. |
| 🌧️ **Dynamic Weather Engine** | Interactive track-specific weather controls! Inject **Rain (40km/h limit)** or **Fog (25km/h limit)** to instantly reduce train speeds system-wide. |
| 🎫 **Automated Token Handshake** | Trains automatically halt at Manual zones to securely request, receive, and animate digital authorization tokens from nearest stations. |
| 🚨 **Conflict Resolution** | Real-time multi-level alerts cascading from *Zone Warnings* → *Critical Proximity* → *Kanchanjunga Protocol Resolution*. |
| 🔒 **Network Cut Simulation** | "Safe Mode" toggle simulates a total network blackout, forcing trains into fail-safe crawling speeds. |
| 🔄 **Infinite Autonomy** | Sit back and watch. The simulation loops infinitely with auto-regenerating zones and non-stop moving SVG trains. |

---

## 🛠️ Tech Stack

**Frontend (React + Vite)**
- **React 19** for dynamic UI and component states.
- **Leaflet.js** for high-performance map rendering and geographic polyline interpolation.
- **GSAP** for smooth token flight animations.
- **Tailwind-inspired Vanilla CSS** for a premium dark-mode aesthetic.

**Backend (Node.js)**
- **Express.js** + **Socket.io** for real-time telemetry and state synchronization.
- **MongoDB** for state persistence (with auto-fallback to blazing fast In-Memory mode).

---

## 🚀 Getting Started

The application is split into a client and a server. You will need to run both simultaneously.

### 1. Install Dependencies
```bash
# Install client packages
cd client
npm install

# Install server packages
cd ../server
npm install
```

### 2. Start the Engine
Open two separate terminal windows.

**Terminal 1 (Backend Engine)**
```bash
cd server
npm start
```

**Terminal 2 (Frontend UI)**
```bash
cd client
npm run dev
```

### 3. Run the Simulation
- Open your browser to [http://localhost:5173](http://localhost:5173).
- Click **"▶ Start Demo"** on the splash screen.
- The entire simulation will begin running autonomously!

> **Note:** MongoDB is strictly optional. If a local instance is not detected, the backend will intelligently fallback to in-memory mode seamlessly.

---

## 📂 Architecture Overview

```text
kavachBridge/
├── client/src/
│   ├── components/
│   │   ├── MapView.jsx          # Geographic track rendering & train icons
│   │   ├── Dashboard.jsx        # Real-time telemetry, tokens, and speeds
│   │   ├── WeatherEffects.jsx   # Interactive rain/fog simulation engine
│   │   └── KanchanjungaOverlay.jsx # Disaster resolution screen
│   ├── hooks/
│   │   └── useTrainSimulation.js # The 200ms central tick loop engine
│   └── utils/
│       ├── trackInterpolation.js # Complex Haversine path mathematics
│       └── zoneGenerator.js      # Zone distribution logic
└── server/
    ├── models/
    │   ├── Token.js              # Mongoose schema for tracking cryptographic tokens
    │   ├── Train.js              # Mongoose schema for persistent train state
    │   └── Zone.js               # Mongoose schema for track segments
    ├── routes/
    │   ├── tokens.js             # REST API for token issuance and expiration
    │   └── trains.js             # REST API for retrieving active train stats
    ├── sockets/
    │   └── trainSocket.js        # Bi-directional WebSocket logic for real-time UI updates
    ├── engine/
    │   └── conflictDetector.js   # Backend redundancy check for collision risks
    ├── index.js                  # Express.js entry point and MongoDB connection
    └── trainSimulator.js         # Standalone backend simulation worker script
```

---

<div align="center">
  <b>KavachBridge</b> — Safeguarding the future of Indian Railways.
</div>