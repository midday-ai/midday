import { draftInvoiceAction } from "@/actions/invoice/draft-invoice-action";
import type { InvoiceFormValues } from "@/actions/invoice/schema";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { formatRelativeTime } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { useDebounce } from "@uidotdev/usehooks";
import { motion } from "framer-motion";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { type Customer, CustomerDetails } from "./customer-details";
import { FromDetails } from "./from-details";
import { LineItems } from "./line-items";
import { Logo } from "./logo";
import { Meta } from "./meta";
import { NoteDetails } from "./note-details";
import { PaymentDetails } from "./payment-details";
import { SubmitButton } from "./submit-button";
import { Summary } from "./summary";

type Props = {
  teamId: string;
  customers: Customer[];
  updatedAt?: Date;
  onSubmit: (values: InvoiceFormValues) => void;
  isSubmitting: boolean;
};

export function Form({ teamId, customers, onSubmit, isSubmitting }: Props) {
  const { selectedCustomerId } = useInvoiceParams();
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();
  const [lastEditedText, setLastEditedText] = useState("");

  const form = useFormContext<InvoiceFormValues>();

  const size = form.watch("template.size") === "a4" ? 650 : 816;
  const token = form.watch("token");

  const draftInvoice = useAction(draftInvoiceAction, {
    onSuccess: ({ data }) => {
      setLastUpdated(new Date());
      form.setValue("token", data?.token, { shouldValidate: true });
    },
  });

  // Only watch the fields that are used in the upsert action
  const formValues = useWatch({
    control: form.control,
    name: [
      "template",
      "customer_id",
      "customer_name",
      "line_items",
      "amount",
      "vat",
      "tax",
      "due_date",
      "issue_date",
      "note_details",
      "payment_details",
      "from_details",
    ],
  });

  const isDirty = form.formState.isDirty;
  const debouncedValues = useDebounce(formValues, 800);

  useEffect(() => {
    const currentFormValues = form.getValues();

    if (isDirty && form.watch("customer_id")) {
      draftInvoice.execute(currentFormValues);
    }
  }, [debouncedValues, isDirty]);

  useEffect(() => {
    const customer = customers.find((c) => c.id === selectedCustomerId);

    if (selectedCustomerId) {
      form.setValue("customer_id", customer?.id, { shouldValidate: true });
      form.setValue("customer_name", customer?.name, { shouldValidate: true });
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    const updateLastEditedText = () => {
      if (!lastUpdated) {
        setLastEditedText("");
        return;
      }

      setLastEditedText(`Edited ${formatRelativeTime(lastUpdated)}`);
    };

    updateLastEditedText();
    const intervalId = setInterval(updateLastEditedText, 1000);

    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="relative h-full">
      <ScrollArea
        className={`w-[${size - 20}px] h-[calc(100vh-200px)] bg-background`}
        hideScrollbar
      >
        <div className="p-8 h-full flex flex-col">
          <div className="flex flex-col">
            <Logo teamId={teamId} />
          </div>

          <div className="mt-8">
            <Meta teamId={teamId} />
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8">
            <div>
              <FromDetails />
            </div>
            <div>
              <CustomerDetails customers={customers} />
            </div>
          </div>

          <div className="mt-8">
            <LineItems />
          </div>

          <div className="mt-8 flex justify-end mb-8">
            <Summary />
          </div>

          <div className="flex flex-col space-y-8 mt-auto">
            <div className="grid grid-cols-2 gap-6">
              <PaymentDetails />
              <NoteDetails />
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="absolute bottom-14 w-full h-9">
        <div className="flex justify-between items-center mt-auto">
          <div className="flex space-x-2 items-center">
            {token && (
              <Link
                href={`/i/${token}`}
                className="text-xs text-[#808080] flex items-center gap-1"
                target="_blank"
              >
                <Icons.ExternalLink className="size-3" />
                <span>Preview invoice</span>
              </Link>
            )}

            {lastEditedText && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs text-[#808080] flex items-center gap-1"
              >
                <span>-</span>
                <span>{lastEditedText}</span>
              </motion.div>
            )}
          </div>

          <SubmitButton isSubmitting={isSubmitting} />
        </div>
      </div>
    </form>
  );
}
