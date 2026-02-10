"use client";

import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback } from "react";
import type { ArtifactType } from "@/lib/artifact-config";

interface ArtifactToggleIconProps {
  artifactType: ArtifactType;
}

export function ArtifactToggleIcon({ artifactType }: ArtifactToggleIconProps) {
  const [selectedType, setSelectedType] = useQueryState(
    "artifact-type",
    parseAsString,
  );

  const [data, actions] = useArtifacts({
    value: selectedType ?? undefined,
    onChange: (v: string | null) => setSelectedType(v ?? null),
    exclude: ["chat-title", "suggestions"],
  });

  const { available, activeType } = data;
  const isArtifactAvailable = available.includes(artifactType);
  const isCurrentlyOpen =
    activeType === artifactType || selectedType === artifactType;

  const handleToggle = useCallback(() => {
    if (isCurrentlyOpen) {
      // If this artifact is currently open, close it
      actions.setValue(null);
      setSelectedType(null);
    } else {
      // Otherwise, open this artifact
      actions.setValue(artifactType);
      setSelectedType(artifactType);
    }
  }, [isCurrentlyOpen, artifactType, setSelectedType, actions]);

  // Don't render if artifact is not available
  if (!isArtifactAvailable) {
    return null;
  }

  return (
    <div>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleToggle}
              className="flex items-center justify-center w-6 h-6 transition-colors duration-200 hover:bg-muted"
              aria-label={isCurrentlyOpen ? "Close artifact" : "Open artifact"}
            >
              <Icons.Sidebar className="size-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="px-2 py-1 text-xs">
            <p>{isCurrentlyOpen ? "Close artifact" : "Open artifact"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
