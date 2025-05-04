"use client";

import { importTransactionsAction } from "@/actions/transactions/import-transactions";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { useUpload } from "@/hooks/use-upload";
import { useUserQuery } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { AnimatedSizeContainer } from "@midday/ui/animated-size-container";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { stripSpecialCharacters } from "@midday/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useAction } from "next-safe-action/hooks";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { ImportCsvContext, importSchema } from "./context";
import { FieldMapping } from "./field-mapping";
import { SelectFile } from "./select-file";

const pages = ["select-file", "confirm-import"] as const;

type Props = {
  currencies: string[];
  defaultCurrency: string;
};

export function ImportModal({ currencies, defaultCurrency }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [runId, setRunId] = useState<string | undefined>();
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [isImporting, setIsImporting] = useState(false);
  const [fileColumns, setFileColumns] = useState<string[] | null>(null);
  const [firstRows, setFirstRows] = useState<Record<string, string>[] | null>(
    null,
  );

  const { data: user } = useUserQuery();

  const [pageNumber, setPageNumber] = useState<number>(0);
  const page = pages[pageNumber];

  const { uploadFile } = useUpload();

  const { toast } = useToast();

  const { status, setStatus } = useSyncStatus({ runId, accessToken });

  const [params, setParams] = useQueryStates({
    step: parseAsString,
    accountId: parseAsString,
    type: parseAsString,
    hide: parseAsBoolean.withDefault(false),
  });

  const isOpen = params.step === "import";

  const importTransactions = useAction(importTransactionsAction, {
    onSuccess: ({ data }) => {
      if (data) {
        setRunId(data.id);
        setAccessToken(data.publicAccessToken);
      }
    },
    onError: () => {
      setIsImporting(false);
      setRunId(undefined);
      setStatus("FAILED");

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

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

  const onclose = () => {
    setFileColumns(null);
    setFirstRows(null);
    setPageNumber(0);
    reset();

    setParams({
      step: null,
      accountId: null,
      type: null,
      hide: null,
    });
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
    if (status === "FAILED") {
      setIsImporting(false);
      setRunId(undefined);

      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again or contact support.",
      });
    }
  }, [status]);

  useEffect(() => {
    if (status === "COMPLETED") {
      setRunId(undefined);
      setIsImporting(false);
      onclose();

      queryClient.invalidateQueries({
        queryKey: trpc.transactions.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.bankAccounts.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.bankConnections.get.queryKey(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.metrics.queryKey(),
      });

      toast({
        duration: 3500,
        variant: "success",
        title: "Transactions imported successfully.",
      });
    }
  }, [status]);

  // Go to second page if file looks good
  useEffect(() => {
    if (file && fileColumns && pageNumber === 0) {
      setPageNumber(1);
    }
  }, [file, fileColumns, pageNumber]);

  return (
    <Dialog open={isOpen} onOpenChange={onclose}>
      <DialogContent>
        <div className="p-4 pb-0">
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
                "We’ve mapped each column to what we believe is correct, but please review the data below to confirm it’s accurate."}
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
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
                <div>
                  <form
                    className="flex flex-col gap-y-4"
                    onSubmit={handleSubmit(async (data) => {
                      setIsImporting(true);

                      const filename = stripSpecialCharacters(data.file.name);
                      const { path } = await uploadFile({
                        bucket: "vault",
                        path: [user?.team_id, "imports", filename],
                        file,
                      });

                      importTransactions.execute({
                        filePath: path,
                        currency: data.currency,
                        bankAccountId: data.bank_account_id,
                        currentBalance: data.balance,
                        inverted: data.inverted,
                        mappings: {
                          amount: data.amount,
                          date: data.date,
                          description: data.description,
                        },
                      });
                    })}
                  >
                    {page === "select-file" && <SelectFile />}
                    {page === "confirm-import" && (
                      <>
                        <FieldMapping currencies={currencies} />

                        <SubmitButton
                          isSubmitting={isImporting}
                          disabled={!isValid}
                          className="mt-4"
                        >
                          Confirm import
                        </SubmitButton>

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
