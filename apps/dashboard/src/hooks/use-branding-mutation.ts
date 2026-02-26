"use client";

import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import type { TeamBranding } from "@db/schema";

export function useBrandingMutation() {
  const { data } = useTeamQuery();
  const updateTeamMutation = useTeamMutation();

  return {
    ...updateTeamMutation,
    mutate: (brandingPatch: Partial<TeamBranding>) => {
      const currentBranding = (data?.branding as TeamBranding) ?? {};
      updateTeamMutation.mutate({
        branding: { ...currentBranding, ...brandingPatch },
      });
    },
  };
}
