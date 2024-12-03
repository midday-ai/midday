import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useEffect, useState } from "react";

type UseSyncStatusProps = {
  runId?: string;
  accessToken?: string;
};

export function useSyncStatus({
  runId: initialRunId,
  accessToken: initialAccessToken,
}: UseSyncStatusProps) {
  const [accessToken, setAccessToken] = useState<string | undefined>(
    initialAccessToken,
  );
  const [runId, setRunId] = useState<string | undefined>(initialRunId);
  const [status, setStatus] = useState<
    "FAILED" | "SYNCING" | "COMPLETED" | null
  >(null);
  const { run, error } = useRealtimeRun(runId, {
    enabled: !!runId && !!accessToken,
    accessToken,
  });

  useEffect(() => {
    if (initialRunId && initialAccessToken) {
      setAccessToken(initialAccessToken);
      setRunId(initialRunId);
      setStatus("SYNCING");
    }
  }, [initialRunId, initialAccessToken]);

  useEffect(() => {
    if (error || run?.status === "FAILED") {
      setStatus("FAILED");
    }

    if (run?.status === "COMPLETED") {
      setStatus("COMPLETED");
    }
  }, [error, run]);

  return {
    status,
    setStatus,
  };
}
