import { cn } from "@midday/ui/utils";
import { getStatus } from "@openstatus/react";

export async function StatusWidget() {
  const res = await getStatus("midday");

  const { status } = res;

  const getStatusLevel = (level) => {
    return {
      operational: {
        label: "Operational",
        color: "bg-green",
      },
      degraded_performance: {
        label: "Degraded Performance",
        color: "bg-yellow",
      },
      partial_outage: {
        label: "Partial Outage",
        color: "bg-yellow",
      },
      major_outage: {
        label: "Major Outage",
        color: "bg-red",
      },
      unknown: {
        label: "Unknown",
        color: "bg-gray",
      },
      incident: {
        label: "Incident",
        color: "bg-yellow",
      },
      under_maintenance: {
        label: "Under Maintenance",
        color: "bg-gray",
      },
    }[level];
  };

  const level = getStatusLevel(status);

  return (
    <a
      class="flex justify-between items-center w-full"
      href="https://midday.openstatus.dev"
      target="_blank"
      rel="noreferrer"
    >
      <div>
        <p className="text-sm">{level.label}</p>
      </div>

      <span class="relative ml-auto flex h-1.5 w-1.5">
        <span
          class={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            `${level.color}-400`
          )}
        />
        <span
          class={cn(
            "relative inline-flex rounded-full h-1.5 w-1.5",
            `${level.color}-500`
          )}
        />
      </span>
    </a>
  );
}
