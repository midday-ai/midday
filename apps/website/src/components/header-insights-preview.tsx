"use client";

import { Icons } from "@midday/ui/icons";

export function HeaderInsightsPreview() {
  const cardContent = (
    <div className="p-4 space-y-3">
      {/* Title */}
      <div className="text-[10px] font-sans text-muted-foreground">
        Weekly Summary
      </div>

      {/* Main Content */}
      <div className="space-y-2">
        <p className="text-[12px] font-sans leading-relaxed">
          <span className="text-foreground">Revenue </span>
          <span className="text-foreground">$4,200</span>
          <span className="text-foreground">, Expenses </span>
          <span className="text-foreground">$1,800</span>
          <span className="text-foreground">, Net </span>
          <span className="text-foreground">$2,400</span>
          <span className="text-foreground">. </span>
          <span className="text-foreground">3 new customers</span>
          <span className="text-foreground"> onboarded. </span>
          <span className="text-foreground">Strong week!</span>
        </p>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5">
          <Icons.UnMute size={14} className="text-muted-foreground" />
          <span className="text-[10px] font-sans text-muted-foreground">
            Listen to breakdown
          </span>
        </div>
        <button
          type="button"
          className="text-[10px] font-sans text-muted-foreground transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-background">
      {/* Container with border and dotted pattern */}
      <div
        className="w-full h-full border border-border p-4 relative"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--border)) 0.5px, transparent 0)",
          backgroundSize: "6px 6px",
        }}
      >
        {/* Stacked Background Card - Tilted */}
        <div
          className="absolute w-full max-w-[260px] border border-border bg-secondary rotate-[-3deg] translate-x-[-2px] translate-y-[2px]"
          style={{
            zIndex: 0,
            left: "50%",
            top: "50%",
            transform:
              "translate(-50%, -50%) rotate(-3deg) translate(-2px, 2px)",
          }}
        >
          {cardContent}
        </div>

        {/* Main Card */}
        <div
          className="absolute w-full max-w-[260px] border border-border bg-secondary"
          style={{
            zIndex: 1,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {cardContent}
        </div>
      </div>
    </div>
  );
}
