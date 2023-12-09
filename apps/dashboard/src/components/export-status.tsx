"use client";

import { useToast } from "@midday/ui/use-toast";
import { useEventRunDetails } from "@trigger.dev/react";
import { useEffect } from "react";

export function ExportStatus() {
  const { toast } = useToast();
  const { data, isLoading } = useEventRunDetails();

  useEffect(() => {
    toast({
      variant: "progress",
      title: "Exporting...",
      description: "Your export is based on 46 transactions.",
    });
  }, [isLoading]);

  useEffect(() => {
    if (data?.status === "FAILURE") {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    }
  }, [data]);

  return null;
}
