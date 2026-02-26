"use client";

import { ExportTemplateForm } from "@/components/exports/export-template-form";
import { ExportTemplateList } from "@/components/exports/export-template-list";
import { useState } from "react";

type View = "list" | "create";

export function ExportsPageContent() {
  const [view, setView] = useState<View>("list");

  if (view === "create") {
    return (
      <ExportTemplateForm
        onComplete={() => setView("list")}
        onCancel={() => setView("list")}
      />
    );
  }

  return <ExportTemplateList onCreateNew={() => setView("create")} />;
}
