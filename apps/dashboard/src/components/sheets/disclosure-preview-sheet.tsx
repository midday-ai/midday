"use client";

import { useDisclosureParams } from "@/hooks/use-disclosure-params";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { DisclosureFiguresDisplay } from "@/components/disclosure-figures";
import { DisclosureStatusBadge } from "@/components/disclosure-status-badge";
import type { DisclosureFigures } from "@midday/disclosures/types";

export function DisclosurePreviewSheet() {
  const { disclosureId, isOpen, close } = useDisclosureParams();
  const trpc = useTRPC();

  const { data: disclosure, isLoading } = useQuery(
    trpc.disclosures.getById.queryOptions(
      { id: disclosureId! },
      { enabled: !!disclosureId },
    ),
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Disclosure Document
            {disclosure && (
              <DisclosureStatusBadge status={disclosure.status} />
            )}
          </SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        )}

        {disclosure && (
          <div className="mt-4 space-y-6">
            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">State</span>
                <p className="font-medium">{disclosure.stateCode}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Version</span>
                <p className="font-medium">{disclosure.templateVersion}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Deal</span>
                <p className="font-medium">{disclosure.deal?.dealCode}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Merchant</span>
                <p className="font-medium">{disclosure.merchant?.name}</p>
              </div>
              {disclosure.generatedAt && (
                <div>
                  <span className="text-muted-foreground">Generated</span>
                  <p className="font-medium">
                    {new Date(disclosure.generatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {disclosure.documentHash && (
                <div>
                  <span className="text-muted-foreground">Document Hash</span>
                  <p className="font-mono text-xs truncate">
                    {disclosure.documentHash}
                  </p>
                </div>
              )}
            </div>

            {/* Acknowledgment status */}
            {disclosure.acknowledgedAt && (
              <div className="rounded-md bg-[#DDF1E4] dark:bg-[#00C969]/10 p-3 text-sm">
                <p className="font-medium text-[#00C969]">
                  Acknowledged by {disclosure.acknowledgedBy}
                </p>
                <p className="text-[#00C969]/70">
                  {new Date(disclosure.acknowledgedAt).toLocaleString()}
                </p>
              </div>
            )}

            {/* Figures */}
            {disclosure.figures &&
              typeof disclosure.figures === "object" &&
              "fundingAmount" in (disclosure.figures as Record<string, unknown>) && (
                <DisclosureFiguresDisplay
                  figures={disclosure.figures as unknown as DisclosureFigures}
                />
              )}

            {/* Download button */}
            {disclosure.status === "completed" && disclosure.filePath && (
              <div className="pt-4 border-t">
                <Button className="w-full" variant="outline">
                  Download PDF
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
