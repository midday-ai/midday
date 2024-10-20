"use client";

import { validateVatNumberAction } from "@/actions/validate-vat-number-action";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useDebounce } from "@uidotdev/usehooks";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
};

export function VatNumberInput({
  value,
  onChange,
  countryCode,
  ...props
}: Props) {
  const [vatNumber, setVatNumber] = useState(value || "");
  const [companyName, setCompanyName] = useState("");
  const [isValid, setIsValid] = useState<boolean | undefined>(undefined);

  const validateVatNumber = useAction(validateVatNumberAction, {
    onSuccess: ({ data }) => {
      if (data) {
        setIsValid(data.format_valid);
        setCompanyName(data?.registration_info?.name || "");
      }
    },
  });

  const debouncedVatNumber = useDebounce(vatNumber, 300);

  useEffect(() => {
    if (
      debouncedVatNumber.length > 7 &&
      countryCode &&
      value !== debouncedVatNumber
    ) {
      validateVatNumber.execute({
        vat_number: debouncedVatNumber,
        country_code: countryCode,
      });
    }
  }, [debouncedVatNumber, countryCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    setVatNumber(newValue);
    onChange?.(newValue);
    setIsValid(undefined);
  };

  return (
    <div className="relative">
      <Input
        placeholder="Enter VAT number"
        value={vatNumber}
        onChange={handleChange}
        disabled={!countryCode}
        autoComplete="off"
        {...props}
      />

      {validateVatNumber.isExecuting && (
        <Loader2 className="size-4 animate-spin absolute right-2 top-2.5" />
      )}

      {isValid === true && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild className=" absolute right-2 top-2.5">
              <button type="button">
                <Icons.Check className="size-4 text-green-500" />
              </button>
            </TooltipTrigger>
            {companyName && (
              <TooltipContent
                className="px-3 py-1 text-xs text-[#878787]"
                side="left"
                sideOffset={5}
              >
                <p className="capitalize">{companyName.toLowerCase()}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}

      {!validateVatNumber.isExecuting && isValid === false && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild className=" absolute right-2 top-2.5">
              <button type="button">
                <Icons.AlertCircle className="size-4 text-yellow-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              className="px-3 py-1 text-xs text-[#878787]"
              side="left"
              sideOffset={5}
            >
              Invalid VAT number
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
