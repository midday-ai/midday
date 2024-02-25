"use client";

import { Button } from "@midday/ui/button";
import { useEventDetails } from "@trigger.dev/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export function LoadingTransactionsEvent({
  eventId,
  setEventId,
  onClose,
}: {
  eventId: string;
}) {
  const { data } = useEventDetails(eventId);
  const firstRun = data?.runs?.at(0);

  useEffect(() => {
    if (firstRun?.status === "SUCCESS") {
      onClose();
    }
  }, [firstRun]);

  if (firstRun?.status === "FAILURE") {
    return (
      <Button onClick={() => setEventId(undefined)} className="w-full">
        Try again
      </Button>
    );
  }

  return (
    <Button disabled className="w-full">
      <Loader2 className="w-4 h-4 animate-spin pointer-events-none" />
    </Button>
  );
}
