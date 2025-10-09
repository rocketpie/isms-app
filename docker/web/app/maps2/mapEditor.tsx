// app/components/MapEditor.tsx
"use client";

import { useEffect, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function MapEditor({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw a simple grid once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Logical size of the large “map” canvas
    const width = 400;
    const height = 400;

    // Handle HiDPI rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing ops for DPR

    // Background
    ctx.fillStyle = "#0b0e12";
    ctx.fillRect(0, 0, width, height);

    // Grid
    const minor = 40; // px
    const majorEvery = 5; // every 5 minors draw a major line

    // Minor lines
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += minor) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += minor) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }

    // Major lines
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.5;

    for (let x = 0; x <= width; x += minor * majorEvery) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += minor * majorEvery) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }

    // Optional origin crosshair
    ctx.strokeStyle = "rgba(0,200,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(80, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 80);
    ctx.stroke();
  }, []);

  return (
    <div className={className ?? "h-full w-full overflow-hidden"}>
      <TransformWrapper
        panning={{ velocityDisabled: true }}
        doubleClick={{ disabled: true }}
        pinch={{ disabled: false }}
        wheel={{ step: 0.2 }}
        minScale={0.25}
        maxScale={3}
        limitToBounds={false} // allow free panning beyond edges
        centerOnInit
      >
        <TransformComponent
          wrapperStyle={{
            width: "100%",
            height: "100%",
            background: "#06080b", // viewport backdrop
            touchAction: "none",
            cursor: "grab",
          }}
          contentStyle={{ touchAction: "none" }}
        >
          {/* Very large canvas you can drag around */}
          <canvas ref={canvasRef} />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
