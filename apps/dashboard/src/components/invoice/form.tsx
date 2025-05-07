import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { formatRelativeTime } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { OpenURL } from "../open-url";
import { CustomerDetails } from "./customer-details";
import { EditBlock } from "./edit-block";
import type { InvoiceFormValues } from "./form-context";
import { FromDetails } from "./from-details";
import { LineItems } from "./line-items";
import { Logo } from "./logo";
import { Meta } from "./meta";
import { NoteDetails } from "./note-details";
import { PaymentDetails } from "./payment-details";
import { SubmitButton } from "./submit-button";
import { Summary } from "./summary";
import { transformFormValuesToDraft } from "./utils";

export function Form() {
  const { invoiceId, setParams } = useInvoiceParams();
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();
  const [lastEditedText, setLastEditedText] = useState("");

  const form = useFormContext();
  const token = form.watch("token");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const draftInvoiceMutation = useMutation(
    trpc.invoice.draft.mutationOptions({
      onSuccess: (data) => {
        if (!invoiceId && data?.id) {
          setParams({ type: "edit", invoiceId: data.id });
        }

        setLastUpdated(new Date());

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.invoiceSummary.queryKey(),
        });
      },
    }),
  );

  const createInvoiceMutation = useMutation(
    trpc.invoice.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.invoiceSummary.queryKey(),
        });

        setParams({ type: "success", invoiceId: data.id });
      },
    }),
  );

  // Only watch the fields that are used in the upsert action
  const formValues = useWatch({
    control: form.control,
    name: [
      "customer_details",
      "customer_id",
      "customer_name",
      "template",
      "line_items",
      "amount",
      "vat",
      "tax",
      "discount",
      "due_date",
      "issue_date",
      "note_details",
      "payment_details",
      "from_details",
      "invoice_number",
      "top_block",
      "bottom_block",
    ],
  });

  const isDirty = form.formState.isDirty;
  const invoiceNumberValid = !form.getFieldState("invoice_number").error;
  const [debouncedValue] = useDebounceValue(formValues, 500);

  useEffect(() => {
    if (isDirty && form.watch("customer_id") && invoiceNumberValid) {
      const currentFormValues = form.getValues();
      draftInvoiceMutation.mutate(
        transformFormValuesToDraft(currentFormValues),
      );
    }
  }, [debouncedValue, isDirty, invoiceNumberValid]);

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

  // Submit the form and the draft invoice
  const handleSubmit = (values: InvoiceFormValues) => {
    createInvoiceMutation.mutate({
      id: values.id,
      deliveryType: values.template.delivery_type ?? "create",
    });
  };

  // Prevent form from submitting when pressing enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="relative h-full"
      onKeyDown={handleKeyDown}
    >
      <ScrollArea className="h-[calc(100vh-200px)] bg-background" hideScrollbar>
        <div className="p-8 pb-4 h-full flex flex-col">
          <div className="flex justify-between">
            <Meta />
            <Logo />
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8 mb-4">
            <div>
              <FromDetails />
            </div>
            <div>
              <CustomerDetails />
            </div>
          </div>

          <EditBlock name="top_block" />

          <div className="mt-4">
            <LineItems />
          </div>

          <div className="mt-12 flex justify-end mb-8">
            <Summary />
          </div>

          <div className="flex flex-col mt-auto">
            <div className="grid grid-cols-2 gap-6 mb-4 overflow-hidden">
              <PaymentDetails />
              <NoteDetails />
            </div>

            <EditBlock name="bottom_block" />
          </div>
        </div>
      </ScrollArea>

      <div className="absolute bottom-14 w-full h-9">
        <div className="flex justify-between items-center mt-auto">
          <div className="flex space-x-2 items-center text-xs text-[#808080]">
            {token && (
              <>
                <OpenURL
                  href={`${getUrl()}/i/${token}`}
                  className="flex items-center gap-1"
                >
                  <Icons.ExternalLink className="size-3" />
                  <span>Preview invoice</span>
                </OpenURL>

                {(draftInvoiceMutation.isPending || lastEditedText) && (
                  <span>-</span>
                )}
              </>
            )}

            {(draftInvoiceMutation.isPending || lastEditedText) && (
              <span>
                {draftInvoiceMutation.isPending ? "Saving" : lastEditedText}
              </span>
            )}
          </div>

          <SubmitButton
            isSubmitting={createInvoiceMutation.isPending}
            disabled={
              createInvoiceMutation.isPending || draftInvoiceMutation.isPending
            }
          />
        </div>
      </div>
    </form>
  );
}
