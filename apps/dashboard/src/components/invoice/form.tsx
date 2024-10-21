import { draftInvoiceAction } from "@/actions/invoice/draft-invoice-action";
import {
  type InvoiceFormValues,
  type InvoiceTemplate,
  invoiceFormSchema,
} from "@/actions/invoice/schema";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { formatRelativeTime } from "@/utils/format";
import { UTCDate } from "@date-fns/utc";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { useDebounce } from "@uidotdev/usehooks";
import { addMonths } from "date-fns";
import { motion } from "framer-motion";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { CreateButton } from "./create-button";
import { type Customer, CustomerDetails } from "./customer-details";
import { FromDetails } from "./from-details";
import { LineItems } from "./line-items";
import { Logo } from "./logo";
import { Meta } from "./meta";
import { NoteContent } from "./note-content";
import { PaymentDetails } from "./payment-details";
import { Summary } from "./summary";

type Props = {
  teamId: string;
  template: InvoiceTemplate;
  customers: Customer[];
  invoiceNumber: string;
  updatedAt?: Date;
};

const defaultTemplate: InvoiceTemplate = {
  customer_label: "To",
  from_label: "From",
  invoice_no_label: "Invoice No",
  issue_date_label: "Issue Date",
  due_date_label: "Due Date",
  description_label: "Description",
  price_label: "Price",
  quantity_label: "Quantity",
  total_label: "Total",
  vat_label: "VAT",
  tax_label: "Tax",
  payment_details_label: "Payment Details",
  payment_details: undefined,
  note_label: "Note",
  logo_url: undefined,
  currency: "USD",
  from_details: undefined,
};

export function Form({
  teamId,
  template: initialTemplate,
  customers,
  invoiceNumber,
}: Props) {
  const { selectedCustomerId, invoiceId } = useInvoiceParams();
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();
  const [lastEditedText, setLastEditedText] = useState("");

  const template = {
    ...defaultTemplate,
    ...initialTemplate,
  };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      id: invoiceId,
      template: template,
      customer_details: undefined,
      from_details: template.from_details,
      payment_details: template.payment_details,
      note: undefined,
      customer_id: undefined,
      issue_date: new UTCDate(),
      due_date: addMonths(new UTCDate(), 1),
      invoice_number: invoiceNumber,
      line_items: [{ name: "", quantity: 0, price: 0 }],
    },
  });

  const draftInvoice = useAction(draftInvoiceAction, {
    onSuccess: ({ data }) => {
      setLastUpdated(new Date());
    },
  });

  // Only watch the fields that are used in the upsert action
  const formValues = useWatch({
    control: form.control,
    name: [
      "customer_id",
      "line_items",
      "amount",
      "vat",
      "tax",
      "due_date",
      "issue_date",
    ],
  });

  const isDirty = form.formState.isDirty;
  const debouncedValues = useDebounce(formValues, 500);

  useEffect(() => {
    const currentFormValues = form.getValues();

    if (
      isDirty &&
      form.watch("customer_id") &&
      form.watch("line_items").length
    ) {
      draftInvoice.execute(currentFormValues);
    }
  }, [debouncedValues, isDirty]);

  useEffect(() => {
    if (selectedCustomerId) {
      form.setValue("customer_id", selectedCustomerId);
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

  const onSubmit = (data: InvoiceFormValues) => {
    // Create or Create & Send
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="relative h-full antialiased"
      >
        <ScrollArea
          className="w-[544px] h-full max-h-[770px] bg-background"
          hideScrollbar
        >
          <div className="p-8">
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

            <div className="mt-8 flex justify-end">
              <Summary />
            </div>

            <div className="mt-8 flex" />

            <div className="flex flex-col space-y-8 mt-auto">
              <div className="grid grid-cols-2 gap-6">
                <PaymentDetails />
                <NoteContent />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-14 w-full h-9">
          <div className="flex justify-between items-center mt-auto">
            <div className="flex space-x-2 items-center">
              <Link
                href={`/preview/invoice/${invoiceId}`}
                className="text-xs text-[#808080] flex items-center gap-1"
                target="_blank"
              >
                <Icons.ExternalLink className="size-3" />
                <span>Preview invoice</span>
              </Link>

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
            <CreateButton />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
