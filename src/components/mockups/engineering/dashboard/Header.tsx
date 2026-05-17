import React from "react";
import { Sun, Moon, Shield, HelpCircle } from "lucide-react";

interface HeaderProps {
  theme: string;
  dataMode: string;
  connectionStatus: string;
  onThemeChange: (theme: string) => void;
  onDataModeChange: (mode: "mock" | "live") => void;
  onHelpToggle: () => void;
}

export function Header({
  theme,
  dataMode,
  connectionStatus,
  onThemeChange,
  onDataModeChange,
  onHelpToggle
}: HeaderProps) {
  return (
    <>
      <div className="h-14 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm uppercase tracking-widest">NexusCAD Pro</span>
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="text-xs font-medium text-muted-foreground">Fault Simulation & Analysis</div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2 relative group cursor-pointer bg-muted p-1.5 rounded-lg">
            <div className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? "bg-green-500 animate-pulse" : "bg-destructive"}`} />
            <span className="text-[10px] font-bold uppercase text-foreground">{connectionStatus}</span>
            
            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-lg p-3 text-[10px] hidden group-hover:block shadow-lg z-50 space-y-1">
              <div className="font-bold text-foreground mb-1">Telemetry Status</div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latency:</span>
                <span className="font-mono text-primary">24ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Update:</span>
                <span className="font-mono">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Packet Loss:</span>
                <span className="font-mono text-green-500">0%</span>
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Theme Switcher */}
          <div className="flex bg-muted p-1 rounded-lg text-xs">
            <button 
              onClick={() => onThemeChange("light")}
              className={`p-1.5 rounded-md ${theme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => onThemeChange("dark")}
              className={`p-1.5 rounded-md ${theme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => onThemeChange("blue")}
              className={`px-2 py-1 rounded-md ${theme === "blue" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <span className="text-[10px] font-bold">BLUE</span>
            </button>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Data Mode Switcher */}
          <div className="flex bg-muted p-1 rounded-lg text-xs">
            <button 
              onClick={() => onDataModeChange("mock")}
              className={`px-2 py-1 rounded-md ${dataMode === "mock" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <span className="text-[10px] font-bold">MOCK</span>
            </button>
            <button 
              onClick={() => onDataModeChange("live")}
              className={`px-2 py-1 rounded-md ${dataMode === "live" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <span className="text-[10px] font-bold">LIVE</span>
            </button>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Help Button */}
          <button 
            onClick={onHelpToggle}
            className="p-2 rounded-lg bg-muted hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Connection Lost Bar */}
      {connectionStatus === 'disconnected' && (
        <div className="bg-destructive text-destructive-foreground text-xs font-bold py-2 px-6 flex items-center justify-between animate-pulse">
          <span>CONNECTION LOST - SHOWING LAST KNOWN VALUES</span>
          <span className="text-[10px] uppercase">Reconnecting...</span>
        </div>
      )}
    </>
  );
}

export default Header;
