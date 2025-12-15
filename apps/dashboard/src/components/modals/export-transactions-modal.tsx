"use client";

import { useJobStatus } from "@/hooks/use-job-status";
import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { useExportStore } from "@/store/export";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { RadioGroup, RadioGroupItem } from "@midday/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Separator } from "@midday/ui/separator";
import { Spinner } from "@midday/ui/spinner";
import { Switch } from "@midday/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import NumberFlow from "@number-flow/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod/v3";

const exportSettingsSchema = z
  .object({
    csvDelimiter: z.string(),
    includeCSV: z.boolean(),
    includeXLSX: z.boolean(),
    sendEmail: z.boolean(),
    accountantEmail: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.sendEmail) {
        if (!data.accountantEmail || data.accountantEmail.trim() === "") {
          return false;
        }

        return z.string().email().safeParse(data.accountantEmail.trim())
          .success;
      }
      return true;
    },
    {
      message: "Please enter a valid email address",
      path: ["accountantEmail"],
    },
  )
  .refine((data) => data.includeCSV || data.includeXLSX, {
    message: "Please select at least one export format",
  });

const accountingExportSchema = z.object({
  providerId: z.string(),
  includeAttachments: z.boolean(),
});

// Accounting provider display info
const ACCOUNTING_PROVIDERS = {
  xero: {
    name: "Xero",
    icon: "🟢",
    description: "Push transactions to your Xero organization",
  },
  quickbooks: {
    name: "QuickBooks",
    icon: "🟢",
    description: "Push transactions to QuickBooks Online",
  },
  fortnox: {
    name: "Fortnox",
    icon: "🟣",
    description: "Push transactions to Fortnox",
  },
  visma: {
    name: "Visma",
    icon: "🔵",
    description: "Push transactions to Visma",
  },
} as const;

interface ExportTransactionsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportTransactionsModal({
  isOpen,
  onOpenChange,
}: ExportTransactionsModalProps) {
  const { exportData, setExportData, setIsExporting } = useExportStore();
  const { rowSelection, setRowSelection } = useTransactionsStore();
  const { data: user } = useUserQuery();
  const { data: team } = useTeamQuery();
  const teamMutation = useTeamMutation();
  const trpc = useTRPC();
  const [activeTab, setActiveTab] = useState<"file" | "accounting">("file");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [includeAccountingAttachments, setIncludeAccountingAttachments] =
    useState(true);

  // Fetch connected accounting providers
  const { data: connectedApps } = useQuery(
    trpc.apps.getApps.queryOptions(undefined, {
      enabled: isOpen,
    })
  );

  // Filter to only accounting providers
  const accountingProviderIds = ["xero", "quickbooks", "fortnox", "visma"];
  const connectedAccountingProviders =
    connectedApps?.filter((app) =>
      accountingProviderIds.includes(app.app_id)
    ) ?? [];

  // Set default selected provider when providers load
  useEffect(() => {
    if (connectedAccountingProviders.length > 0 && !selectedProvider) {
      setSelectedProvider(connectedAccountingProviders[0]?.app_id ?? "");
    }
  }, [connectedAccountingProviders, selectedProvider]);

  // Poll job status if we have a job ID
  const {
    status: jobStatus,
    progress,
    error: jobError,
  } = useJobStatus({
    jobId: exportData?.runId,
    enabled: !!exportData?.runId && isOpen,
  });

  // Handle job completion/failure
  useEffect(() => {
    if (jobStatus === "completed") {
      setIsExporting(false);
      // Delay clearing exportData to allow export bar to show completion
      setTimeout(() => {
        setExportData(undefined);
      }, 2000);
      onOpenChange(false);
    } else if (jobStatus === "failed") {
      setIsExporting(false);
      setExportData(undefined);
    }
  }, [jobStatus, setIsExporting, setExportData, onOpenChange]);

  const ids = Object.keys(rowSelection);
  const totalSelected = ids.length;

  // Load saved settings from team
  const savedSettings = (team?.exportSettings as z.infer<
    typeof exportSettingsSchema
  >) || {
    csvDelimiter: ",",
    includeCSV: true,
    includeXLSX: true,
    sendEmail: false,
    accountantEmail: "",
  };

  const form = useZodForm(exportSettingsSchema, {
    defaultValues: savedSettings,
    mode: "onChange",
  });

  // Update form when team data changes
  useEffect(() => {
    if (team?.exportSettings) {
      form.reset(team.exportSettings as z.infer<typeof exportSettingsSchema>);
    }
  }, [team?.exportSettings, form]);

  const exportMutation = useMutation(
    trpc.transactions.export.mutationOptions({
      onSuccess: (data) => {
        if (data?.id) {
          setExportData({
            runId: data.id,
          });

          setRowSelection(() => ({}));
          // Don't set isExporting to false here - let job status handle it
          // Don't close modal immediately - wait for job to complete
        }
      },
      onError: () => {
        setIsExporting(false);
      },
    })
  );

  // Accounting export mutation
  const accountingExportMutation = useMutation(
    trpc.accounting.export.mutationOptions({
      onSuccess: (data) => {
        if (data?.id) {
          setExportData({
            runId: data.id,
          });

          setRowSelection(() => ({}));
        }
      },
      onError: () => {
        setIsExporting(false);
      },
    })
  );

  const onSubmit = async (values: z.infer<typeof exportSettingsSchema>) => {
    setIsExporting(true);

    await teamMutation.mutateAsync({
      exportSettings: values,
    });

    exportMutation.mutate({
      transactionIds: ids,
      dateFormat: user?.dateFormat ?? undefined,
      locale: user?.locale ?? undefined,
      exportSettings: values,
    });
  };

  const onAccountingExport = async () => {
    if (!selectedProvider) return;

    setIsExporting(true);

    accountingExportMutation.mutate({
      transactionIds: ids,
      providerId: selectedProvider,
      includeAttachments: includeAccountingAttachments,
    });
  };

  const isExporting =
    exportMutation.isPending ||
    accountingExportMutation.isPending ||
    jobStatus === "active" ||
    jobStatus === "waiting";
  const sendEmail = form.watch("sendEmail");
  const includeCSV = form.watch("includeCSV");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <div className="p-4">
          <DialogHeader className="mb-6">
            <DialogTitle>Export Transactions</DialogTitle>
            <DialogDescription>
              Export <NumberFlow value={totalSelected} /> selected transactions
              with your preferred settings. You'll be notified when ready.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "file" | "accounting")}
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="file">File Export</TabsTrigger>
              <TabsTrigger value="accounting">Accounting</TabsTrigger>
            </TabsList>

            <TabsContent value="file">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="includeCSV"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-normal">
                                CSV
                              </FormLabel>
                              <p className="text-xs text-[#878787]">
                                Export as comma-separated values
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    {includeCSV && (
                      <FormField
                        control={form.control}
                        name="csvDelimiter"
                        render={({ field }) => (
                          <Accordion type="single" collapsible className="-mx-4">
                            <AccordionItem
                              value="csv-settings"
                              className="border-0"
                            >
                              <AccordionTrigger className="py-3 px-4 hover:no-underline hover:bg-accent/50">
                                <span className="text-sm text-[#878787]">
                                  CSV Settings
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="px-4">
                                <FormItem>
                                  <div className="space-y-2 pt-2">
                                    <FormLabel
                                      htmlFor="delimiter"
                                      className="text-sm"
                                    >
                                      Delimiter
                                    </FormLabel>
                                    <FormControl>
                                      <RadioGroup
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        className="flex gap-4"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="," id="comma" />
                                          <Label
                                            htmlFor="comma"
                                            className="text-sm font-normal"
                                          >
                                            Comma (,)
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem
                                            value=";"
                                            id="semicolon"
                                          />
                                          <Label
                                            htmlFor="semicolon"
                                            className="text-sm font-normal"
                                          >
                                            Semicolon (;)
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="\t" id="tab" />
                                          <Label
                                            htmlFor="tab"
                                            className="text-sm font-normal"
                                          >
                                            Tab
                                          </Label>
                                        </div>
                                      </RadioGroup>
                                    </FormControl>
                                  </div>
                                </FormItem>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="includeXLSX"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-normal">
                                Excel (XLSX)
                              </FormLabel>
                              <p className="text-xs text-[#878787]">
                                Export as Excel spreadsheet
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="sendEmail"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-normal">
                                Send via email
                              </FormLabel>
                              <p className="text-xs text-[#878787]">
                                Email the export to your accountant
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />

                    {sendEmail && (
                      <FormField
                        control={form.control}
                        name="accountantEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="accountant@example.com"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isExporting || form.formState.isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isExporting ||
                        !form.formState.isValid ||
                        form.formState.isSubmitting
                      }
                    >
                      {isExporting ? (
                        <div className="flex items-center space-x-2">
                          <Spinner className="size-4" />
                          <span>Exporting...</span>
                        </div>
                      ) : (
                        <span>Export</span>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="accounting">
              {connectedAccountingProviders.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-[#878787]">
                    <p className="text-sm">
                      No accounting software connected yet.
                    </p>
                    <p className="text-xs mt-2">
                      Connect your accounting software to push transactions
                      directly.
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/settings/apps">Connect Accounting Software</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {connectedAccountingProviders.length > 1 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-normal">
                        Select Provider
                      </Label>
                      <Select
                        value={selectedProvider}
                        onValueChange={setSelectedProvider}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select accounting provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {connectedAccountingProviders.map((provider) => {
                            const providerInfo =
                              ACCOUNTING_PROVIDERS[
                                provider.app_id as keyof typeof ACCOUNTING_PROVIDERS
                              ];
                            return (
                              <SelectItem
                                key={provider.app_id}
                                value={provider.app_id}
                              >
                                {providerInfo?.icon ?? "📊"}{" "}
                                {providerInfo?.name ?? provider.app_id}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedProvider && (
                    <div className="space-y-4">
                      <div className="p-4 bg-accent/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {ACCOUNTING_PROVIDERS[
                              selectedProvider as keyof typeof ACCOUNTING_PROVIDERS
                            ]?.icon ?? "📊"}
                          </span>
                          <div>
                            <p className="font-medium">
                              {ACCOUNTING_PROVIDERS[
                                selectedProvider as keyof typeof ACCOUNTING_PROVIDERS
                              ]?.name ?? selectedProvider}
                            </p>
                            <p className="text-xs text-[#878787]">
                              {ACCOUNTING_PROVIDERS[
                                selectedProvider as keyof typeof ACCOUNTING_PROVIDERS
                              ]?.description ??
                                "Push transactions to your accounting software"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-normal">
                            Include Attachments
                          </Label>
                          <p className="text-xs text-[#878787]">
                            Upload receipts and invoices with transactions
                          </p>
                        </div>
                        <Switch
                          checked={includeAccountingAttachments}
                          onCheckedChange={setIncludeAccountingAttachments}
                        />
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isExporting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={isExporting || !selectedProvider}
                      onClick={onAccountingExport}
                    >
                      {isExporting ? (
                        <div className="flex items-center space-x-2">
                          <Spinner className="size-4" />
                          <span>Exporting...</span>
                        </div>
                      ) : (
                        <span>
                          Export to{" "}
                          {ACCOUNTING_PROVIDERS[
                            selectedProvider as keyof typeof ACCOUNTING_PROVIDERS
                          ]?.name ?? "Accounting"}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
