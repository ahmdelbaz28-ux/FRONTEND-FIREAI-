import { useState, useEffect } from 'react';
import { AppState } from '@/types/store';

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
  dataMode: 'mock',
  connectionStatus: 'connected',
};

let state = initialState;
const listeners = new Set<(state: AppState) => void>();

/**
 * Updates the application state and notifies subscribers.
 * @param nextState Partial state or function returning partial state.
 */
export const setState = (nextState: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
  const updates = typeof nextState === 'function' ? nextState(state) : nextState;
  state = { ...state, ...updates };
  listeners.forEach((listener) => listener(state));
};

/**
 * Subscribes to state changes.
 * @param listener Callback function receiving the new state.
 * @returns Unsubscribe function.
 */
export const subscribe = (listener: (state: AppState) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Custom hook to use a slice of the store.
 * @param selector Function to select a slice of state.
 * @returns The selected state slice.
 */
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

/**
 * Helper actions to mutate state.
 */
export const actions = {
  setTheme: (theme: 'dark' | 'light' | 'blue') => setState({ theme }),
  addFault: (faultId: string) => setState((s) => ({ faults: [...s.faults, faultId] })),
  removeFault: (faultId: string) => setState((s) => ({ faults: s.faults.filter((id) => id !== faultId) })),
  toggleHelp: () => setState((s) => ({ helpOpen: !s.helpOpen })),
  updateLiveData: (data: Partial<AppState['liveData']>) => setState((s) => ({ liveData: { ...s.liveData, ...data } })),
  addLog: (log: string) => setState((s) => ({ eventLogs: [...s.eventLogs, `[${new Date().toLocaleTimeString()}] ${log}`] })),
  setDataMode: (dataMode: 'mock' | 'live') => setState({ dataMode }),
  setConnectionStatus: (connectionStatus: 'connected' | 'disconnected') => setState({ connectionStatus }),
};
