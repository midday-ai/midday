import { useLocalStorage } from "./use-local-storage";

export function useLatestProjectId() {
  const [latestProjectId, setLatestProjectId] = useLocalStorage<string | null>(
    "latest-project-id",
    null,
  );

  return {
    latestProjectId,
    setLatestProjectId,
  };
}
