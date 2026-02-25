"use client";

import { uniqueCurrencies } from "@midday/location/currencies";
import { AnimatedSizeContainer } from "@midday/ui/animated-size-container";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { SubmitButtonMorph } from "@midday/ui/submit-button-morph";
import { useToast } from "@midday/ui/use-toast";
import { stripSpecialCharacters } from "@midday/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { useInvalidateTransactionQueries } from "@/hooks/use-invalidate-transaction-queries";
import { useJobStatus } from "@/hooks/use-job-status";
import { useTeamQuery } from "@/hooks/use-team";
import { useUpload } from "@/hooks/use-upload";
import { useUserQuery } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { ImportCsvContext, importSchema } from "./context";
import { FieldMapping } from "./field-mapping";
import { getBalanceFromLatestDate } from "./field-mapping.utils";
import { SelectFile } from "./select-file";

const pages = ["select-file", "confirm-import"] as const;

export function ImportModal() {
  const { data: team } = useTeamQuery();
  const defaultCurrency = team?.baseCurrency || "USD";
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidateTransactionQueries = useInvalidateTransactionQueries();
  const [jobId, setJobId] = useState<string | undefined>();
  const [isImporting, setIsImporting] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceIndexRef = useRef(0);
  const [fileColumns, setFileColumns] = useState<string[] | null>(null);
  const [firstRows, setFirstRows] = useState<Record<string, string>[] | null>(
    null,
  );
  const [visibleProgressStep, setVisibleProgressStep] = useState<
    string | undefined
  >();

  const { data: user } = useUserQuery();

  const [pageNumber, setPageNumber] = useState<number>(0);
  const page = pages[pageNumber];

  const { uploadFile } = useUpload();

  const { toast } = useToast();

  const [params, setParams] = useQueryStates({
    step: parseAsString,
    accountId: parseAsString,
    type: parseAsString,
    hide: parseAsBoolean.withDefault(false),
  });

  const isOpen = params.step === "import";

  const { status, progressStep, progress, result } = useJobStatus({
    jobId,
    enabled: !!jobId && isOpen,
    refetchInterval: 300,
  });

  const importTransactions = useMutation(
    trpc.transactions.import.mutationOptions({
      onSuccess: (data) => {
        if (data?.id) {
          setJobId(data.id);
        } else {
          setIsImporting(false);
          toast({
            duration: 3500,
            variant: "error",
            title: "Something went wrong please try again.",
          });
        }
      },
      onError: () => {
        setIsImporting(false);
        setJobId(undefined);

        toast({
          duration: 3500,
          variant: "error",
          title: "Something went wrong please try again.",
        });
      },
    }),
  );

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useZodForm(importSchema, {
    defaultValues: {
      currency: defaultCurrency,
      bank_account_id: params.accountId ?? undefined,
      inverted: params.type === "credit",
    },
  });

  const file = watch("file");

  const requestClose = () => {
    setParams({
      step: null,
      accountId: null,
      type: null,
      hide: null,
    });
  };

  const resetModalState = () => {
    setIsImporting(false);
    setVisibleProgressStep(undefined);
    sequenceIndexRef.current = 0;
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }
    setFileColumns(null);
    setFirstRows(null);
    setPageNumber(0);
    setJobId(undefined);
    reset();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      requestClose();
    }
  };

  useEffect(() => {
    if (params.accountId) {
      setValue("bank_account_id", params.accountId);
    }
  }, [params.accountId]);

  useEffect(() => {
    if (params.type) {
      setValue("inverted", params.type === "credit");
    }
  }, [params.type]);

  useEffect(() => {
    if (status === "failed") {
      setIsImporting(false);
      setJobId(undefined);

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again or contact support.",
      });
    }
  }, [status, toast]);

  // Predefined sequence - backend steps are too fast to poll, so we run these locally.
  const EARLY_STEPS = [
    "analyzing",
    "transforming",
    "validating",
    "importing",
  ] as const;
  const STEP_DURATION_MS = 1000;

  useEffect(() => {
    if (!isImporting) return;

    // Completed: show Done immediately and stop sequence.
    if (status === "completed") {
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
        stepTimeoutRef.current = null;
      }
      setVisibleProgressStep("completed");
      return;
    }

    // Run early steps on a timer (analyzing -> transforming -> validating -> importing).
    const advanceSequence = () => {
      const idx = sequenceIndexRef.current;
      if (idx < EARLY_STEPS.length) {
        setVisibleProgressStep(EARLY_STEPS[idx]);
        sequenceIndexRef.current = idx + 1;
        stepTimeoutRef.current = setTimeout(advanceSequence, STEP_DURATION_MS);
      } else {
        stepTimeoutRef.current = null;
      }
    };

    // First time: show first step and schedule next.
    if (!visibleProgressStep) {
      setVisibleProgressStep(EARLY_STEPS[0]);
      sequenceIndexRef.current = 1;
      stepTimeoutRef.current = setTimeout(advanceSequence, STEP_DURATION_MS);
      return;
    }

    // After we've shown all early steps, follow backend for finalizing/enriching.
    if (sequenceIndexRef.current >= EARLY_STEPS.length && progressStep) {
      if (progressStep === "finalizing" || progressStep === "enriching") {
        setVisibleProgressStep(progressStep);
      }
    }
  }, [isImporting, status, progressStep, visibleProgressStep]);

  useEffect(() => {
    if (status === "completed") {
      // Invalidate all transaction-related queries (transactions, reports, widgets)
      invalidateTransactionQueries();

      // Also invalidate bank-related queries
      queryClient.invalidateQueries({
        queryKey: trpc.bankAccounts.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.bankConnections.get.queryKey(),
      });

      const jobResult = result as
        | {
            skippedCount?: number;
            invalidCount?: number;
            importedCount?: number;
          }
        | undefined;
      const skippedCount = jobResult?.skippedCount ?? 0;
      const invalidCount = jobResult?.invalidCount ?? 0;

      if (invalidCount > 0) {
        toast({
          duration: 5000,
          variant: "info",
          title: `${invalidCount} transaction${invalidCount === 1 ? "" : "s"} skipped due to invalid data (e.g. missing amount or date).`,
        });
      }
      // Only show "already imported" when there are no invalid transactions,
      // to avoid confusing users who had rows with missing/invalid data
      if (skippedCount > 0 && invalidCount === 0) {
        toast({
          duration: 5000,
          variant: "info",
          title: `${skippedCount} transaction${skippedCount === 1 ? "" : "s"} were already imported and skipped.`,
        });
      }

      closeTimeoutRef.current = setTimeout(() => {
        requestClose();
      }, 700);
    }
  }, [status, result, toast]);

  useEffect(() => {
    return () => {
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  // Go to second page if file looks good
  useEffect(() => {
    if (file && fileColumns && firstRows && pageNumber === 0) {
      setPageNumber(1);
    }
  }, [file, fileColumns, firstRows, pageNumber]);

  const importStepLabels: Record<string, string> = {
    analyzing: "Analyzing...",
    transforming: "Mapping with AI...",
    validating: "Checking...",
    importing: "Importing...",
    finalizing: "Finalizing...",
    enriching: "Enriching...",
    completed: "Done",
  };

  const getImportingLabel = () => {
    if (typeof progress !== "number") {
      return importStepLabels.importing;
    }
    if (progress < 58) {
      return "Importing...";
    }
    if (progress < 66) {
      return "Processing...";
    }
    if (progress < 73) {
      return "Almost done...";
    }
    return "Wrapping up...";
  };

  const getStepLabel = (step?: string) => {
    if (!step) {
      return "Importing...";
    }
    return importStepLabels[step] ?? "Importing...";
  };

  const importButtonLabel = (
    isImporting
      ? visibleProgressStep === "importing"
        ? getImportingLabel()
        : getStepLabel(visibleProgressStep)
      : "Confirm import"
  ) as string;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-visible">
        <div className="p-4 pb-0 max-h-[calc(100svh-10vw)] overflow-y-auto overflow-x-visible">
          <DialogHeader>
            <div className="flex space-x-4 items-center mb-4">
              {!params.hide && (
                <button
                  type="button"
                  className="items-center border bg-accent p-1"
                  onClick={() => setParams({ step: "connect" })}
                >
                  <Icons.ArrowBack />
                </button>
              )}
              <DialogTitle className="m-0 p-0">
                {page === "select-file" && "Select file"}
                {page === "confirm-import" && "Confirm import"}
              </DialogTitle>
            </div>
            <DialogDescription>
              {page === "select-file" &&
                "Upload a CSV file of your transactions."}
              {page === "confirm-import" &&
                "We've mapped each column to what we believe is correct, but please review the data below to confirm it's accurate."}
            </DialogDescription>
          </DialogHeader>

          <div className="relative overflow-visible">
            <AnimatedSizeContainer height>
              <ImportCsvContext.Provider
                value={{
                  fileColumns,
                  setFileColumns,
                  firstRows,
                  setFirstRows,
                  control,
                  watch,
                  setValue,
                }}
              >
                <div className="overflow-visible">
                  <form
                    className="flex flex-col gap-y-4"
                    onSubmit={handleSubmit(async (data) => {
                      if (isImporting) {
                        return;
                      }

                      setIsImporting(true);

                      const filename = stripSpecialCharacters(data.file.name);
                      const { path } = await uploadFile({
                        bucket: "vault",
                        path: [user?.team?.id ?? "", "imports", filename],
                        file,
                      });

                      const currentBalance =
                        firstRows && data.date && data.balance
                          ? getBalanceFromLatestDate(
                              firstRows,
                              data.date,
                              data.balance,
                            )
                          : undefined;

                      importTransactions.mutate({
                        filePath: path,
                        currency: data.currency,
                        bankAccountId: data.bank_account_id,
                        currentBalance,
                        inverted: data.inverted,
                        mappings: {
                          amount: data.amount,
                          date: data.date,
                          description: data.description,
                          counterparty: data.counterparty,
                          balance: data.balance,
                        },
                      });
                    })}
                  >
                    {page === "select-file" && <SelectFile />}
                    {page === "confirm-import" && (
                      <>
                        <FieldMapping currencies={uniqueCurrencies} />

                        <SubmitButtonMorph
                          isSubmitting={isImporting}
                          completed={visibleProgressStep === "completed"}
                          disabled={!isValid}
                          className="mt-4"
                          children={importButtonLabel}
                        />

                        <button
                          type="button"
                          className="text-sm mb-4 text-[#878787]"
                          onClick={() => {
                            setPageNumber(0);
                            reset();
                            setFileColumns(null);
                            setFirstRows(null);
                          }}
                        >
                          Choose another file
                        </button>
                      </>
                    )}
                  </form>
                </div>
              </ImportCsvContext.Provider>
            </AnimatedSizeContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
