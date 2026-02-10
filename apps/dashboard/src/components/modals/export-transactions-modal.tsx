"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
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
import { Separator } from "@midday/ui/separator";
import { Spinner } from "@midday/ui/spinner";
import { Switch } from "@midday/ui/switch";
import NumberFlow from "@number-flow/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { z } from "zod/v3";
import { useJobStatus } from "@/hooks/use-job-status";
import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { useExportStore } from "@/store/export";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";

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

interface ExportTransactionsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportTransactionsModal({
  isOpen,
  onOpenChange,
}: ExportTransactionsModalProps) {
  const { exportData, setExportData, setIsExporting } = useExportStore();
  const { rowSelectionByTab, setRowSelection } = useTransactionsStore();
  // Export modal is used from review tab, so use review tab selection
  const rowSelection = rowSelectionByTab.review;
  const { data: user } = useUserQuery();
  const { data: team } = useTeamQuery();
  const teamMutation = useTeamMutation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  // Get transaction IDs - only manually selected transactions
  const transactionIds = useMemo(() => {
    return Object.keys(rowSelection);
  }, [rowSelection]);

  const totalCount = transactionIds.length;

  const { status: jobStatus } = useJobStatus({
    jobId: exportData?.runId,
    enabled: !!exportData?.runId && isOpen,
  });

  // Handle job completion/failure
  useEffect(() => {
    if (jobStatus === "completed") {
      setIsExporting(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: trpc.transactions.get.infiniteQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.transactions.getReviewCount.queryKey(),
      });
      // Delay clearing exportData to allow export bar to show completion
      setTimeout(() => {
        setExportData(undefined);
      }, 2000);
      onOpenChange(false);
    } else if (jobStatus === "failed") {
      setIsExporting(false);
      setExportData(undefined);
    }
  }, [
    jobStatus,
    setIsExporting,
    setExportData,
    onOpenChange,
    queryClient,
    trpc.transactions.get,
    trpc.transactions.getReviewCount,
  ]);

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

  // File export mutation
  const exportMutation = useMutation(
    trpc.transactions.export.mutationOptions({
      onSuccess: (data) => {
        if (data?.id) {
          setExportData({ runId: data.id, exportType: "file" });
          setRowSelection("review", {});
          // Close modal immediately - toast will show progress
          onOpenChange(false);
        }
      },
      onError: () => {
        setIsExporting(false);
      },
    }),
  );

  const onFileExport = async (values: z.infer<typeof exportSettingsSchema>) => {
    if (transactionIds.length === 0) return;

    setIsExporting(true);

    await teamMutation.mutateAsync({
      exportSettings: values,
    });

    exportMutation.mutate({
      transactionIds,
      dateFormat: user?.dateFormat ?? undefined,
      locale: user?.locale ?? undefined,
      exportSettings: values,
    });
  };

  const isExporting =
    exportMutation.isPending ||
    jobStatus === "active" ||
    jobStatus === "waiting";

  const sendEmail = form.watch("sendEmail");
  const includeCSV = form.watch("includeCSV");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <div className="p-4">
          <DialogHeader className="mb-6">
            <DialogTitle>Export Transactions</DialogTitle>
            <DialogDescription>
              Export <NumberFlow value={totalCount} /> transaction
              {totalCount !== 1 ? "s" : ""} to your vault.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onFileExport)}
              className="space-y-4"
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
                    form.formState.isSubmitting ||
                    transactionIds.length === 0
                  }
                >
                  {exportMutation.isPending ? (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
