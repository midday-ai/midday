"use client";

import { ExportTransactionsModal } from "@/components/modals/export-transactions-modal";
import { Button } from "@midday/ui/button";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function ExportButton({ totalMissingAttachments }) {
  const [isOpen, setOpen] = useState();

  const searchParams = useSearchParams();
  const hasDate = searchParams.get("filter")
    ? JSON.parse(searchParams.get("filter"))?.date
    : null;

  return (
    <>
      <Button
        className="space-x-2"
        variant={hasDate ? "default" : "outline"}
        disabled={!hasDate}
        onClick={() => setOpen(true)}
      >
        Export
      </Button>
      <ExportTransactionsModal
        isOpen={isOpen}
        setOpen={setOpen}
        totalMissingAttachments={totalMissingAttachments}
      />
    </>
  );
}
