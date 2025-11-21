"use client";

export function CanvasContent({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out delay-[1500ms]"
      data-canvas-content
    >
      {children}
    </div>
  );
}
