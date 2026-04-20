"use client";

import { Button } from "@midday/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useExportStore } from "@/store/export";
import { useTRPC } from "@/trpc/client";

export function ExportAllData() {
  const trpc = useTRPC();
  const { exportData, setExportData } = useExportStore();

  const mutation = useMutation(
    trpc.team.exportAllData.mutationOptions({
      onSuccess: (data) => {
        setExportData({ runId: data.id, exportType: "team-data" });
      },
    }),
  );

  const busy = mutation.isPending || !!exportData?.runId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export all data</CardTitle>
        <CardDescription>
          Download a ZIP containing every transaction, invoice, customer,
          document, and tracker entry for your team. The file will appear in
          your vault under Exports when it&apos;s ready.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => mutation.mutate()} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Exporting…
            </>
          ) : (
            "Export"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
