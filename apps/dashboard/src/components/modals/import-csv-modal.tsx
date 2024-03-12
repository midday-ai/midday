"use client";

import { importTransactionsAction } from "@/actions/transactions/import-transactions";
import { useUpload } from "@/hooks/use-upload";
import { createClient } from "@midday/supabase/client";
import { getCurrentUserTeamQuery } from "@midday/supabase/queries";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { Tabs, TabsContent } from "@midday/ui/tabs";
import { cn } from "@midday/ui/utils";
import { stripSpecialCharacters } from "@midday/utils";
import { format, isSameYear } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImportingTransactionsEvent } from "../importing-transactions-event";

const formatTransactionDate = (date: string) => {
  if (isSameYear(new Date(), new Date(date))) {
    return format(new Date(date), "MMM d");
  }

  return format(new Date(date), "P");
};

export function ImportCSVModal() {
  const supabase = createClient();
  const [step, setStep] = useQueryState("step");
  const [eventId, setEventId] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState();
  const [activeId, setActiveId] = useState("upload");
  const { uploadFile } = useUpload();

  const importTransactions = useAction(importTransactionsAction, {
    onSuccess: (data) => {
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
                      className="items-center rounded border bg-accent p-1"
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
                    isDragReject && "border-destructive"
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

                <div className="flex justify-center mb-6">
                  <Icons.OpenAI />
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
              <DialogHeader>
                <div className="flex space-x-4 items-center mb-4">
                  <button
                    type="button"
                    className="items-center rounded border bg-accent p-1"
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
                  We found {transactions?.length} transactions from from your
                  import.
                </DialogDescription>
              </DialogHeader>

              <div className="h-[480px] overflow-auto mt-8 mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((transaction) => (
                      <TableRow
                        key={transaction.internal_id}
                        className="h-[45px]"
                      >
                        <TableCell>
                          {transaction?.date &&
                            formatTransactionDate(transaction.date)}
                        </TableCell>
                        <TableCell
                          className={transaction.amount > 0 && "text-[#00C969]"}
                        >
                          {transaction.name}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right",
                            transaction.amount > 0 && "text-[#00C969]"
                          )}
                        >
                          {transaction.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="w-full absolute bottom-0 left-0 h-[150px] flex flex-col justify-end pointer-events-none bg-gradient-to-b from-transparent via-background to-background">
                <Button className="w-full">Save</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
