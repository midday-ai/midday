import { getTaxRateAction } from "@/actions/ai/get-tax-rate";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { useDebounceValue } from "usehooks-ts";

type Props = {
  name?: string;
  value?: string | null;
  onSelect: (value: number) => void;
  onSuggestionReceived?: (taxRate: number) => void;
};

export function TaxRateAssistant({
  name,
  onSelect,
  onSuggestionReceived,
  value,
}: Props) {
  const [result, setResult] = useState<
    { taxRate: number; country?: string } | undefined
  >();
  const [isLoading, setLoading] = useState(false);
  const lastProcessedName = useRef<string | undefined>(undefined);

  const getVatRate = useAction(getTaxRateAction, {
    onSuccess: ({ data }) => {
      setLoading(false);

      if (data) {
        setResult(data);
        // Auto-update the input with the AI suggestion
        onSuggestionReceived?.(data.taxRate);
      }
    },
    onError: () => {
      setLoading(false);
    },
  });

  const handleOnSelect = () => {
    if (result?.taxRate) {
      onSelect(result.taxRate);
    }
  };

  // Use debounced name value with 500ms delay
  const [debouncedName] = useDebounceValue(name, 500);

  useEffect(() => {
    // Only trigger API call if debounced name is different from last processed name
    if (
      debouncedName &&
      debouncedName.length > 2 &&
      debouncedName !== lastProcessedName.current
    ) {
      lastProcessedName.current = debouncedName;
      setResult(undefined);
      setLoading(true);
      getVatRate.execute({ name: debouncedName });
    }
  }, [debouncedName, getVatRate]);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute right-2 top-2.5">
            <Icons.AIOutline
              className={cn(
                "pointer-events-none opacity-50 transition-colors",
                result?.taxRate && "opacity-100",
                isLoading && "animate-pulse opacity-100",
              )}
            />
          </div>
        </TooltipTrigger>
        {result?.taxRate && (
          <TooltipContent
            sideOffset={20}
            className="flex flex-col max-w-[310px] space-y-2"
          >
            <div className="flex space-x-2 items-center">
              <span>Tax Rate Assistant</span>
            </div>
            <span className="text-xs text-[#878787]">
              {`The tax rate for ${name} in ${result.country} is generally ${result.taxRate}%. This value has been automatically filled in the input field. Please remember to confirm this with your local Tax office.`}
            </span>

            <div className="flex justify-end mt-3 pt-3">
              <Button
                size="sm"
                className="h-auto py-1"
                onClick={handleOnSelect}
              >
                Apply
              </Button>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
