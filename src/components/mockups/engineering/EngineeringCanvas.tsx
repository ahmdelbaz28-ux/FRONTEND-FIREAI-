import React, { useRef, useState, useEffect } from 'react';
import { useStore, actions, DeviceType } from '@/store/simpleStore';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface EngineeringCanvasProps {
  nextType: { type: DeviceType, load: number } | null;
  setNextType: (val: { type: DeviceType, load: number } | null) => void;
}

export function EngineeringCanvas({ nextType, setNextType }: EngineeringCanvasProps) {
  const devices = useStore((s) => s.devices);
  const connections = useStore((s) => s.connections);
  const selectedId = useStore((s) => s.selectedElementId);
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Handle Global Reset Event
  useEffect(() => {
    const handler = () => actions.resetProject();
    window.addEventListener('nexus-reset-project', handler);
    return () => window.removeEventListener('nexus-reset-project', handler);
  }, []);

  const getCoords = (e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleDeviceMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.button === 0) { // Left click
       // If holding Shift, start connection mode
       if (e.shiftKey) {
         setConnectingFrom(id);
       } else {
         setDraggingId(id);
         actions.selectElement(id);
       }
    }
  };

  const handleDeviceMouseUp = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (connectingFrom && connectingFrom !== id) {
      actions.addConnection(connectingFrom, id);
      setConnectingFrom(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCoords(e);
    setMousePos({ x, y });

    if (draggingId) {
      actions.updateDevicePosition(draggingId, x, y);
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setConnectingFrom(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      // Check if it's a device
      if (devices.find(d => d.id === selectedId)) {
        actions.deleteDevice(selectedId);
        actions.selectElement(null);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  const handleCanvasClickWithAdd = (e: React.MouseEvent) => {
    if (!nextType) return;
    if (draggingId || connectingFrom) return;
    
    const { x, y } = getCoords(e);
    actions.addDevice({
      type: nextType.type,
      load: nextType.load,
      voltage: 220,
      x,
      y
    });
    
    setNextType(null); // Reset after add
  };

  return (
    <div className="relative w-full h-full bg-[#0f1115] overflow-hidden cursor-crosshair">
      {/* Overlay Info */}
      <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur p-3 rounded border border-border shadow-lg pointer-events-none">
        <h3 className="text-xs font-bold text-primary mb-1">NexusCAD Engine v1.0</h3>
        <ul className="text-[10px] text-muted-foreground space-y-1">
          <li>• Click Palette to select device type.</li>
          <li>• Click Canvas to place device.</li>
          <li>• Drag Device to move.</li>
          <li>• Shift+Drag between devices to connect.</li>
          <li>• Select & Press Delete to remove.</li>
        </ul>
        {nextType && (
          <div className="mt-2 text-xs text-emerald-400 font-mono">
            Next: {nextType.type} ({nextType.load}A)
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClickWithAdd}
        style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        {/* Connections */}
        {connections.map(conn => {
          const from = devices.find(d => d.id === conn.fromId);
          const to = devices.find(d => d.id === conn.toId);
          if (!from || !to) return null;

          return (
            <g key={conn.id}>
              <line
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke={conn.isOverloaded ? '#ef4444' : '#10b981'}
                strokeWidth={conn.isOverloaded ? 4 : 3}
                strokeDasharray={conn.isOverloaded ? "6,4" : "0"}
                className="transition-all duration-300"
              />
              {conn.isOverloaded && (
                 <circle cx={(from.x+to.x)/2} cy={(from.y+to.y)/2} r="15" fill="#ef4444" fillOpacity="0.2" className="animate-pulse" />
              )}
              <text x={(from.x+to.x)/2} y={(from.y+to.y)/2 - 5} fill="#94a3b8" fontSize="10" textAnchor="middle">{conn.current.toFixed(0)}A</text>
            </g>
          );
        })}

        {/* Drag Line */}
        {connectingFrom && (() => {
          const from = devices.find(d => d.id === connectingFrom);
          if(!from) return null;
          return (
            <line x1={from.x} y1={from.y} x2={mousePos.x} y2={mousePos.y} stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
          );
        })()}

        {/* Devices */}
        {devices.map(dev => (
          <g
            key={dev.id}
            transform={`translate(${dev.x - 30}, ${dev.y - 30})`}
            onMouseDown={(e) => handleDeviceMouseDown(e, dev.id)}
            onMouseUp={(e) => handleDeviceMouseUp(e, dev.id)}
            className="cursor-pointer"
          >
            <rect
              width="60" height="60"
              rx="8"
              fill="#1e293b"
              stroke={selectedId === dev.id ? '#3b82f6' : '#475569'}
              strokeWidth={selectedId === dev.id ? 3 : 2}
              className="transition-colors hover:stroke-primary"
            />
            <text x="30" y="25" textAnchor="middle" fill="#f8fafc" fontSize="20" fontWeight="bold">
              {dev.type[0]}
            </text>
            <text x="30" y="45" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              {dev.load}A
            </text>
            {dev.load > 200 && (
               <circle cx="50" cy="10" r="4" fill="#ef4444" className="animate-pulse" />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
