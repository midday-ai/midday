import { useUserQuery } from "@/hooks/use-user";
import type { Artifact } from "@ai-sdk-tools/artifacts";
import { useArtifact } from "@ai-sdk-tools/artifacts/client";

/**
 * Custom hook that combines useArtifact + useUserQuery
 * Returns common canvas data and state
 */
export function useCanvasData<T extends Artifact>(artifact: T) {
  const { data, status } = useArtifact(artifact);
  const { data: user } = useUserQuery();

  const isLoading = status === "loading";
  const stage = data?.stage;
  const currency = data?.currency || "USD";
  const locale = user?.locale || undefined;

  return {
    data,
    status,
    user,
    isLoading,
    stage,
    currency,
    locale,
  };
}
