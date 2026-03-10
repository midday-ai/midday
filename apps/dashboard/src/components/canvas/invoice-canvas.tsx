"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { invoiceArtifact } from "@api/ai/artifacts/invoice";
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
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useRef } from "react";
import { FormProvider, useFormContext, useWatch } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { BaseCanvas } from "@/components/canvas/base";
import { CustomerDetails } from "@/components/invoice/customer-details";
import type { InvoiceFormValues } from "@/components/invoice/form-context";
import { invoiceFormSchema } from "@/components/invoice/form-context";
import { FromDetails } from "@/components/invoice/from-details";
import { LineItems } from "@/components/invoice/line-items";
import { Logo } from "@/components/invoice/logo";
import { Meta } from "@/components/invoice/meta";
import { NoteDetails } from "@/components/invoice/note-details";
import { PaymentDetails } from "@/components/invoice/payment-details";
import { SettingsMenu } from "@/components/invoice/settings-menu";
import { SubmitButton } from "@/components/invoice/submit-button";
import { Summary } from "@/components/invoice/summary";
import { TemplateSelector } from "@/components/invoice/template-selector";
import { transformFormValuesToDraft } from "@/components/invoice/utils";
import { SavingBar } from "@/components/saving-bar";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useInvoiceEditorStore } from "@/store/invoice-editor";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";

function InvoiceCanvasForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setParams } = useInvoiceParams();
  const form = useFormContext<InvoiceFormValues>();
  const token = form.watch("token");
  const deliveryType = form.watch("template.deliveryType");

  const templateUpsertCount = useIsMutating({
    mutationKey: trpc.invoiceTemplate.upsert.mutationKey(),
  });

  const draftInvoiceMutation = useMutation(
    trpc.invoice.draft.mutationOptions({
      onSuccess: () => {
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
        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
        });

        setParams({ type: "success", invoiceId: data.id });
      },
      onError: (error) => {
        if (error.data?.code === "SERVICE_UNAVAILABLE") {
          toast({
            title: "Scheduling Failed",
            description:
              "Please try again. If the issue persists, contact support.",
          });
        } else {
          toast({
            title: "Invoice Creation Failed",
            description: "An unexpected error occurred. Please try again.",
          });
        }
      },
    }),
  );

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
    ],
  });

  const invoiceNumberValid = !form.getFieldState("invoiceNumber").error;
  const [debouncedValue] = useDebounceValue(formValues, 500);

  useEffect(() => {
    const currentFormValues = form.getValues();
    const store = useInvoiceEditorStore.getState();

    if (!store.initialized) {
      store.initialize(currentFormValues);
      return;
    }

    if (!store.hasChanged(currentFormValues)) return;
    if (!currentFormValues.customerId || !invoiceNumberValid) return;

    const serialized = JSON.stringify(currentFormValues);

    draftInvoiceMutation.mutate(
      transformFormValuesToDraft(currentFormValues) as any,
      {
        onSuccess: () => {
          store.setSnapshot(serialized);
        },
      },
    );
  }, [debouncedValue, invoiceNumberValid]);

  const handleSubmit = async (values: InvoiceFormValues) => {
    const dt = values.template.deliveryType;
    createInvoiceMutation.mutate({
      id: values.id,
      deliveryType: dt === "recurring" ? "create" : (dt ?? "create"),
      scheduledAt: values.scheduledAt || undefined,
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="relative h-full flex flex-col"
    >
      <ScrollArea className="flex-1 [&>div>div]:h-full" hideScrollbar>
        <div className="p-6 pb-4 flex flex-col bg-[#fcfcfc] dark:bg-[#0f0f0f]">
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
          </div>
        </div>

        <SavingBar
          isPending={draftInvoiceMutation.isPending || templateUpsertCount > 0}
          isError={draftInvoiceMutation.isError}
        />
      </ScrollArea>

      <div className="shrink-0 border-t border-border pt-4 pb-4 px-6">
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
              isSubmitting={createInvoiceMutation.isPending}
              disabled={
                createInvoiceMutation.isPending ||
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
    </form>
  );
}

function InvoiceCanvasInner({
  invoiceId,
  artifactVersion,
}: {
  invoiceId: string;
  artifactVersion: number;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const prevVersionRef = useRef(artifactVersion);

  const { data: defaultSettings } = useSuspenseQuery(
    trpc.invoice.defaultSettings.queryOptions(),
  );

  const { data, dataUpdatedAt } = useQuery(
    trpc.invoice.getById.queryOptions(
      { id: invoiceId },
      {
        enabled: !!invoiceId,
        staleTime: 0,
        refetchInterval: 3000,
      },
    ),
  );

  useEffect(() => {
    if (artifactVersion !== prevVersionRef.current) {
      prevVersionRef.current = artifactVersion;
      queryClient.refetchQueries({
        queryKey: trpc.invoice.getById.queryKey({ id: invoiceId }),
      });
    }
  }, [artifactVersion, invoiceId, queryClient, trpc]);

  const form = useZodForm(invoiceFormSchema, {
    // @ts-expect-error
    defaultValues: defaultSettings,
    mode: "onChange",
  });

  useEffect(() => {
    if (data) {
      form.reset({
        ...(defaultSettings ?? {}),
        ...(data ?? {}),
        // @ts-expect-error
        template: {
          ...(defaultSettings?.template ?? {}),
          ...(data?.template ?? {}),
        },
        customerId:
          data?.customerId ?? defaultSettings?.customerId ?? undefined,
      });
      useInvoiceEditorStore.getState().markReset();
    }
  }, [dataUpdatedAt]);

  if (!data) {
    return (
      <BaseCanvas>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <p className="text-sm">Loading invoice...</p>
          </div>
        </div>
      </BaseCanvas>
    );
  }

  return (
    <BaseCanvas>
      <FormProvider {...form}>
        <InvoiceCanvasForm />
      </FormProvider>
    </BaseCanvas>
  );
}

export function InvoiceCanvas() {
  const [version] = useQueryState("version", parseAsInteger.withDefault(0));
  const [artifact] = useArtifact(invoiceArtifact, { version });
  const { data } = artifact;

  if (!data?.invoiceId) {
    return (
      <BaseCanvas>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <p className="text-sm">
              {data?.stage === "creating"
                ? "Creating invoice..."
                : "Waiting for invoice data..."}
            </p>
          </div>
        </div>
      </BaseCanvas>
    );
  }

  return (
    <InvoiceCanvasInner
      invoiceId={data.invoiceId}
      artifactVersion={data.version}
    />
  );
}
