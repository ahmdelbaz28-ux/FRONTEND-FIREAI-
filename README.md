# NexusCAD Pro UI - Mockup Sandbox (v1.0.0)

A high-fidelity mockup and prototype for an advanced engineering CAD platform, featuring real-time fault simulation, multi-theme support, and an interactive isometric 3D visualization scene.

## 🌟 Key Features

- **Multi-Theme System**: Includes Dark, Light, and a specialized "Engineering Blue" (SCADA-like) theme with persistent preferences.
- **Intelligent Simulation Engine**: Simulates live data fluctuations (Voltage, Current, Frequency) using a physical "Random Walk" algorithm and handles cascading fault scenarios.
- **Isometric 3D Scene**: A pure HTML5 Canvas implementation of a 3D scene representing Generator, Battery, and Load. Supports dragging to rotate and dynamic color changes on fault detection without external heavy WebGL libraries.
- **SCADA Event Log**: Real-time logging of system events and faults, with functionality to export logs as JSON for analysis.
- **Production-Ready State Management**: A lightweight, dependency-free state store (`simpleStore.ts`) designed for high performance and zero setup overhead.

## 🏗️ Folder Structure

```text
src/
├── components/
│   └── mockups/
│       └── engineering/
│           ├── FaultSimulationWorkspace.tsx  # Main Workspace UI
│           ├── Isometric3DScene.tsx         # Canvas-based 3D scene
│           └── FaultSimulationIntegrationDemo.tsx # Integration Example
├── store/
│   └── simpleStore.ts                        # Lightweight state store
└── types/
    └── store.ts                              # Shared TypeScript types
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm (Recommended for workspace setup)

### Installation & Run
1. Navigate to the project directory:
   ```bash
   cd c:/Users/EWS-01/Desktop/cloud/FRONTEND/NexusCAD-Pro-UI
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the browser at the address shown in the terminal (usually `http://localhost:5173`).

## 🔌 Integration Guide (Moving to Real Data)

To replace the simulation with real data from a backend or sensors:

1. **Disable Mock Mode**: Toggle the `dataMode` switcher to `LIVE` in the UI header.
2. **Hook up WebSockets/APIs**: In `FaultSimulationWorkspace.tsx`, replace the `useEffect` random walk interval with a WebSocket listener.
3. **Dispatch State**: Use `actions.updateLiveData({ ... })` and `actions.addLog("...")` to push real data into the store. The UI and 3D scene will react automatically.

---
*Maintained by the NexusCAD Engineering Team.*
