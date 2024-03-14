import { cn } from "@midday/ui/utils";
import { getStatus } from "@openstatus/react";

export async function StatusWidget() {
  const res = await getStatus("midday");

  const { status } = res;

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

  return (
    <a
      className="flex justify-between space-x-2 items-center w-full border rounded-md px-3 py-1"
      href="https://midday.openstatus.dev"
      target="_blank"
      rel="noreferrer"
    >
      <div>
        <p className="text-sm">{level.label}</p>
      </div>

      <span className="relative ml-auto flex h-1.5 w-1.5">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            level.color2
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-1.5 w-1.5",
            level.color
          )}
        />
      </span>
    </a>
  );
}
