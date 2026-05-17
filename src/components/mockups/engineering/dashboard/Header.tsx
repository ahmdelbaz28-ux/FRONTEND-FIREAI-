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
