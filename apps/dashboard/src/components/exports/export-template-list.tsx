"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { toast } from "@midday/ui/use-toast";
import { formatDate } from "@midday/utils/format";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

const formatLabels: Record<string, string> = {
  csv: "CSV",
  xlsx: "Excel",
  pdf: "PDF",
  quickbooks_iif: "QuickBooks IIF",
  xero_csv: "Xero CSV",
};

type Props = {
  onCreateNew: () => void;
};

export function ExportTemplateList({ onCreateNew }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery(
    trpc.exportTemplates.getAll.queryOptions(),
  );

  const executeMutation = useMutation(
    trpc.exportTemplates.execute.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries({
          queryKey: trpc.exportTemplates.getAll.queryKey(),
        });
        toast({
          title: "Export started",
          description: `Generating ${result.format} file...`,
          variant: "success",
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.exportTemplates.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.exportTemplates.getAll.queryKey(),
        });
        toast({ title: "Template deleted", variant: "success" });
      },
    }),
  );

  const templates = data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Export Templates</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage export templates for reconciliation reports
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <Icons.Add size={16} className="mr-2" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Icons.Invoice size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No export templates</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-[360px]">
            Create templates for common exports like daily reconciliation
            reports, NSF summaries, and accounting imports.
          </p>
          <Button className="mt-4" onClick={onCreateNew}>
            Create Template
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Last Exported</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{template.name}</span>
                    {template.description && (
                      <span className="text-xs text-muted-foreground">
                        {template.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                    {formatLabels[template.format] || template.format}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {template.scheduleEnabled
                    ? template.scheduleCron || "Enabled"
                    : "Manual"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground tabular-nums">
                  {template.lastExportedAt
                    ? formatDate(template.lastExportedAt)
                    : "Never"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        executeMutation.mutate({ id: template.id })
                      }
                      disabled={executeMutation.isPending}
                    >
                      Export
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        deleteMutation.mutate({ id: template.id })
                      }
                    >
                      <Icons.Delete size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
