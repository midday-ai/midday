import { isDateInFutureUTC } from "@midday/invoice/recurring";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useUserQuery } from "@/hooks/use-user";
import { useInvoiceEditorStore } from "@/store/invoice-editor";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { SavingBar } from "../saving-bar";
import { CustomerDetails } from "./customer-details";
import { EditBlock } from "./edit-block";
import { EmailPreview } from "./email-preview";
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
  const deliveryType = form.watch("template.deliveryType");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Track in-flight template upsert mutations (fired by SettingsMenu, labels, etc.)
  // so the SavingBar reacts immediately instead of waiting for the 500ms debounce.
  const templateUpsertCount = useIsMutating({
    mutationKey: trpc.invoiceTemplate.upsert.mutationKey(),
  });

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
        // Invalidate queries - the form will be closed by createInvoiceMutation
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

        // Don't show toast or close form here - createInvoiceMutation will handle that
      },
      onError: (_error) => {
        toast({
          title: "Recurring Invoice Failed",
          description: "An unexpected error occurred. Please try again.",
        });
      },
    }),
  );

  // Mutation to update recurring series template when editing an invoice in a series
  const updateRecurringTemplateMutation = useMutation(
    trpc.invoiceRecurring.update.mutationOptions(),
  );

  // Mutation to update invoice status (used for scheduling future-dated recurring invoices)
  const updateInvoiceMutation = useMutation(
    trpc.invoice.update.mutationOptions({
      onError: () => {
        toast({
          title: "Scheduling Failed",
          description:
            "The recurring series was created, but the invoice could not be scheduled. Please try again.",
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
      "invoiceRecurringId",
    ],
  });

  const invoiceNumberValid = !form.getFieldState("invoiceNumber").error;
  const [debouncedValue] = useDebounceValue(formValues, 500);

  // Auto-save: only save when form values have genuinely changed from what was loaded/last saved.
  // Uses a zustand snapshot store instead of isDirty (which is unreliable with computed fields).
  //
  // After each form.reset(), the store is marked as uninitialized. The first debounce tick
  // captures the fully hydrated state (after Summary and other child effects have settled)
  // as the baseline. Subsequent ticks compare against that baseline.
  useEffect(() => {
    const currentFormValues = form.getValues();
    const store = useInvoiceEditorStore.getState();

    // First debounce after a reset: capture the settled values as baseline, don't save
    if (!store.initialized) {
      store.initialize(currentFormValues);
      return;
    }

    if (!store.hasChanged(currentFormValues)) return;
    if (!currentFormValues.customerId || !invoiceNumberValid) return;

    // Serialize now — getValues() returns a shallow copy so nested objects
    // (e.g. template) are shared mutable refs into the form's internal state.
    // If the user edits a field between mutation start and onSuccess,
    // JSON.stringify would capture the unsaved mutation, causing the next
    // hasChanged() check to silently skip the save.
    const serialized = JSON.stringify(currentFormValues);

    // If invoice is part of a recurring series, both the draft AND the
    // recurring template must save successfully before we mark the snapshot
    // as saved. Otherwise a recurring-template failure would be masked by
    // the draft's onSuccess updating the snapshot, and hasChanged() would
    // return false on the next tick — silently dropping the retry.
    const { invoiceRecurringId } = currentFormValues;
    const needsRecurringUpdate = !!invoiceRecurringId;

    // Track which mutations have completed for this save cycle
    let draftOk = false;
    let recurringOk = !needsRecurringUpdate; // true when no recurring update needed

    const maybeCommitSnapshot = () => {
      if (draftOk && recurringOk) {
        store.setSnapshot(serialized);
      }
    };

    draftInvoiceMutation.mutate(
      // @ts-expect-error
      transformFormValuesToDraft(currentFormValues),
      {
        onSuccess: () => {
          draftOk = true;
          maybeCommitSnapshot();
        },
      },
    );

    if (needsRecurringUpdate) {
      // Remove deliveryType from template since "recurring" is not a valid API deliveryType
      const { deliveryType: _, ...templateWithoutDeliveryType } =
        currentFormValues.template;

      updateRecurringTemplateMutation.mutate(
        {
          id: invoiceRecurringId,
          lineItems: currentFormValues.lineItems,
          template: templateWithoutDeliveryType,
          paymentDetails: currentFormValues.paymentDetails,
          fromDetails: currentFormValues.fromDetails,
          noteDetails: currentFormValues.noteDetails,
          vat: currentFormValues.vat,
          tax: currentFormValues.tax,
          discount: currentFormValues.discount,
          subtotal: currentFormValues.subtotal,
          topBlock: currentFormValues.topBlock,
          bottomBlock: currentFormValues.bottomBlock,
          amount: currentFormValues.amount,
        },
        {
          onSuccess: () => {
            recurringOk = true;
            maybeCommitSnapshot();
          },
          // onError intentionally omitted — recurringOk stays false,
          // snapshot is never committed, and the next debounce tick retries.
        },
      );
    }
  }, [debouncedValue, invoiceNumberValid]);

  // Submit the form and the draft invoice
  const handleSubmit = async (values: InvoiceFormValues) => {
    // Handle recurring invoices differently
    if (
      values.template.deliveryType === "recurring" &&
      values.recurringConfig
    ) {
      const config = values.recurringConfig;

      // Calculate due date offset from issue date to due date
      const issueDate = new Date(values.issueDate);
      const dueDate = new Date(values.dueDate);
      const dueDateOffset = differenceInDays(dueDate, issueDate);

      // Remove deliveryType from template since recurring is handled differently
      const { deliveryType: _, ...templateWithoutDeliveryType } =
        values.template;

      try {
        // First create the recurring series and link the draft invoice
        const recurringResult =
          await createRecurringInvoiceMutation.mutateAsync({
            invoiceId: values.id, // Link the draft invoice to the recurring series
            customerId: values.customerId,
            customerName: values.customerName ?? undefined,
            frequency: config.frequency,
            frequencyDay: config.frequencyDay,
            frequencyWeek: config.frequencyWeek,
            frequencyInterval: config.frequencyInterval,
            endType: config.endType ?? "never",
            endDate: config.endDate,
            endCount: config.endCount,
            timezone:
              user?.timezone ||
              Intl.DateTimeFormat().resolvedOptions().timeZone,
            dueDateOffset: dueDateOffset >= 0 ? dueDateOffset : 30,
            amount: values.amount,
            currency: values.template.currency,
            lineItems: values.lineItems,
            template: {
              ...templateWithoutDeliveryType,
              deliveryType: "create_and_send" as const, // Recurring invoices are sent automatically
            },
            templateId: values.template.id, // Save the template reference
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

        // Update form state with the recurring series ID to prevent duplicate series
        // if the send fails and user retries
        if (recurringResult?.id) {
          form.setValue("invoiceRecurringId", recurringResult.id);
        }

        // Check if issue date is in the future (at the UTC day level)
        // If so, don't send the invoice immediately - the scheduler will handle it
        // Using isDateInFutureUTC ensures consistent behavior with the backend
        const isIssueDateFuture = isDateInFutureUTC(issueDate);

        if (isIssueDateFuture) {
          // Future-dated recurring invoice:
          // - Set status to "scheduled" so user understands it will be sent later
          // - Set scheduledAt to the issue date for consistency with the status tooltip
          // - The scheduler will send it on the issue date
          // - Navigate to success page
          await updateInvoiceMutation.mutateAsync({
            id: values.id,
            status: "scheduled",
            scheduledAt: issueDate.toISOString(),
          });

          queryClient.invalidateQueries({
            queryKey: trpc.invoice.get.infiniteQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.invoice.invoiceSummary.queryKey(),
          });
          setParams({ type: "success", invoiceId: values.id });
        } else {
          // Issue date is today or in the past - send immediately
          createInvoiceMutation.mutate({
            id: values.id,
            deliveryType: "create_and_send",
          });
        }
      } catch {
        // Errors are handled by each mutation's onError handler
        // - createRecurringInvoiceMutation.onError shows "Recurring Invoice Failed"
        // - updateInvoiceMutation.onError shows "Scheduling Failed"
      }
      return;
    }

    // Handle regular invoice creation
    const deliveryType = values.template.deliveryType;
    createInvoiceMutation.mutate({
      id: values.id,
      deliveryType:
        deliveryType === "recurring" ? "create" : (deliveryType ?? "create"),
      scheduledAt: values.scheduledAt || undefined,
    });
  };

  // Prevent form from submitting when pressing enter, but allow newlines in textareas
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
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
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 mr-5">
              <Meta />
            </div>
            <div className="flex-shrink-0">
              <Logo />
            </div>
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

        <SavingBar
          isPending={draftInvoiceMutation.isPending || templateUpsertCount > 0}
          isError={draftInvoiceMutation.isError}
        />
      </ScrollArea>

      <div className="absolute bottom-4 w-full border-t border-border pt-4 px-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <SettingsMenu />
              <TemplateSelector />
            </div>

            <div className="flex gap-2">
              <TooltipProvider delayDuration={100}>
                {deliveryType === "create_and_send" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => setParams({ emailPreview: true })}
                      >
                        <Icons.ForwardToInbox className="size-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      className="text-[10px] px-2 py-1"
                    >
                      Preview email
                    </TooltipContent>
                  </Tooltip>
                )}

                {token && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={() => {
                          window.open(`${getUrl()}/i/${token}`, "_blank");
                        }}
                      >
                        <Icons.ExternalLink className="size-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      className="text-[10px] px-2 py-1"
                    >
                      Preview invoice
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>

              <SubmitButton
                isSubmitting={
                  createInvoiceMutation.isPending ||
                  createRecurringInvoiceMutation.isPending
                }
                disabled={
                  createInvoiceMutation.isPending ||
                  createRecurringInvoiceMutation.isPending ||
                  draftInvoiceMutation.isPending
                }
                className={
                  draftInvoiceMutation.isPending
                    ? "disabled:opacity-100 disabled:cursor-wait"
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>
      <EmailPreview />
    </form>
  );
}
