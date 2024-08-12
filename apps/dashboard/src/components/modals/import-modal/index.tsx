"use client";

import { importTransactionsAction } from "@/actions/transactions/import-transactions";
import { useUpload } from "@/hooks/use-upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@midday/supabase/client";
import { getCurrentUserTeamQuery } from "@midday/supabase/queries";
import { AnimatedSizeContainer } from "@midday/ui/animated-size-container";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { stripSpecialCharacters } from "@midday/utils";
import { useAction } from "next-safe-action/hooks";
import { parseAsString, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ImportCsvContext,
  type ImportCsvFormData,
  importSchema,
} from "./context";
import { FieldMapping } from "./field-mapping";
import { SelectFile } from "./select-file";

const pages = ["select-file", "confirm-import"] as const;

type Props = {
  currencies: string[];
  defaultCurrency: string;
};

export function ImportModal({ currencies, defaultCurrency }: Props) {
  const [params, setParams] = useQueryStates({
    step: parseAsString,
    accountId: parseAsString,
  });

  const isOpen = params.step === "import";

  const importTransactions = useAction(importTransactionsAction, {
    onSuccess: (data) => {
      console.log(data);
      //
    },
    onError: (data) => {
      console.log(data);
      //
    },
  });

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { isSubmitting, isValid },
  } = useForm<ImportCsvFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      currency: defaultCurrency,
      bank_account_id: params.accountId ?? undefined,
    },
  });

  useEffect(() => {
    if (params.accountId) {
      setValue("bank_account_id", params.accountId);
    }
  }, [params.accountId]);

  const supabase = createClient();
  const { uploadFile } = useUpload();

  const [pageNumber, setPageNumber] = useState<number>(0);
  const page = pages[pageNumber];

  const [fileColumns, setFileColumns] = useState<string[] | null>(null);
  const [firstRows, setFirstRows] = useState<Record<string, string>[] | null>(
    null,
  );

  const file = watch("file");

  // Go to second page if file looks good
  useEffect(() => {
    if (file && fileColumns && pageNumber === 0) {
      setPageNumber(1);
    }
  }, [file, fileColumns, pageNumber]);

  return (
    <Dialog open={isOpen} onOpenChange={() => setParams({ step: null })}>
      <DialogContent>
        <div className="p-4 pb-0">
          <DialogHeader>
            <div className="flex space-x-4 items-center mb-4">
              {!params.accountId && (
                <button
                  type="button"
                  className="items-center border bg-accent p-1"
                  onClick={() => setParams({ step: "connect" })}
                >
                  <Icons.ArrowBack />
                </button>
              )}
              <DialogTitle className="m-0 p-0">Confirm import</DialogTitle>
            </div>
            <DialogDescription>
              {page === "select-file" &&
                "Upload your CSV file with transactions."}
              {page === "confirm-import" &&
                "We’ve mapped each column to what we believe is correct, but please review the data below to confirm it’s accurate."}
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-6">
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
                      const { data: userData } =
                        await getCurrentUserTeamQuery(supabase);

                      const filename = stripSpecialCharacters(data.file.name);

                      const { path } = await uploadFile({
                        bucket: "vault",
                        path: [userData?.team_id, "imports", filename],
                        file,
                      });

                      importTransactions.execute({
                        filePath: path,
                        currency: data.currency,
                        bankAccountId: data.bank_account_id,
                        currentBalance: data.balance,
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

                        <Button
                          disabled={isSubmitting || !isValid}
                          className="mt-4"
                        >
                          Confirm import
                        </Button>

                        <button
                          type="button"
                          className="text-sm mb-4"
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
