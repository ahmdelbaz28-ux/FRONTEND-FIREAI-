import React, { useRef, useState, useEffect } from 'react';
import { useStore, actions, DeviceType } from '@/store/simpleStore';
import { AlertTriangle, Trash2, Zap, Battery, Power, Box, Wifi, Eye, Siren } from 'lucide-react';

interface EngineeringCanvasProps {
  onItemDrop?: () => void;
}

export function EngineeringCanvas({ onItemDrop }: EngineeringCanvasProps) {
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

  // Handle Drop from Library
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    
    try {
      const item = JSON.parse(data);
      if (!svgRef.current) return;
      
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      actions.addDevice({
        type: item.id as DeviceType,
        load: item.defaultLoad,
        voltage: 220,
        x,
        y
      });
      
      if (onItemDrop) onItemDrop(); // Notify parent to clear dragged item
    } catch (err) {
      console.error('Failed to parse dropped item', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Helper to render icon based on type
  const getIcon = (type: DeviceType) => {
    const size = 24;
    switch (type) {
      case 'GENERATOR': return <Zap size={size} className="text-amber-400" />;
      case 'BATTERY': return <Battery size={size} className="text-emerald-400" />;
      case 'LOAD': return <Power size={size} className="text-blue-400" />;
      case 'PANEL': return <Box size={size} className="text-slate-400" />;
      case 'SENSOR_SMOKE': return <Siren size={size} className="text-red-400" />;
      case 'SENSOR_MOTION': return <Wifi size={size} className="text-orange-400" />;
      case 'CAMERA': return <Eye size={size} className="text-purple-400" />;
      case 'SPEAKER': return <Box size={size} className="text-pink-400" />;;
      default: return <Box size={size} />;
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0f1115] overflow-hidden cursor-crosshair">
      {/* Overlay Info */}
      <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur p-3 rounded border border-border shadow-lg pointer-events-none">
        <h3 className="text-xs font-bold text-primary mb-1">NexusCAD Engine v1.2</h3>
        <ul className="text-[10px] text-muted-foreground space-y-1">
          <li>• Drag devices from library and drop here.</li>
          <li>• Drag Device to move.</li>
          <li>• Shift+Drag between devices to connect.</li>
          <li>• Select & Press Delete to remove.</li>
        </ul>
      </div>

      <svg
        ref={svgRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
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
            {/* Render Icon */}
            <g transform="translate(18, 10)">
              {getIcon(dev.type)}
            </g>
            <text x="30" y="50" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
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
