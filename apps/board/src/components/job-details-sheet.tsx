"use client";

import { useJobParams } from "@/hooks/use-job-params";
import { Sheet, SheetContent } from "@midday/ui/sheet";
import React from "react";
import { JobDetails } from "./job-details";

export function JobDetailsSheet() {
  const { jobId, queueName, setParams } = useJobParams();
  const isOpen = Boolean(jobId && queueName);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setParams({ jobId: null, queueName: null });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent title="Job Details">
        <JobDetails />
      </SheetContent>
    </Sheet>
  );
}
