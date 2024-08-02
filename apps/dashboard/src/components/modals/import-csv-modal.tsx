"use client";

import { importTransactionsAction } from "@/actions/transactions/import-transactions";
import { ImportTransactionsForm } from "@/components/forms/import-transactions-form";
import { useUpload } from "@/hooks/use-upload";
import { createClient } from "@midday/supabase/client";
import { getCurrentUserTeamQuery } from "@midday/supabase/queries";
import { cn } from "@midday/ui/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { Tabs, TabsContent } from "@midday/ui/tabs";
import { stripSpecialCharacters } from "@midday/utils";
import { useAction } from "next-safe-action/hooks";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImportingTransactionsEvent } from "../importing-transactions-event";

type Props = {
  currencies: string[];
  defaultCurrency: string;
};

export function ImportCSVModal({ currencies, defaultCurrency }: Props) {
  const supabase = createClient();
  const [step, setStep] = useQueryState("step");
  const [eventId, setEventId] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState();
  const [activeId, setActiveId] = useState("upload");
  const { uploadFile } = useUpload();

  const importTransactions = useAction(importTransactionsAction, {
    onSuccess: ({ data }) => {
      setIsLoading(false);
      setActiveId("loading");

      if (data) {
        setEventId(data.id);
      }
    },
  });

  const handleTransactions = (data) => {
    setTransactions(data);
    setActiveId("transactions");
  };

  const isOpen = step === "import-csv";

  const onDrop = async ([file]) => {
    setIsLoading(true);

    const { data: userData } = await getCurrentUserTeamQuery(supabase);

    const filename = stripSpecialCharacters(file.name);

    const { path } = await uploadFile({
      bucket: "vault",
      path: [userData?.team_id, "imports", filename],
      file,
    });

    importTransactions.execute({ filePath: path });
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      maxFiles: 1,
      onDrop,
      maxSize: 3000000, // 3MB
      accept: { "text/csv": [".csv"] },
    });

  return (
    <Dialog open={isOpen} onOpenChange={() => setStep(null)}>
      <DialogContent>
        <div className="p-4 pb-0">
          <Tabs defaultValue="upload" value={activeId}>
            <TabsContent value="upload">
              <>
                <DialogHeader>
                  <div className="flex space-x-4 items-center mb-4">
                    <button
                      type="button"
                      className="items-center border bg-accent p-1"
                      onClick={() => setStep("connect")}
                    >
                      <Icons.ArrowBack />
                    </button>
                    <DialogTitle className="m-0 p-0">Import CSV</DialogTitle>
                  </div>
                  <DialogDescription>
                    Upload your CSV file with transactions.
                  </DialogDescription>
                </DialogHeader>

                <div
                  className={cn(
                    "w-full border border-dashed h-[200px] rounded-md mt-8 mb-8 flex items-center justify-center",
                    isDragActive && "bg-secondary text-primary",
                    isDragReject && "border-destructive",
                  )}
                  {...getRootProps()}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Spinner />
                      <span className="text-sm text-[#606060]">
                        Uploading...
                      </span>
                    </div>
                  ) : (
                    <div className="text-center flex items-center justify-center flex-col text-xs text-[#878787]">
                      <input {...getInputProps()} id="upload-files" />
                      Drop your file here, or click to browse.
                      <span>3MB file limit.</span>
                    </div>
                  )}
                </div>
              </>
            </TabsContent>

            <TabsContent value="loading">
              {eventId && (
                <ImportingTransactionsEvent
                  eventId={eventId}
                  setEventId={setEventId}
                  setTransactions={handleTransactions}
                />
              )}
            </TabsContent>

            <TabsContent value="transactions" className="relative">
              <DialogHeader className="mb-4">
                <div className="flex space-x-4 items-center mb-4">
                  <button
                    type="button"
                    className="items-center border bg-accent p-1"
                    onClick={() => {
                      setEventId(undefined);
                      setActiveId("upload");
                    }}
                  >
                    <Icons.ArrowBack />
                  </button>
                  <DialogTitle className="m-0 p-0">
                    Import transactions
                  </DialogTitle>
                </div>

                <DialogDescription>
                  We found{" "}
                  <span className="underline">{transactions?.length}</span>{" "}
                  transactions from from your import. Please select the account
                  and currency to proceed with the import.
                </DialogDescription>
              </DialogHeader>

              <ImportTransactionsForm
                currencies={currencies}
                defaultCurrency={defaultCurrency}
                transactions={transactions}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
