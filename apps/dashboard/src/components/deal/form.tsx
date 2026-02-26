import { useDealParams } from "@/hooks/use-deal-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { isDateInFutureUTC } from "@midday/deal/recurring";
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
import { MerchantDetails } from "./merchant-details";
import { EditBlock } from "./edit-block";
import type { DealFormValues } from "./form-context";
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
  const { dealId, setParams } = useDealParams();
  const { data: user } = useUserQuery();

  const form = useFormContext();
  const token = form.watch("token");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const draftDealMutation = useMutation(
    trpc.deal.draft.mutationOptions({
      onSuccess: (data) => {
        if (!dealId && data?.id) {
          setParams({ type: "edit", dealId: data.id });
        }

        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.dealSummary.queryKey(),
        });
      },
    }),
  );

  const createDealMutation = useMutation(
    trpc.deal.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.getById.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.dealSummary.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.paymentStatus.queryKey(),
        });

        // Invalidate global search
        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
        });

        setParams({ type: "success", dealId: data.id });
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
          // Generic error handling for other deal creation errors
          toast({
            title: "Deal Creation Failed",
            description: "An unexpected error occurred. Please try again.",
          });
        }
      },
    }),
  );

  const createRecurringDealMutation = useMutation(
    trpc.dealRecurring.create.mutationOptions({
      onSuccess: () => {
        // Invalidate queries - the form will be closed by createDealMutation
        queryClient.invalidateQueries({
          queryKey: trpc.deal.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.dealRecurring.list.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.deal.dealSummary.queryKey(),
        });

        // Invalidate global search
        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
        });

        // Don't show toast or close form here - createDealMutation will handle that
      },
      onError: (error) => {
        toast({
          title: "Recurring Deal Failed",
          description: "An unexpected error occurred. Please try again.",
        });
      },
    }),
  );

  // Mutation to update recurring series template when editing an deal in a series
  const updateRecurringTemplateMutation = useMutation(
    trpc.dealRecurring.update.mutationOptions(),
  );

  // Mutation to update deal status (used for scheduling future-dated recurring deals)
  const updateDealMutation = useMutation(
    trpc.deal.update.mutationOptions({
      onError: () => {
        toast({
          title: "Scheduling Failed",
          description:
            "The recurring series was created, but the deal could not be scheduled. Please try again.",
        });
      },
    }),
  );

  // Only watch the fields that are used in the upsert action
  const formValues = useWatch({
    control: form.control,
    name: [
      "merchantDetails",
      "merchantId",
      "merchantName",
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
      "dealNumber",
      "topBlock",
      "bottomBlock",
      "scheduledAt",
      "recurringConfig",
      "dealRecurringId",
    ],
  });

  const isDirty = form.formState.isDirty;
  const dealNumberValid = !form.getFieldState("dealNumber").error;
  const [debouncedValue] = useDebounceValue(formValues, 500);

  useEffect(() => {
    if (isDirty && form.watch("merchantId") && dealNumberValid) {
      const currentFormValues = form.getValues();
      draftDealMutation.mutate(
        // @ts-expect-error
        transformFormValuesToDraft(currentFormValues),
      );

      // If deal is part of a recurring series, also update the series template
      const dealRecurringId = currentFormValues.dealRecurringId;
      if (dealRecurringId) {
        // Remove deliveryType from template since "recurring" is not a valid API deliveryType
        const { deliveryType: _, ...templateWithoutDeliveryType } =
          currentFormValues.template;

        updateRecurringTemplateMutation.mutate({
          id: dealRecurringId,
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
        });
      }
    }
  }, [debouncedValue, isDirty, dealNumberValid]);

  // Submit the form and the draft deal
  const handleSubmit = async (values: DealFormValues) => {
    // Handle recurring deals differently
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
        // First create the recurring series and link the draft deal
        const recurringResult =
          await createRecurringDealMutation.mutateAsync({
            dealId: values.id, // Link the draft deal to the recurring series
            merchantId: values.merchantId,
            merchantName: values.merchantName ?? undefined,
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
              deliveryType: "create_and_send" as const, // Recurring deals are sent automatically
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
          form.setValue("dealRecurringId", recurringResult.id);
        }

        // Check if issue date is in the future (at the UTC day level)
        // If so, don't send the deal immediately - the scheduler will handle it
        // Using isDateInFutureUTC ensures consistent behavior with the backend
        const isIssueDateFuture = isDateInFutureUTC(issueDate);

        if (isIssueDateFuture) {
          // Future-dated recurring deal:
          // - Set status to "scheduled" so user understands it will be sent later
          // - Set scheduledAt to the issue date for consistency with the status tooltip
          // - The scheduler will send it on the issue date
          // - Navigate to success page
          await updateDealMutation.mutateAsync({
            id: values.id,
            status: "scheduled",
            scheduledAt: issueDate.toISOString(),
          });

          queryClient.invalidateQueries({
            queryKey: trpc.deal.get.infiniteQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.deal.dealSummary.queryKey(),
          });
          setParams({ type: "success", dealId: values.id });
        } else {
          // Issue date is today or in the past - send immediately
          createDealMutation.mutate({
            id: values.id,
            deliveryType: "create_and_send",
          });
        }
      } catch {
        // Errors are handled by each mutation's onError handler
        // - createRecurringDealMutation.onError shows "Recurring Deal Failed"
        // - updateDealMutation.onError shows "Scheduling Failed"
      }
      return;
    }

    // Handle regular deal creation
    const deliveryType = values.template.deliveryType;
    createDealMutation.mutate({
      id: values.id,
      deliveryType:
        deliveryType === "recurring" ? "create" : (deliveryType ?? "create"),
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
              <MerchantDetails />
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
                isSubmitting={
                  createDealMutation.isPending ||
                  createRecurringDealMutation.isPending
                }
                disabled={
                  createDealMutation.isPending ||
                  createRecurringDealMutation.isPending ||
                  draftDealMutation.isPending
                }
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
