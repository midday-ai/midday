"use client";

import { useEffect, useState } from "react";
import { fetchStatus } from "@/actions/fetch-status";
import { cn } from "@midday/ui/cn";

export function StatusWidget() {
  const [status, setStatus] = useState("operational");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetchStatus();

        if (response) {
          setStatus(response);
        }
      } catch {}
    }

    fetchData();
  }, []);

  const getStatusLevel = (level) => {
    return {
      operational: {
        label: "Operational",
        color: "bg-green-500",
        color2: "bg-green-400",
      },
      degraded_performance: {
        label: "Degraded Performance",
        color: "bg-yellow-500",
        color2: "bg-yellow-400",
      },
      partial_outage: {
        label: "Partial Outage",
        color: "bg-yellow-500",
        color2: "bg-yellow-400",
      },
      major_outage: {
        label: "Major Outage",
        color: "bg-red-500",
        color2: "bg-red-400",
      },
      unknown: {
        label: "Unknown",
        color: "bg-gray-500",
        color2: "bg-gray-400",
      },
      incident: {
        label: "Incident",
        color: "bg-yellow-500",
        color2: "bg-yellow-400",
      },
      under_maintenance: {
        label: "Under Maintenance",
        color: "bg-gray-500",
        color2: "bg-gray-400",
      },
    }[level];
  };

  const level = getStatusLevel(status);

  if (!level) {
    return null;
  }

  return (
    <a
      className="flex w-full items-center justify-between space-x-2 rounded-full border border-border px-3 py-1.5"
      href="https://solomon-ai.betteruptime.com/"
      target="_blank"
      rel="noreferrer"
    >
      <div>
        <p className="font-mono text-xs">{level.label}</p>
      </div>

      <span className="relative ml-auto flex h-1.5 w-1.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            level.color2,
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            level.color,
          )}
        />
      </span>
    </a>
  );
}
