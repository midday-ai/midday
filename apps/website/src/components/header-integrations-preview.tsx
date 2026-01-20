"use client";

import { cn } from "@midday/ui/cn";

export function HeaderIntegrationsPreview() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-background">
      {/* Container with border and dotted pattern */}
      <div
        className="w-full h-full border border-border relative"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--border)) 0.5px, transparent 0)",
          backgroundSize: "6px 6px",
        }}
      >
        {/* Integrations Wordmark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1
            className={cn(
              "font-sans leading-none select-none",
              "text-secondary",
              "text-3xl sm:text-4xl md:text-4xl lg:text-2xl xl:text-5xl 2xl:text-6xl",
              "[WebkitTextStroke:1px_hsl(var(--muted-foreground))]",
              "[textStroke:1px_hsl(var(--muted-foreground))]",
            )}
            style={{
              WebkitTextStroke: "1px hsl(var(--muted-foreground))",
              color: "hsl(var(--secondary))",
            }}
          >
            Integrations
          </h1>
        </div>
      </div>
    </div>
  );
}
