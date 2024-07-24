import { exportTransactionsAction } from "@/actions/export-transactions-action";
import { useExportStore } from "@/store/export";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

type Props = {
  selected: boolean;
  deselectAll: () => void;
  transactionIds: string[];
};

export function ExportBar({ selected, deselectAll, transactionIds }: Props) {
  const { toast } = useToast();
  const { setExportId } = useExportStore();
  const [isOpen, setOpen] = useState(false);

  const { execute, status } = useAction(exportTransactionsAction, {
    onSuccess: ({ data }) => {
      setExportId(data?.id);
      setOpen(false);
    },
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  useEffect(() => {
    if (selected) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [selected]);

  return (
    <AnimatePresence>
      <motion.div
        className="h-12 fixed left-[50%] bottom-2 w-[400px] -ml-[200px]"
        animate={{ y: isOpen ? 0 : 100 }}
        initial={{ y: 100 }}
      >
        <div className="mx-2 md:mx-0 backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-12 justify-between items-center flex px-4 border dark:border-[#2C2C2C] border-[#DCDAD2] rounded-lg">
          <span className="text-sm">{selected} selected</span>

          <div className="flex items-center space-x-4">
            <button type="button" onClick={deselectAll} className="text-sm">
              Deselect all
            </button>
            <Button
              className="h-8 text-sm"
              onClick={() => execute(transactionIds)}
              disabled={status === "executing"}
            >
              {status === "executing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Export (${selected})`
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
