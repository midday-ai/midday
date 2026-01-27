"use client";

import { useState, useEffect, type ReactNode } from "react";
import { setupMcpListener } from "./mcp-handler";

interface AppWrapperProps<T> {
  children: (data: T) => ReactNode;
  loadingText?: string;
}

/**
 * Wrapper component for MCP Apps that handles message listening and state management
 */
export function AppWrapper<T>({
  children,
  loadingText = "Loading chart data...",
}: AppWrapperProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cleanup = setupMcpListener<T>((result) => {
      try {
        setData(result);
        setError(null);
      } catch (err) {
        setError("Failed to parse chart data");
      }
    });

    return cleanup;
  }, []);

  if (error) {
    return (
      <div className="chart-error">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="chart-loading">
        {loadingText}
      </div>
    );
  }

  return <>{children(data)}</>;
}
