"use client";

export function CanvasContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto" data-canvas-content>
      {children}
    </div>
  );
}
