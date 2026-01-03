import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { useEffect } from "react";
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
import { SettingsMenu } from "./settings-menu";
import { SubmitButton } from "./submit-button";
import { Summary } from "./summary";
import { TemplateSelector } from "./template-selector";
import { transformFormValuesToDraft } from "./utils";

export function Form() {
  const { invoiceId, setParams } = useInvoiceParams();
  const { data: user } = useUserQuery();

  const form = useFormContext();
  const token = form.watch("token");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const draftInvoiceMutation = useMutation(
    trpc.invoice.draft.mutationOptions({
      onSuccess: (data) => {
        if (!invoiceId && data?.id) {
          setParams({ type: "edit", invoiceId: data.id });
        }

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

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.paymentStatus.queryKey(),
        });

        // Invalidate global search
        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
        });

        setParams({ type: "success", invoiceId: data.id });
      },
      onError: (error) => {
        console.log(error);
        // Check if this is a scheduling error using the specific error code
        if (error.data?.code === "SERVICE_UNAVAILABLE") {
          toast({
            title: "Scheduling Failed",
            description:
              "Please try again. If the issue persists, contact support.",
          });
        } else {
          // Generic error handling for other invoice creation errors
          toast({
            title: "Invoice Creation Failed",
            description: "An unexpected error occurred. Please try again.",
          });
        }
      },
    }),
  );

  const createRecurringInvoiceMutation = useMutation(
    trpc.invoiceRecurring.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoiceRecurring.list.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.invoice.invoiceSummary.queryKey(),
        });

        // Invalidate global search
        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
        });

        toast({
          title: "Recurring Invoice Created",
          description: "Your recurring invoice series has been set up.",
        });

        setParams(null);
      },
      onError: (error) => {
        console.log(error);
        toast({
          title: "Recurring Invoice Failed",
          description: "An unexpected error occurred. Please try again.",
        });
      },
    }),
  );

  // Only watch the fields that are used in the upsert action
  const formValues = useWatch({
    control: form.control,
    name: [
      "customerDetails",
      "customerId",
      "customerName",
      "template",
      "lineItems",
      "amount",
      "vat",
      "tax",
      "discount",
      "dueDate",
      "issueDate",
      "noteDetails",
      "paymentDetails",
      "fromDetails",
      "invoiceNumber",
      "topBlock",
      "bottomBlock",
      "scheduledAt",
      "recurringConfig",
    ],
  });

  const isDirty = form.formState.isDirty;
  const invoiceNumberValid = !form.getFieldState("invoiceNumber").error;
  const [debouncedValue] = useDebounceValue(formValues, 500);

  useEffect(() => {
    if (isDirty && form.watch("customerId") && invoiceNumberValid) {
      const currentFormValues = form.getValues();
      draftInvoiceMutation.mutate(
        // @ts-expect-error
        transformFormValuesToDraft(currentFormValues),
      );
    }
  }, [debouncedValue, isDirty, invoiceNumberValid]);

  // Submit the form and the draft invoice
  const handleSubmit = (values: InvoiceFormValues) => {
    // Handle recurring invoices differently
    if (values.template.deliveryType === "recurring" && values.recurringConfig) {
      const config = values.recurringConfig;

      // Calculate due date offset from issue date to due date
      const issueDate = new Date(values.issueDate);
      const dueDate = new Date(values.dueDate);
      const dueDateOffset = differenceInDays(dueDate, issueDate);

      // Remove deliveryType from template since recurring is handled differently
      const { deliveryType: _, ...templateWithoutDeliveryType } = values.template;

      createRecurringInvoiceMutation.mutate({
        customerId: values.customerId,
        customerName: values.customerName ?? undefined,
        frequency: config.frequency,
        frequencyDay: config.frequencyDay,
        frequencyWeek: config.frequencyWeek,
        frequencyInterval: config.frequencyInterval,
        endType: config.endType,
        endDate: config.endDate,
        endCount: config.endCount,
        timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        dueDateOffset: dueDateOffset > 0 ? dueDateOffset : 30,
        amount: values.amount,
        currency: values.template.currency,
        lineItems: values.lineItems,
        template: {
          ...templateWithoutDeliveryType,
          deliveryType: "create_and_send" as const, // Recurring invoices are sent automatically
        },
        paymentDetails: values.paymentDetails,
        fromDetails: values.fromDetails,
        noteDetails: values.noteDetails,
        vat: values.vat,
        tax: values.tax,
        discount: values.discount,
        subtotal: values.subtotal,
        topBlock: values.topBlock,
        bottomBlock: values.bottomBlock,
      });
      return;
    }

    // Handle regular invoice creation
    const deliveryType = values.template.deliveryType;
    createInvoiceMutation.mutate({
      id: values.id,
      deliveryType: deliveryType === "recurring" ? "create" : (deliveryType ?? "create"),
      scheduledAt: values.scheduledAt || undefined,
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
      // @ts-expect-error
      onSubmit={form.handleSubmit(handleSubmit)}
      className="relative h-full"
      onKeyDown={handleKeyDown}
    >
      <ScrollArea
        className="h-[calc(100vh-110px)] p-6 [&>div>div]:h-full"
        hideScrollbar
      >
        <div className="p-8 pb-4 h-full flex flex-col bg-[#fcfcfc] dark:bg-[#0f0f0f]">
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

          <EditBlock name="topBlock" />

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

            <EditBlock name="bottomBlock" />
          </div>
        </div>
      </ScrollArea>

      <div className="absolute bottom-4 w-full border-t border-border pt-4 px-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <SettingsMenu />
              <TemplateSelector />
            </div>

            <div className="flex gap-2">
              {token && (
                <OpenURL href={`${getUrl()}/i/${token}`}>
                  <Button variant="outline" size="icon" type="button">
                    <Icons.ExternalLink className="size-3" />
                  </Button>
                </OpenURL>
              )}

              <SubmitButton
                isSubmitting={createInvoiceMutation.isPending || createRecurringInvoiceMutation.isPending}
                disabled={
                  createInvoiceMutation.isPending ||
                  createRecurringInvoiceMutation.isPending ||
                  draftInvoiceMutation.isPending
                }
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
