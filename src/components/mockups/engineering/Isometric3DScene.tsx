import React, { useRef, useEffect, useState } from "react";
import { useStore } from "@/store/simpleStore";

export function Isometric3DScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faults = useStore((s) => s.faults);
  
  const [angle, setAngle] = useState(0.5); // Y-axis rotation
  const [isDragging, setIsDragging] = useState(false);
  const [lastX, setLastX] = useState(0);

  // Define vertices for a cube
  const cubeVertices = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
  ];

  // Define edges
  const cubeEdges = [
    [0, 1], [1, 2], [2, 3], [3, 0], // Back face
    [4, 5], [5, 6], [6, 7], [7, 4], // Front face
    [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting edges
  ];

  // Define 3 objects with their translations and IDs
  const objects = [
    { id: "gen-01", name: "GENERATOR", x: -3, color: "#f59e0b", faultColor: "#ef4444" },
    { id: "bat-01", name: "BATTERY", x: 0, color: "#10b981", faultColor: "#ef4444" },
    { id: "load-01", name: "LOAD", x: 3, color: "#3b82f6", faultColor: "#ef4444" }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    /**
     * The main rendering loop.
     * Clears the canvas, applies rotations, and draws the grid and objects.
     */
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const scale = 30; // Scale factor for rendering
      
      // Fixed tilt (X-axis rotation) to simulate isometric view
      const tilt = Math.PI / 6; // 30 degrees
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);
      
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Draw ground grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let x = -5; x <= 5; x++) {
        drawLine(ctx, x, 1, -5, x, 1, 5, cosAngle, sinAngle, cosTilt, sinTilt, scale, width, height);
        drawLine(ctx, -5, 1, x, 5, 1, x, cosAngle, sinAngle, cosTilt, sinTilt, scale, width, height);
      }

      // Draw objects
      objects.forEach((obj) => {
        const isFaulty = faults.includes(obj.id);
        const baseColor = isFaulty ? obj.faultColor : obj.color;
        
        // Add a pulsing effect for faults
        const color = isFaulty && Math.sin(Date.now() / 200) > 0 
          ? "#ffffff" 
          : baseColor;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.fillStyle = color + "22"; // Transparent fill

        // Draw cube edges
        cubeEdges.forEach((edge) => {
          const v1 = cubeVertices[edge[0]];
          const v2 = cubeVertices[edge[1]];
          
          drawLine(
            ctx, 
            v1[0] + obj.x, v1[1], v1[2], 
            v2[0] + obj.x, v2[1], v2[2], 
            cosAngle, sinAngle, cosTilt, sinTilt, scale, width, height
          );
        });

        // Draw name label
        const [px, py] = project(obj.x, -1.5, 0, cosAngle, sinAngle, cosTilt, sinTilt, scale, width, height);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(obj.name, px, py);
        
        if (isFaulty) {
          ctx.fillStyle = "#ef4444";
          ctx.fillText("FAULT", px, py + 12);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [angle, faults]);

  /**
   * Projects a 3D coordinate to a 2D screen coordinate.
   * Applies Y-axis rotation (user controlled) and fixed X-axis tilt (isometric feel).
   * @returns [screenX, screenY]
   */
  const project = (
    x: number, y: number, z: number, 
    cosA: number, sinA: number, 
    cosT: number, sinT: number, 
    scale: number, width: number, height: number
  ): [number, number] => {
    // 1. Rotate around Y axis (User interaction)
    const rx = x * cosA - z * sinA;
    const rz = x * sinA + z * cosA;
    
    // 2. Rotate around X axis (Fixed tilt for isometric feel)
    const ry = y * cosT - rz * sinT;
    // const rrz = y * sinT + rz * cosT; // We don't need Z for screen projection
    
    // 3. Project to screen
    const px = rx * scale + width / 2;
    const py = ry * scale + height / 2;
    
    return [px, py];
  };

  // Helper to draw a line in 3D space
  const drawLine = (
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    cosA: number, sinA: number,
    cosT: number, sinT: number,
    scale: number, width: number, height: number
  ) => {
    const [p1x, p1y] = project(x1, y1, z1, cosA, sinA, cosT, sinT, scale, width, height);
    const [p2x, p2y] = project(x2, y2, z2, cosA, sinA, cosT, sinT, scale, width, height);
    
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.stroke();
  };

  // Interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastX;
    setAngle((a) => a + deltaX * 0.01);
    setLastX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="w-full h-full relative cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={150} 
        className="w-full h-full"
      />
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border">
        Drag to rotate
      </div>
    </div>
  );
}

export default Isometric3DScene;
