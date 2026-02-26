"use client";

import { useDealParams } from "@/hooks/use-deal-params";
import { useTemplateUpdate } from "@/hooks/use-template-update";
import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "./input";
import { LabelInput } from "./label-input";

export function DealNo() {
  const {
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();
  const dealNumber = watch("dealNumber");
  const trpc = useTRPC();
  const { updateTemplate } = useTemplateUpdate();

  const { type } = useDealParams();

  const { data } = useQuery(
    trpc.deal.searchDealNumber.queryOptions(
      {
        query: dealNumber,
      },
      {
        // Only search for deal number if we are creating a new deal
        enabled: type === "create" && dealNumber !== "",
        // Never cache the result
        gcTime: 0,
      },
    ),
  );

  useEffect(() => {
    if (data) {
      setError("dealNumber", {
        type: "manual",
        message: "Deal number already exists",
      });
    } else {
      clearErrors("dealNumber");
    }
  }, [data]);

  return (
    <div className="flex space-x-1 items-center">
      <div className="flex items-center flex-shrink-0">
        <LabelInput
          name="template.dealNoLabel"
          onSave={(value) => {
            updateTemplate({ dealNoLabel: value });
          }}
          className="truncate"
        />
        <span className="text-[11px] text-[#878787] flex-shrink-0">:</span>
      </div>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Input
                name="dealNumber"
                className={cn(
                  "w-28 flex-shrink p-0 border-none text-[11px] h-4.5 overflow-hidden",
                  errors.dealNumber ? "text-red-500" : "",
                )}
              />
            </div>
          </TooltipTrigger>
          {errors.dealNumber && (
            <TooltipContent className="text-xs px-3 py-1.5">
              <p>Deal number already exists</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
