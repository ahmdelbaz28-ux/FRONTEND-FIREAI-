import React from "react";
import { toast } from "sonner";

interface EventLogProps {
  eventLogs: string[];
  dataMode: string;
}

export function EventLog({ eventLogs, dataMode }: EventLogProps) {
  const exportJson = () => {
    if (dataMode === 'mock') {
      toast.error("Export blocked: Simulation Mode does not generate valid engineering data.");
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(eventLogs));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "scada_logs.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SCADA Event Log</div>
        <button 
          onClick={exportJson}
          className={`text-[10px] ${dataMode === 'mock' ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline"}`}
          disabled={dataMode === 'mock'}
          title={dataMode === 'mock' ? "Unavailable in Simulation Mode" : "Export logs"}
        >
          Export JSON
        </button>
      </div>
      <div className="flex-1 bg-background/50 rounded-lg border border-border p-3 overflow-y-auto font-mono text-[10px] space-y-1">
        {eventLogs.map((log, index) => (
          <div key={index} className={`${log.includes("CRITICAL") || log.includes("CASCADE") || log.includes("Alert") ? "text-destructive" : "text-foreground"}`}>
            {log}
          </div>
        ))}
        {eventLogs.length === 0 && (
          <div className="text-muted-foreground italic">No events logged.</div>
        )}
      </div>
    </div>
  );
}

export default EventLog;
