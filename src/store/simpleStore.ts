import { useState, useEffect } from 'react';

// Define the state shape
export interface AppState {
  theme: 'dark' | 'light' | 'blue';
  faults: string[]; // IDs of components with faults
  helpOpen: boolean;
  liveData: {
    voltage: number;
    current: number;
    frequency: number;
  };
  eventLogs: string[];
}

const initialState: AppState = {
  theme: 'dark',
  faults: [],
  helpOpen: false,
  liveData: {
    voltage: 220.5,
    current: 15.2,
    frequency: 50.0,
  },
  eventLogs: [`[SYSTEM] System initialized in Dark mode.`],
};

let state = initialState;
const listeners = new Set<(state: AppState) => void>();

export const setState = (nextState: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
  const updates = typeof nextState === 'function' ? nextState(state) : nextState;
  state = { ...state, ...updates };
  listeners.forEach((listener) => listener(state));
};

export const subscribe = (listener: (state: AppState) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useStore = <T>(selector: (s: AppState) => T): T => {
  const [slice, setSlice] = useState(selector(state));
  
  useEffect(() => {
    const unsubscribe = subscribe((newState) => {
      setSlice(selector(newState));
    });
    return unsubscribe;
  }, [selector]);
  
  return slice;
};

// Helper actions
export const actions = {
  setTheme: (theme: 'dark' | 'light' | 'blue') => setState({ theme }),
  addFault: (faultId: string) => setState((s) => ({ faults: [...s.faults, faultId] })),
  removeFault: (faultId: string) => setState((s) => ({ faults: s.faults.filter((id) => id !== faultId) })),
  toggleHelp: () => setState((s) => ({ helpOpen: !s.helpOpen })),
  updateLiveData: (data: Partial<AppState['liveData']>) => setState((s) => ({ liveData: { ...s.liveData, ...data } })),
  addLog: (log: string) => setState((s) => ({ eventLogs: [...s.eventLogs, `[${new Date().toLocaleTimeString()}] ${log}`] })),
};
