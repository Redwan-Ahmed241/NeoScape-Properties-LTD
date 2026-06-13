import React, { useRef, useState, useEffect } from "react";
import { X, Check } from "lucide-react";

interface SignatureCanvasProps {
  onSave: (svgContent: string) => void;
  onCancel: () => void;
}

export default function SignatureCanvas({ onSave, onCancel }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set line styles
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support mouse and touch events
    let clientX, clientY;
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Account for responsive scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    setIsDrawing(true);
    setPoints([coords]);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    setPoints((prev) => [...prev, coords]);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (points.length > 0) {
      setStrokes((prev) => [...prev, points]);
    }
    setPoints([]);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    setPoints([]);
  };

  const handleConfirm = () => {
    if (strokes.length === 0) return;
    
    // Construct SVG elements string
    let pathD = "";
    strokes.forEach((stroke) => {
      if (stroke.length === 0) return;
      pathD += `M ${stroke[0].x.toFixed(1)} ${stroke[0].y.toFixed(1)} `;
      for (let i = 1; i < stroke.length; i++) {
        pathD += `L ${stroke[i].x.toFixed(1)} ${stroke[i].y.toFixed(1)} `;
      }
    });

    const canvasWidth = canvasRef.current?.width || 500;
    const canvasHeight = canvasRef.current?.height || 200;

    const svgContent = `<svg viewBox="0 0 ${canvasWidth} ${canvasHeight}" xmlns="http://www.w3.org/2000/svg" style="fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;"><path d="${pathD.trim()}" /></svg>`;
    
    onSave(svgContent);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div 
        className="rounded-xl overflow-hidden border border-white/10"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[200px] cursor-crosshair touch-none"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={clearCanvas}
          className="px-4 py-2 border border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-xs font-semibold rounded-lg transition-all"
        >
          Clear Pad
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-2 border border-white/10 text-white hover:bg-white/5 text-xs font-semibold rounded-lg transition-all"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={strokes.length === 0}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              strokes.length > 0 
                ? "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer" 
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            <Check className="w-3.5 h-3.5" /> Confirm Signature
          </button>
        </div>
      </div>
    </div>
  );
}
