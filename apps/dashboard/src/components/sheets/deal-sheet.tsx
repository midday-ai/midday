"use client";

import { DealContent } from "@/components/deal-content";
import { FormContext } from "@/components/deal/form-context";
import { useDealParams } from "@/hooks/use-deal-params";
import { useTRPC } from "@/trpc/client";
import { Sheet } from "@midday/ui/sheet";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import React from "react";

export function DealSheet() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams, type, dealId } = useDealParams();
  const isOpen = type === "create" || type === "edit" || type === "success";

  // Get default settings for new deals
  const { data: defaultSettings } = useSuspenseQuery(
    trpc.deal.defaultSettings.queryOptions(),
  );

  // Get draft deal for edit
  const { data } = useQuery(
    trpc.deal.getById.queryOptions(
      {
        id: dealId!,
      },
      {
        enabled: !!dealId,
        staleTime: 0,
      },
    ),
  );

  const handleOnOpenChange = (open: boolean) => {
    if (!open) {
      // Invalidate queries when closing the sheet to prevent stale data
      queryClient.invalidateQueries({
        queryKey: trpc.deal.getById.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.deal.defaultSettings.queryKey(),
      });
    }

    setParams(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOnOpenChange}>
      <FormContext defaultSettings={defaultSettings} data={data}>
        <DealContent />
      </FormContext>
    </Sheet>
  );
}
