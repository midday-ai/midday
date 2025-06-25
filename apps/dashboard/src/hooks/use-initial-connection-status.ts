import { useState } from "react";

type UseInitialConnectionStatusProps = {
  runId?: string;
  accessToken?: string;
};

export function useInitialConnectionStatus({
  runId: initialRunId,
  accessToken: initialAccessToken,
}: UseInitialConnectionStatusProps) {
  const [_accessToken, _setAccessToken] = useState<string | undefined>(
    initialAccessToken,
  );
  const [_runId, _setRunId] = useState<string | undefined>(initialRunId);
  const [status, setStatus] = useState<
    "FAILED" | "SYNCING" | "COMPLETED" | null
  >(null);

  // const { run, error } = useRealtimeRun(runId, {
  //   enabled: !!runId && !!accessToken,
  //   accessToken,
  // });

  // useEffect(() => {
  //   if (initialRunId && initialAccessToken) {
  //     setAccessToken(initialAccessToken);
  //     setRunId(initialRunId);
  //     setStatus("SYNCING");
  //   }
  // }, [initialRunId, initialAccessToken]);

  // useEffect(() => {
  //   if (error || run?.status === "FAILED") {
  //     setStatus("FAILED");
  //   }

  //   if (run?.status === "COMPLETED") {
  //     setStatus("COMPLETED");
  //   }
  // }, [error, run]);

  return {
    status,
    setStatus,
  };
}
