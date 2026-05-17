import React, { useState } from "react";
import { FaultSimulationWorkspace } from "./FaultSimulationWorkspace";

/**
 * Demo component showing how to integrate FaultSimulationWorkspace
 * with a parent component's state or a global state manager (like Zustand).
 */
export function FaultSimulationIntegrationDemo() {
  // 1. Define state in the parent component (or get it from a store)
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light' | 'blue'>('dark');
  const [activeFaults, setActiveFaults] = useState<string[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // 2. Define callback functions to handle events
  const handleThemeChange = (theme: 'dark' | 'light' | 'blue') => {
    console.log(`Theme changed to: ${theme}`);
    setCurrentTheme(theme);
    // Here you would also update your global app state or local storage
  };

  const handleFaultToggle = (faultId: string) => {
    console.log(`Toggling fault for: ${faultId}`);
    setActiveFaults((prev) => 
      prev.includes(faultId) 
        ? prev.filter((id) => id !== faultId) 
        : [...prev, faultId]
    );
    // Here you would trigger real physical calculations or network requests
  };

  const handleHelpToggle = () => {
    console.log(`Toggling help panel. Current state: ${isHelpOpen}`);
    setIsHelpOpen(!isHelpOpen);
  };

  return (
    <div className="relative h-screen w-screen">
      {/* 
        Pass the state and callbacks as props to the component.
        This separates the presentation (UI) from the logic (State).
      */}
      <FaultSimulationWorkspace 
        theme={currentTheme}
        faults={activeFaults}
        helpOpen={isHelpOpen}
        onThemeChange={handleThemeChange}
        onFaultToggle={handleFaultToggle}
        onHelpToggle={handleHelpToggle}
      />

      {/* Optional: External control panel to demonstrate external interaction */}
      <div className="absolute bottom-4 left-4 bg-background/90 p-4 rounded-lg border border-border shadow-lg max-w-xs text-xs">
        <div className="font-bold mb-2 text-foreground">External Controller (Parent State)</div>
        <p className="text-muted-foreground mb-3">
          This panel is outside the component but controls it via props, proving state is successfully lifted.
        </p>
        <button 
          onClick={() => handleFaultToggle("gen-01")}
          className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
        >
          External Trigger: Gen Fault
        </button>
        <div className="mt-2 text-[10px] text-muted-foreground">
          Active Faults Array: {JSON.stringify(activeFaults)}
        </div>
      </div>
    </div>
  );
}

export default FaultSimulationIntegrationDemo;
