import React from "react";
import { useStore, actions } from "@/store/simpleStore";
import { 
  Sun, Moon, Shield, AlertOctagon, HelpCircle, X, 
  FileText, Book, LifeBuoy, Zap, Battery, Power
} from "lucide-react";

export interface FaultSimulationWorkspaceProps {
  theme?: 'dark' | 'light' | 'blue';
  faults?: string[];
  helpOpen?: boolean;
  onThemeChange?: (theme: 'dark' | 'light' | 'blue') => void;
  onFaultToggle?: (faultId: string) => void;
  onHelpToggle?: () => void;
}

export function FaultSimulationWorkspace(props: FaultSimulationWorkspaceProps) {
  // Fallback to store if props are not provided
  const storeTheme = useStore((s) => s.theme);
  const storeFaults = useStore((s) => s.faults);
  const storeHelpOpen = useStore((s) => s.helpOpen);

  const theme = props.theme ?? storeTheme;
  const faults = props.faults ?? storeFaults;
  const helpOpen = props.helpOpen ?? storeHelpOpen;

  const handleThemeChange = props.onThemeChange ?? actions.setTheme;
  const handleHelpToggle = props.onHelpToggle ?? actions.toggleHelp;
  
  const handleFaultToggle = props.onFaultToggle ?? ((id: string) => {
    if (faults.includes(id)) {
      actions.removeFault(id);
    } else {
      actions.addFault(id);
    }
  });

  const isFaulty = (id: string) => faults.includes(id);

  // Map theme to class
  const themeClass = theme === "dark" ? "dark" : theme === "blue" ? "theme-blue" : "";

  return (
    <div className={`${themeClass} h-screen w-screen overflow-hidden font-sans`}>
      <div className="bg-background text-foreground h-full w-full flex flex-col transition-colors duration-300">
        
        {/* Header */}
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
                onClick={() => handleThemeChange("light")}
                className={`p-1.5 rounded-md ${theme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => handleThemeChange("dark")}
                className={`p-1.5 rounded-md ${theme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => handleThemeChange("blue")}
                className={`px-2 py-1 rounded-md ${theme === "blue" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                <span className="text-[10px] font-bold">BLUE</span>
              </button>
            </div>

            <div className="h-5 w-px bg-border" />

            {/* Help Button */}
            <button 
              onClick={() => handleHelpToggle()}
              className="p-2 rounded-lg bg-muted hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Main Content - Workspace */}
          <div className="flex-1 p-6 flex gap-6 overflow-hidden">
            
            {/* Simulation Canvas (Left) */}
            <div className="flex-1 bg-card rounded-xl border border-border p-6 flex flex-col relative overflow-hidden">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Live Simulation Grid</div>
              
              {/* Simulated Grid/Diagram */}
              <div className="flex-1 flex items-center justify-center gap-12 relative">
                
                {/* Grid Background Effect */}
                <div className="absolute inset-0 opacity-5" style={{ 
                  backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                  backgroundSize: "20px 20px"
                }} />

                {/* Component: Generator */}
                <div className={`relative z-10 p-6 rounded-xl border-2 transition-all duration-500 bg-background/80 backdrop-blur-sm ${
                  isFaulty("gen-01") 
                    ? "border-destructive shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse" 
                    : "border-border shadow-sm"
                }`}>
                  <Zap className={`h-8 w-8 mx-auto mb-2 ${isFaulty("gen-01") ? "text-destructive" : "text-amber-500"}`} />
                  <div className="text-xs font-bold text-center">MAIN GEN</div>
                  <div className="text-[10px] text-center text-muted-foreground mt-1">11 kV / 50Hz</div>
                  
                  {isFaulty("gen-01") && (
                    <div className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground p-1 rounded-full">
                      <AlertOctagon className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Connection Line */}
                <div className={`h-1 w-24 transition-colors duration-500 ${isFaulty("gen-01") || isFaulty("bat-01") ? "bg-destructive animate-pulse" : "bg-primary/50"}`} />

                {/* Component: Battery Bank */}
                <div className={`relative z-10 p-6 rounded-xl border-2 transition-all duration-500 bg-background/80 backdrop-blur-sm ${
                  isFaulty("bat-01") 
                    ? "border-destructive shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse" 
                    : "border-border shadow-sm"
                }`}>
                  <Battery className={`h-8 w-8 mx-auto mb-2 ${isFaulty("bat-01") ? "text-destructive" : "text-emerald-500"}`} />
                  <div className="text-xs font-bold text-center">BATTERY BANK</div>
                  <div className="text-[10px] text-center text-muted-foreground mt-1">220V DC</div>
                  
                  {isFaulty("bat-01") && (
                    <div className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground p-1 rounded-full">
                      <AlertOctagon className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Connection Line */}
                <div className="h-1 w-24 bg-primary/50" />

                {/* Component: Load */}
                <div className="p-6 rounded-xl border border-border bg-background/80 backdrop-blur-sm shadow-sm relative z-10">
                  <Power className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-xs font-bold text-center">CRITICAL LOAD</div>
                  <div className="text-[10px] text-center text-muted-foreground mt-1">MDB-A</div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="h-10 border-t border-border mt-auto -mx-6 -mb-6 bg-muted/50 px-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Active Faults:</span>
                  <span className={`font-bold font-mono ${faults.length > 0 ? "text-destructive" : "text-emerald-500"}`}>
                    {faults.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Current Theme:</span>
                  <span className="font-bold uppercase text-primary">{theme}</span>
                </div>
              </div>
            </div>

            {/* Controls (Right) */}
            <div className="w-80 bg-card rounded-xl border border-border p-6 flex flex-col shrink-0">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Simulation Control</div>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="text-xs font-bold mb-2">Inject Faults</div>
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleFaultToggle("gen-01")}
                      className={`w-full py-2 rounded-md text-xs font-medium transition-colors ${
                        isFaulty("gen-01") ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-muted border border-border hover:bg-accent"
                      }`}
                    >
                      {isFaulty("gen-01") ? "Clear Gen Fault" : "Simulate Gen Overload"}
                    </button>
                    <button 
                      onClick={() => handleFaultToggle("bat-01")}
                      className={`w-full py-2 rounded-md text-xs font-medium transition-colors ${
                        isFaulty("bat-01") ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-muted border border-border hover:bg-accent"
                      }`}
                    >
                      {isFaulty("bat-01") ? "Clear Battery Fault" : "Simulate Battery Failure"}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="text-xs font-bold mb-2">3D Scene Setup</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Scene layers prepared for real-time mesh highlighting on fault injection.
                  </div>
                  <div className="aspect-video bg-background/50 rounded-md border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                    [ 3D Render Placeholder ]
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help Side Panel (Sliding Drawer) */}
          <div className={`absolute top-0 right-0 h-full w-96 bg-card border-l border-border shadow-2xl transition-transform duration-300 transform ${
            helpOpen ? "translate-x-0" : "translate-x-full"
          }`}>
            <div className="h-full flex flex-col">
              <div className="h-14 flex items-center justify-between px-6 border-b border-border bg-muted/50">
                <div className="text-sm font-bold flex items-center gap-2">
                  <Book className="h-4 w-4 text-primary" />
                  <span>NexusCAD Help Center</span>
                </div>
                <button 
                  onClick={() => handleHelpToggle()}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Simulated Markdown Content */}
                <div className="prose prose-sm dark:prose-invert">
                  <div className="flex items-center gap-2 text-primary font-bold mb-1">
                    <FileText className="h-4 w-4" />
                    <span>User Guide: Fault Handling</span>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Welcome to the NexusCAD Pro simulation environment. This section guides you through handling simulated faults.
                  </div>
                  
                  <div className="h-px bg-border my-4" />
                  
                  <h4 className="text-xs font-bold uppercase mb-2">1. Visual Indicators</h4>
                  <p className="text-xs text-muted-foreground">
                    When a fault is injected, the affected component will pulse with a red border and an alert icon will appear. This indicates a critical state requiring attention.
                  </p>
                  
                  <h4 className="text-xs font-bold uppercase mb-2 mt-4">2. Corrective Actions</h4>
                  <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                    <li>Isolate the faulty component.</li>
                    <li>Route power through the backup battery bank if the main generator fails.</li>
                    <li>Verify load flow constraints before re-energizing.</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                  <LifeBuoy className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-blue-500">Need Expert Support?</div>
                    <div className="text-[10px] text-blue-400 mt-0.5 leading-relaxed">
                      Contact our engineering support team for complex fault analysis or system integration questions.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default FaultSimulationWorkspace;
