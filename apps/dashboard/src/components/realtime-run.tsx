import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useEffect } from "react";

export function RealtimeRun({
  runId,
  accessToken,
  onChange,
}: {
  runId: string;
  accessToken: string;
  onChange: (status: "FAILED" | "COMPLETED") => void;
}) {
  const { run, error } = useRealtimeRun(runId, {
    accessToken,
  });

  useEffect(() => {
    if (error || run?.status === "FAILED") {
      onChange("FAILED");
    }

    if (run?.status === "COMPLETED") {
      onChange("COMPLETED");
    }
  }, [error, run]);

  return null;
}
