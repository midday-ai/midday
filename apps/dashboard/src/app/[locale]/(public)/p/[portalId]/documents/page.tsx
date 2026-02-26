"use client";

import { useTRPC } from "@/trpc/client";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Suspense, use, useState } from "react";

const documentTypeLabels: Record<string, string> = {
  contract: "Contracts",
  disclosure: "Disclosures",
  payoff_letter: "Payoff Letters",
  monthly_statement: "Statements",
  tax_doc: "Tax Documents",
  other: "Other",
};

const typeFilters = [
  { value: "all", label: "All" },
  { value: "contract", label: "Contracts" },
  { value: "disclosure", label: "Disclosures" },
  { value: "payoff_letter", label: "Payoff" },
  { value: "monthly_statement", label: "Statements" },
  { value: "tax_doc", label: "Tax" },
];

export default function DocumentsPage({
  params,
}: {
  params: Promise<{ portalId: string }>;
}) {
  const { portalId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      }
    >
      <DocumentsContent portalId={portalId} />
    </Suspense>
  );
}

function DocumentsContent({ portalId }: { portalId: string }) {
  const trpc = useTRPC();
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: documents = [] } = useQuery(
    trpc.merchantPortal.getDocuments.queryOptions({
      portalId,
      documentType: typeFilter === "all" ? undefined : typeFilter,
    }),
  );

  // Group documents by type
  const grouped = documents.reduce(
    (acc: Record<string, typeof documents>, doc: any) => {
      const type = doc.documentType || "other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(doc);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-serif">Documents</h1>

      {/* Type filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {typeFilters.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTypeFilter(value)}
            className={`px-3 py-1.5 text-sm rounded-full border whitespace-nowrap min-h-[36px] transition-colors ${
              typeFilter === value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Icons.Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No documents available</p>
          <p className="text-xs mt-1">
            Documents will appear here when uploaded by your funder.
          </p>
        </div>
      ) : typeFilter === "all" ? (
        // Grouped view
        Object.entries(grouped).map(([type, docs]: [string, any[]]) => (
          <div key={type}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {documentTypeLabels[type] || type}
            </h3>
            <div className="space-y-2">
              {docs.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </div>
          </div>
        ))
      ) : (
        // Flat list for filtered view
        <div className="space-y-2">
          {documents.map((doc: any) => (
            <DocumentRow key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentRow({ doc }: { doc: any }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background min-h-[56px]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center h-9 w-9 rounded bg-muted flex-shrink-0">
          <Icons.Description className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{doc.title}</div>
          <div className="text-[11px] text-muted-foreground">
            {format(new Date(doc.createdAt), "MMM d, yyyy")}
            {doc.dealCode && ` · ${doc.dealCode}`}
          </div>
        </div>
      </div>

      <a
        href={doc.filePath}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
        title="Download"
      >
        <Icons.ArrowDownward className="h-4 w-4" />
      </a>
    </div>
  );
}
