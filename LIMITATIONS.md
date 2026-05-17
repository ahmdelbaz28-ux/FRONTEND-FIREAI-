# Limitations & Disclaimers

This document outlines the current limitations of the NexusCAD Pro mockup system.

## ⚠️ Simulation Notice
This system in its current state is a **simulation and visualization tool only**. The calculations performed by the Web Worker are simplified approximations and are **NOT** verified for real-world engineering decisions.

## Pending Implementations
- **Real Computational Engine**: The current "Gauss-Seidel" style calculation is a placeholder. A real **Newton-Raphson Power Flow Algorithm** must be integrated for production use.
- **Data Integrity**: Data in "Mock" mode is generated randomly or via simple curves and should not be exported for production reports. Export is disabled in Mock mode.

## Memory & Performance
- The 3D scene uses Three.js. Proper cleanup is implemented to prevent memory leaks, but prolonged exposure in complex environments should be monitored.
