import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { createClient } from "@midday/supabase/client";
import { searchInvoiceNumberQuery } from "@midday/supabase/queries";
import { cn } from "@midday/ui/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "./input";
import { LabelInput } from "./label-input";

type Props = {
  teamId: string;
};

export function InvoiceNo({ teamId }: Props) {
  const { watch, setError, clearErrors } = useFormContext();
  const supabase = createClient();
  const invoiceNumber = watch("invoice_number");

  const [isInvoiceNumberExists, setIsInvoiceNumberExists] = useState(false);

  const { type } = useInvoiceParams();

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  useEffect(() => {
    async function searchInvoiceNumber() {
      if (invoiceNumber) {
        const { data } = await searchInvoiceNumberQuery(supabase, {
          teamId,
          query: invoiceNumber,
        });

        const exists = data && data.length > 0;
        setIsInvoiceNumberExists(exists ?? false);

        if (exists) {
          setError("invoice_number", {
            type: "manual",
            message: "Invoice number already exists",
          });
        } else {
          clearErrors("invoice_number");
        }
      }
    }

    // Only search for invoice number if we are creating a new invoice
    if (type === "create") {
      searchInvoiceNumber();
    }
  }, [invoiceNumber, teamId, type]);

  return (
    <div className="flex space-x-1 items-center">
      <div className="flex items-center flex-shrink-0">
        <LabelInput
          name="template.invoice_no_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              invoice_no_label: value,
            });
          }}
          className="truncate"
        />
        <span className="text-[11px] text-[#878787] font-mono flex-shrink-0">
          :
        </span>
      </div>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Input
                name="invoice_number"
                className={cn(
                  "w-28 flex-shrink p-0 border-none text-[11px] h-4.5 overflow-hidden",
                  isInvoiceNumberExists ? "text-red-500" : "",
                )}
              />
            </div>
          </TooltipTrigger>
          {isInvoiceNumberExists && (
            <TooltipContent className="text-xs px-3 py-1.5">
              <p>Invoice number already exists</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
