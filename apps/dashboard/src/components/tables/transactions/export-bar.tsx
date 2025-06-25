import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import NumberFlow from "@number-flow/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useJobProgress } from "@/hooks/use-job-progress";
import { useUserQuery } from "@/hooks/use-user";
import { useExportStore } from "@/store/export";
import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";

export function ExportBar() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setExportData } = useExportStore();
  const { rowSelection, setRowSelection } = useTransactionsStore();
  const [isOpen, setOpen] = useState(false);
  const { data: user } = useUserQuery();
  const [currentJobId, setCurrentJobId] = useState<string | undefined>();

  // Track export job progress
  const {
    progress,
    status: jobStatus,
    result,
    error: jobError,
    isActive,
    isCompleted,
    isFailed,
  } = useJobProgress({
    jobId: currentJobId,
    queue: "exports",
    enabled: !!currentJobId,
    pollInterval: 250,
    onCompleted: (_result) => {
      setCurrentJobId(undefined);
      setRowSelection(() => ({}));

      queryClient.invalidateQueries({
        queryKey: trpc.documents.get.infiniteQueryKey(),
      });
    },
    onFailed: (_error) => {
      setCurrentJobId(undefined);
    },
  });

  // Update export data based on job status
  useEffect(() => {
    if (currentJobId && jobStatus) {
      setExportData({
        progress,
        status: jobStatus,
        result,
      });
    } else if (!currentJobId && jobStatus !== "completed" && !result) {
      // Only clear export data if there's no result (meaning job didn't complete successfully)
      setExportData(undefined);
    }
    // If jobStatus is "completed" or there's a result, preserve the export data for ExportStatus
  }, [currentJobId, jobStatus, progress, result]);

  const ids = Object.keys(rowSelection);
  const totalSelected = ids.length;

  const exportTransactionsMutation = useMutation(
    trpc.transactions.exportTransactions.mutationOptions({
      onSuccess: (data) => {
        if (data.id) {
          setCurrentJobId(data.id);
        }

        setRowSelection(() => ({}));

        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });
      },
      onError: () => {
        toast({
          duration: 3500,
          variant: "error",
          title: "Something went wrong please try again.",
        });
      },
    }),
  );

  useEffect(() => {
    if (totalSelected) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [totalSelected]);

  return (
    <AnimatePresence>
      <motion.div
        className="h-12 fixed left-[50%] bottom-2 w-[400px] -ml-[200px]"
        animate={{ y: isOpen ? 0 : 100 }}
        initial={{ y: 100 }}
      >
        <div className="mx-2 md:mx-0 backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-12 justify-between items-center flex px-4 border dark:border-[#2C2C2C]">
          <span className="text-sm text-[#878787]">
            <NumberFlow value={Object.keys(rowSelection).length} /> selected
          </span>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={() => setRowSelection({})}>
              <span>Deselect all</span>
            </Button>
            <SubmitButton
              isSubmitting={exportTransactionsMutation.isPending}
              onClick={() =>
                exportTransactionsMutation.mutate({
                  transactionIds: ids,
                  dateFormat: user?.dateFormat ?? undefined,
                  locale: user?.locale ?? undefined,
                })
              }
            >
              <div className="flex items-center space-x-2">
                <span>Export</span>
                <Icons.ArrowCoolDown className="size-4" />
              </div>
            </SubmitButton>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
