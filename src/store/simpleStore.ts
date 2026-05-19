import { useState, useEffect } from 'react';

// --- Types ---
export type DeviceType = 'GENERATOR' | 'BATTERY' | 'LOAD' | 'PANEL' | 'SENSOR_MOTION' | 'SENSOR_SMOKE' | 'CAMERA' | 'SPEAKER';

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

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
}

// --- Additional Interfaces ---
export interface AppError {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  relatedElementId?: string;
  elementId?: string;
}
  export interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  properties?: Record<string, unknown>;
  from?: string;
  to?: string;
  voltage?: number;
  load?: number;
}

export interface AppState {
  theme: 'dark' | 'light' | 'blue';
  devices: Device[];
  connections: Connection[];
  errorLog: AppError[];
  errors: AppError[];
  selectedElementId: string | null;
  selectedElement: string | null;
  activePaletteType: DeviceType | null;
  isSidebarOpen: boolean;
  canvasElements: CanvasElement[];
  helpOpen: boolean;
  eventLogs: LogEntry[];
  dataMode: 'live' | 'simulation' | 'demo' | 'mock';
  liveData: Record<string, unknown>;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  voiceActive: boolean;
  faults: Array<{ id: string; type: string; timestamp: number }>;
  setDataMode: (mode: 'live' | 'simulation' | 'demo' | 'mock') => void;
  toggleHelp: () => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  addElement: (element: Omit<CanvasElement, 'id'>) => void;
  removeElement: (id: string) => void;
  pushError: (message: string) => void;
  setSelectedElement: (id: string | null) => void;
  removeFault: (id: string | { id: string }) => void;
  addFault: (fault: { type: string }) => void;
  updateLiveData: (data: Record<string, unknown>) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => void;
  setVoiceActive: (active: boolean) => void;
}

const initialState: AppState = {
  theme: 'dark',
  devices: [],
  connections: [],
  errorLog: [],
  errors: [],
  selectedElementId: null,
  selectedElement: null,
  activePaletteType: null,
  isSidebarOpen: true,
  canvasElements: [],
  helpOpen: false,
  eventLogs: [],
  dataMode: 'demo',
  liveData: {},
  connectionStatus: 'disconnected',
  voiceActive: false,
  faults: [],
  setDataMode: (mode: 'live' | 'simulation' | 'demo' | 'mock') => setState({ dataMode: mode }),
  toggleHelp: () => setState((s) => ({ helpOpen: !s.helpOpen })),
  addLog: (log: string | Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = typeof log === 'string'
      ? { id: `LOG-${Date.now()}`, message: log, type: 'info', timestamp: Date.now() }
      : { ...log, id: `LOG-${Date.now()}`, timestamp: Date.now() };
    setState((s) => ({ eventLogs: [newLog, ...s.eventLogs] }));
  },
  addElement: (element: Omit<CanvasElement, 'id'> | CanvasElement) => {
    const newElement: CanvasElement = 'id' in element ? element : { ...element, id: `EL-${Date.now()}` };
    setState((s) => ({ canvasElements: [...s.canvasElements, newElement] }));
  },
  removeElement: (id: string) => setState((s) => ({ canvasElements: s.canvasElements.filter(el => el.id !== id) })),
  pushError: (message: string | { message: string }) => {
    const msg = typeof message === 'string' ? message : message.message;
    const error: AppError = { id: `ERR-${Date.now()}`, message: msg, severity: 'critical', timestamp: Date.now() };
    setState((s) => ({ errorLog: [error, ...s.errorLog], errors: [error, ...s.errors] }));
  },
  setSelectedElement: (id: string | null) => setState({ selectedElementId: id, selectedElement: id }),
  removeFault: (id: string | { id: string }) => {
    const faultId = typeof id === 'string' ? id : id.id;
    setState((s) => ({ faults: s.faults.filter(f => f.id !== faultId) }));
  },
  addFault: (fault: string | { type: string }) => {
    const faultType = typeof fault === 'string' ? fault : fault.type;
    const newFault = { id: `FAULT-${Date.now()}`, type: faultType, timestamp: Date.now() };
    setState((s) => ({ faults: [...s.faults, newFault] }));
  },
  updateLiveData: (data: Record<string, unknown>) => setState((s) => ({ liveData: { ...s.liveData, ...data } })),
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => setState({ connectionStatus: status }),
  setVoiceActive: (active: boolean) => setState({ voiceActive: active }),
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
  return () => { listeners.delete(listener); };
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
  setSelectedElement: (id: string | null) => setState({ selectedElementId: id, selectedElement: id }),
  setActivePaletteType: (type: DeviceType | null) => setState({ activePaletteType: type }),
  setDataMode: (mode: 'live' | 'simulation' | 'demo' | 'mock') => setState({ dataMode: mode }),
  toggleHelp: () => setState((s) => ({ helpOpen: !s.helpOpen })),
  
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
      if (s.connections.some(c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId))) {
        return s;
      }
      
      const fromDev = s.devices.find(d => d.id === fromId);
      const toDev = s.devices.find(d => d.id === toId);
      
      if (!fromDev || !toDev) return s;

      const combinedLoad = (fromDev.load + toDev.load) / 2;
      const isOverloaded = combinedLoad > 200;

      const newConn: Connection = {
        id: `CONN-${Date.now()}`,
        fromId,
        toId,
        current: combinedLoad,
        isOverloaded
      };

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
    setState((s) => ({ errors: [newError, ...s.errors], errorLog: [newError, ...s.errorLog] }));
  },

  pushError: (message: string | { message: string }) => {
    const msg = typeof message === 'string' ? message : message.message;
    const error: AppError = { id: `ERR-${Date.now()}`, message: msg, severity: 'critical', timestamp: Date.now() };
    setState((s) => ({ errorLog: [error, ...s.errorLog], errors: [error, ...s.errors] }));
  },

  addElement: (element: Omit<CanvasElement, 'id'> | CanvasElement) => {
    const newElement: CanvasElement = 'id' in element ? element : { ...element, id: `EL-${Date.now()}` };
    setState((s) => ({ canvasElements: [...s.canvasElements, newElement] }));
  },

  removeElement: (id: string) => setState((s) => ({ canvasElements: s.canvasElements.filter(el => el.id !== id) })),
  
  addLog: (log: string | Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = typeof log === 'string'
      ? { id: `LOG-${Date.now()}`, message: log, type: 'info', timestamp: Date.now() }
      : { ...log, id: `LOG-${Date.now()}`, timestamp: Date.now() };
    setState((s) => ({ eventLogs: [newLog, ...s.eventLogs] }));
  },

  clearErrors: () => setState({ errors: [], errorLog: [] }),
  
  resetProject: () => {
    setState({ devices: [], connections: [], errors: [], errorLog: [], selectedElementId: null, activePaletteType: null });
    localStorage.removeItem('nexus_project_state');
  },

  addFault: (fault: string | { type: string }) => {
    const faultType = typeof fault === 'string' ? fault : fault.type;
    const newFault = { id: `FAULT-${Date.now()}`, type: faultType, timestamp: Date.now() };
    setState((s) => ({ faults: [...s.faults, newFault] }));
  },

  removeFault: (id: string | { id: string }) => {
    const faultId = typeof id === 'string' ? id : id.id;
    setState((s) => ({ faults: s.faults.filter(f => f.id !== faultId) }));
  },

  updateLiveData: (data: Record<string, unknown>) => setState((s) => ({ liveData: { ...s.liveData, ...data } })),

  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => setState({ connectionStatus: status }),

  setVoiceActive: (active: boolean) => setState({ voiceActive: active }),
};
