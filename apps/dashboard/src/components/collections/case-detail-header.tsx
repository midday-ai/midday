"use client";

import { useTRPC } from "@/trpc/client";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useState } from "react";

type CaseData = NonNullable<RouterOutputs["collections"]["getById"]>;

type Props = {
  data: CaseData;
};

const priorityStyles: Record<string, string> = {
  critical: "text-[#FF3638] bg-[#FF3638]/10",
  high: "text-[#F97316] bg-[#FFEDD5] dark:bg-[#F97316]/10",
  medium: "text-[#FFD02B] bg-[#FFD02B]/10",
  low: "text-[#878787] bg-[#F2F1EF] dark:bg-[#1D1D1D]",
};

const outcomeLabels: Record<string, string> = {
  paid_in_full: "Paid in Full",
  settled: "Settled",
  payment_plan: "Payment Plan",
  defaulted: "Defaulted",
  written_off: "Written Off",
  sent_to_agency: "Sent to Agency",
};

export function CaseDetailHeader({ data }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string>("");
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");

  // Fetch stages for stage dropdown
  const { data: stages } = useQuery(
    trpc.collectionConfig.getStages.queryOptions(),
  );

  // Fetch agencies for resolve dialog
  const { data: agencies } = useQuery(
    trpc.collectionConfig.getAgencies.queryOptions(),
  );

  const invalidateCase = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: trpc.collections.getById.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.collections.get.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.collections.getStats.queryKey(),
    });
  }, [queryClient, trpc]);

  const updateMutation = useMutation(
    trpc.collections.update.mutationOptions({ onSuccess: invalidateCase }),
  );

  const resolveMutation = useMutation(
    trpc.collections.resolve.mutationOptions({
      onSuccess: () => {
        invalidateCase();
        setShowResolveDialog(false);
      },
    }),
  );

  const handleStageChange = useCallback(
    (stageId: string) => {
      updateMutation.mutate({ id: data.id, stageId });
    },
    [data.id, updateMutation],
  );

  const handlePriorityChange = useCallback(
    (priority: string) => {
      updateMutation.mutate({
        id: data.id,
        priority: priority as "low" | "medium" | "high" | "critical",
      });
    },
    [data.id, updateMutation],
  );

  const handleResolve = useCallback(() => {
    if (!selectedOutcome) return;
    resolveMutation.mutate({
      id: data.id,
      outcome: selectedOutcome as any,
      agencyId:
        selectedOutcome === "sent_to_agency" ? selectedAgencyId : undefined,
    });
  }, [data.id, selectedOutcome, selectedAgencyId, resolveMutation]);

  const isResolved = !!data.resolvedAt;

  return (
    <>
      <div className="space-y-4">
        {/* Back link */}
        <Link
          href="/collections"
          className="inline-flex items-center gap-1 text-sm text-[#606060] hover:text-primary transition-colors"
        >
          <Icons.ArrowBack size={16} />
          <span>Collections</span>
        </Link>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium">
              {data.merchantName || "Unknown Merchant"}
            </h1>
            <p className="text-sm text-[#606060]">
              {data.dealCode || "No deal code"}
            </p>
          </div>

          {!isResolved && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResolveDialog(true)}
              className="flex-shrink-0"
            >
              Resolve
            </Button>
          )}

          {isResolved && data.outcome && (
            <div className="px-2 py-0.5 rounded-full inline-flex max-w-full text-[11px] font-medium text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10">
              <span className="line-clamp-1 truncate inline-block">
                {outcomeLabels[data.outcome] || data.outcome}
              </span>
            </div>
          )}
        </div>

        {/* Controls row */}
        {!isResolved && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage dropdown */}
            <Select
              value={data.stageId || ""}
              onValueChange={handleStageChange}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stages?.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      {stage.color && (
                        <div
                          className="size-2 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                      )}
                      {stage.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <div
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-medium",
                      priorityStyles[data.priority ?? "low"] || priorityStyles.low,
                    )}
                  >
                    <span className="capitalize">{data.priority}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {["low", "medium", "high", "critical"].map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                  >
                    <div
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-medium capitalize",
                        priorityStyles[p],
                      )}
                    >
                      {p}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Assigned user */}
            <div className="flex items-center gap-1.5 px-2 py-1 border border-border rounded-md h-8">
              {data.assignedToName ? (
                <div className="flex items-center gap-1.5">
                  <Avatar className="size-4">
                    {data.assignedToAvatar && (
                      <AvatarImageNext
                        src={data.assignedToAvatar}
                        alt={data.assignedToName}
                        width={16}
                        height={16}
                        quality={100}
                      />
                    )}
                    <AvatarFallback className="text-[8px]">
                      {data.assignedToName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{data.assignedToName}</span>
                </div>
              ) : (
                <span className="text-xs text-[#878787]">Unassigned</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Resolve Collection Case</DialogTitle>
            <DialogDescription>
              Select an outcome for this case. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Select value={selectedOutcome} onValueChange={setSelectedOutcome}>
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(outcomeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedOutcome === "sent_to_agency" && (
              <Select
                value={selectedAgencyId}
                onValueChange={setSelectedAgencyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agency" />
                </SelectTrigger>
                <SelectContent>
                  {agencies?.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResolveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={
                !selectedOutcome ||
                (selectedOutcome === "sent_to_agency" && !selectedAgencyId) ||
                resolveMutation.isPending
              }
            >
              {resolveMutation.isPending ? "Resolving..." : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
