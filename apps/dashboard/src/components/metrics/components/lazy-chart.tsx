"use client";

import { type ReactNode, useEffect, useState } from "react";

const STAGGER_MS = 80;

interface LazyChartProps {
  children: ReactNode;
  index: number;
  height?: number;
}

export function LazyChart({ children, index, height = 500 }: LazyChartProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), index * STAGGER_MS);
    return () => clearTimeout(timer);
  }, [index]);

  if (ready) {
    return <>{children}</>;
  }

  return (
    <div
      className="border border-border bg-background animate-pulse"
      style={{ minHeight: height }}
    />
  );
}
