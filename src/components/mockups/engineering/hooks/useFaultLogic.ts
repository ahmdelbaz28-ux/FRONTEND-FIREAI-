import { useStore, actions } from "@/store/simpleStore";

export function useFaultLogic() {
  const faults = useStore((s) => s.faults);

  const isFaulty = (id: string) => faults.includes(id);

  const toggleFault = (id: string) => {
    if (isFaulty(id)) {
      actions.removeFault(id);
      actions.addLog(`Fault cleared: ${id}`);
    } else {
      actions.addFault(id);
      actions.addLog(`Fault injected: ${id}`);
    }
  };

  const clearAllFaults = () => {
    // Implement clear all if needed
    faults.forEach(id => actions.removeFault(id));
    actions.addLog("All faults cleared.");
  };

  return { faults, isFaulty, toggleFault, clearAllFaults };
}
