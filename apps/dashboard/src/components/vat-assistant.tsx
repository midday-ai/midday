import { getVatRateAction } from "@/actions/ai/get-vat-rate";
import { Experimental } from "@/components/experimental";
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
import { useEffect, useState } from "react";

type Props = {
  name?: string;
  value?: string | null;
  onSelect: (value: number) => void;
  isFocused: boolean;
};

export function VatAssistant({ name, onSelect, isFocused, value }: Props) {
  const [result, setResult] = useState<
    { vat: number; country: string } | undefined
  >();
  const [isLoading, setLoading] = useState(false);

  const getVatRate = useAction(getVatRateAction, {
    onSuccess: ({ data }) => {
      setLoading(false);

      if (data) {
        setResult(data);
      }
    },
    onError: () => {
      setLoading(false);
    },
  });

  const handleOnSelect = () => {
    if (result?.vat) {
      onSelect(result.vat);
    }
  };

  useEffect(() => {
    if (isFocused && name && name.length > 2 && !value) {
      setLoading(true);
      getVatRate.execute({ name });
    }
  }, [isFocused, name]);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute right-2 top-3">
            <Icons.AIOutline
              className={cn(
                "pointer-events-none opacity-50 transition-colors",
                result?.vat && "opacity-100",
                isLoading && "animate-pulse opacity-100",
              )}
            />
          </div>
        </TooltipTrigger>
        {result?.vat && (
          <TooltipContent
            sideOffset={20}
            className="flex flex-col max-w-[310px] space-y-2"
          >
            <div className="flex space-x-2 items-center">
              <span>VAT Assistant</span>
              <Experimental className="px-2 py-0 border-border" />
            </div>
            <span className="text-xs text-[#878787]">
              {`The VAT rate for ${name} in ${result.country} is generally ${result.vat}%. Please remember to confirm this with your local Tax office.`}
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
