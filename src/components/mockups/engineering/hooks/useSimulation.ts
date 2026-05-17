import { useEffect } from "react";
import { useStore, actions } from "@/store/simpleStore";

export function useSimulation() {
  const faults = useStore((s) => s.faults);
  const dataMode = useStore((s) => s.dataMode);
  const connectionStatus = useStore((s) => s.connectionStatus);
  const liveData = useStore((s) => s.liveData);

  const isFaulty = (id: string) => faults.includes(id);

  // 1. Simulator: Live Data Fluctuations (Random Walk)
  useEffect(() => {
    const interval = setInterval(() => {
      if (dataMode === 'mock' && connectionStatus === 'connected') {
        const deltaV = (Math.random() - 0.5) * 2; // max step 1V
        const deltaI = (Math.random() - 0.5) * 0.2; // max step 0.1A
        const deltaF = (Math.random() - 0.5) * 0.02; // max step 0.01Hz

        actions.updateLiveData({
          voltage: Math.min(240, Math.max(200, liveData.voltage + deltaV)),
          current: Math.min(20, Math.max(10, liveData.current + deltaI)),
          frequency: Math.min(50.5, Math.max(49.5, liveData.frequency + deltaF)),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [dataMode, connectionStatus, liveData]);

  // 2. Automated Scenario: Gen Overload triggers Battery Failure
  useEffect(() => {
    if (isFaulty("gen-01") && !isFaulty("bat-01") && connectionStatus === 'connected') {
      actions.addLog("CRITICAL: Generator overload detected. Cascading failure risk!");
      const timeout = setTimeout(() => {
        actions.addFault("bat-01");
        actions.addLog("CASCADE FAILURE: Battery bank failed due to sustained generator overload!");
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [faults, connectionStatus]);

  return { faults, isFaulty };
}
