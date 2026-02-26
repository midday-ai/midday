"use client";

import { AchBatchCreate } from "@/components/ach/ach-batch-create";
import { AchBatchList } from "@/components/ach/ach-batch-list";
import { useState } from "react";

type View = "list" | "create" | "detail";

export function AchPageContent() {
  const [view, setView] = useState<View>("list");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  if (view === "create") {
    return (
      <AchBatchCreate
        onComplete={(batchId) => {
          setSelectedBatchId(batchId);
          setView("list");
        }}
        onCancel={() => setView("list")}
      />
    );
  }

  return (
    <AchBatchList
      onCreateNew={() => setView("create")}
      onSelectBatch={(id) => {
        setSelectedBatchId(id);
        // Detail view will be opened as a sheet
      }}
    />
  );
}
