import { useState, useEffect } from 'react';

// --- Types ---
export type DeviceType = 'GENERATOR' | 'BATTERY' | 'LOAD' | 'PANEL';

export interface Device {
  id: string;
  type: DeviceType;
  x: number;
  y: number;
  load: number; // Amperes
  voltage: number;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  current: number; // Calculated current
  isOverloaded: boolean;
}

export interface AppError {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  relatedElementId?: string;
}

export interface AppState {
  theme: 'dark' | 'light' | 'blue';
  devices: Device[];
  connections: Connection[];
  errors: AppError[];
  selectedElementId: string | null;
  activePaletteType: DeviceType | null; // Added to support Palette
  isSidebarOpen: boolean;
}

const initialState: AppState = {
  theme: 'dark',
  devices: [],
  connections: [],
  errors: [],
  selectedElementId: null,
  activePaletteType: null,
  isSidebarOpen: true,
};

// --- State Management Logic ---
let state: AppState = { ...initialState };
const listeners = new Set<(s: AppState) => void>();

// Load from LocalStorage on init
const savedState = localStorage.getItem('nexus_project_state');
if (savedState) {
  try {
    state = { ...initialState, ...JSON.parse(savedState) };
  } catch (e) {
    console.error("Failed to load state", e);
  }
}

export const setState = (nextState: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
  const updates = typeof nextState === 'function' ? nextState(state) : nextState;
  state = { ...state, ...updates };
  
  // Auto-save to LocalStorage
  localStorage.setItem('nexus_project_state', JSON.stringify(state));
  
  listeners.forEach((listener) => listener(state));
};

export const subscribe = (listener: (s: AppState) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useStore = <T>(selector: (s: AppState) => T): T => {
  const [slice, setSlice] = useState(selector(state));
  useEffect(() => {
    const unsubscribe = subscribe((newState) => setSlice(selector(newState)));
    return unsubscribe;
  }, [selector]);
  return slice;
};

// --- Actions ---
export const actions = {
  setTheme: (theme: 'dark' | 'light' | 'blue') => setState({ theme }),
  toggleSidebar: () => setState((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  selectElement: (id: string | null) => setState({ selectedElementId: id }),
  setActivePaletteType: (type: DeviceType | null) => setState({ activePaletteType: type }), // Added
  
  addDevice: (device: Omit<Device, 'id'>) => {
    const newDevice: Device = { ...device, id: `DEV-${Date.now()}` };
    setState((s) => ({ devices: [...s.devices, newDevice] }));
    return newDevice.id;
  },

  updateDevicePosition: (id: string, x: number, y: number) => {
    setState((s) => ({
      devices: s.devices.map(d => d.id === id ? { ...d, x, y } : d)
    }));
  },

  deleteDevice: (id: string) => {
    setState((s) => ({
      devices: s.devices.filter(d => d.id !== id),
      connections: s.connections.filter(c => c.fromId !== id && c.toId !== id)
    }));
  },

  addConnection: (fromId: string, toId: string) => {
    setState((s) => {
      // Check duplicates
      if (s.connections.some(c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId))) {
        return s;
      }
      
      const fromDev = s.devices.find(d => d.id === fromId);
      const toDev = s.devices.find(d => d.id === toId);
      
      if (!fromDev || !toDev) return s;

      // Simple Load Flow Logic: Average load for demo, real logic later
      const combinedLoad = (fromDev.load + toDev.load) / 2;
      const isOverloaded = combinedLoad > 200; // Threshold

      const newConn: Connection = {
        id: `CONN-${Date.now()}`,
        fromId,
        toId,
        current: combinedLoad,
        isOverloaded
      };

      // Trigger Error if overloaded
      if (isOverloaded) {
        actions.addError({
          message: `Overload Detected on connection ${newConn.id} (${combinedLoad.toFixed(1)}A)`,
          severity: 'critical',
          relatedElementId: newConn.id
        });
      }

      return { connections: [...s.connections, newConn] };
    });
  },

  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => {
    const newError: AppError = {
      ...error,
      id: `ERR-${Date.now()}`,
      timestamp: Date.now()
    };
    setState((s) => ({ errors: [newError, ...s.errors] }));
  },

  clearErrors: () => setState({ errors: [] }),
  
  resetProject: () => {
    setState({ devices: [], connections: [], errors: [], selectedElementId: null, activePaletteType: null });
    localStorage.removeItem('nexus_project_state');
  }
};
