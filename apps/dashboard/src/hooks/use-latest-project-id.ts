import { useLocalStorage } from "./use-local-storage";

export function useLatestProjectId(teamId?: string | null) {
  // Include teamId in the key to prevent sharing across teams
  const storageKey = teamId
    ? `latest-project-id-${teamId}`
    : "latest-project-id";

  const [latestProjectId, setLatestProjectId] = useLocalStorage<string | null>(
    storageKey,
    null,
  );

  return {
    latestProjectId,
    setLatestProjectId,
  };
}
