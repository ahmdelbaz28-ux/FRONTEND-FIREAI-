import React, { useState } from 'react';
import { DevicePalette } from './DevicePalette';
import { EngineeringCanvas } from './EngineeringCanvas';
import { useStore, actions, DeviceType } from '@/store/simpleStore';
import { Shield, Activity, AlertTriangle } from 'lucide-react';

export function NexusWorkspace() {
  const [selectedType, setSelectedType] = useState<{type: DeviceType, load: number} | null>(null);
  const errors = useStore(s => s.errors);
  const hasCriticalErrors = errors.some(e => e.severity === 'critical');

  const handleDeviceSelect = (type: DeviceType, load: number) => {
    setSelectedType({ type, load });
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <DevicePalette 
        onSelect={handleDeviceSelect} 
        selectedType={selectedType?.type || null} 
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/50">
          <div className="flex items-center gap-2">
            <Shield className="text-primary h-5 w-5" />
            <span className="font-bold text-sm">NexusCAD Pro: Engineering Workspace</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
             <span className="text-muted-foreground">Auto-Save: Active</span>
             {hasCriticalErrors && (
               <span className="flex items-center gap-1 text-destructive font-bold animate-pulse">
                 <AlertTriangle size={14} /> System Critical
               </span>
             )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative">
           <EngineeringCanvas nextType={selectedType} setNextType={setSelectedType} />
        </div>

        {/* Error Log Bar (Floating) */}
        {errors.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 bg-destructive/10 border border-destructive/50 backdrop-blur-md rounded-lg p-2 max-h-48 overflow-y-auto">
            <div className="flex justify-between items-center mb-2 sticky top-0 bg-transparent">
              <span className="text-xs font-bold text-destructive flex items-center gap-2">
                <Activity size={14} /> System Alerts ({errors.length})
              </span>
              <button onClick={() => actions.clearErrors()} className="text-[10px] text-destructive hover:underline">Clear All</button>
            </div>
            {errors.map(err => (
              <div key={err.id} className="text-xs text-destructive mb-1 flex items-start gap-2">
                <span className="font-mono opacity-50">[{new Date(err.timestamp).toLocaleTimeString()}]</span>
                <span>{err.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
