import { ExportTransactionsModal } from "@/components/modals/export-transactions-modal";
import { useTransactionsStore } from "@/store/transactions";
import { Button } from "@midday/ui/button";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function ExportBar() {
  const { rowSelection, setRowSelection } = useTransactionsStore();
  const [isOpen, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalSelected = Object.keys(rowSelection).length;

  useEffect(() => {
    if (totalSelected) {
      setOpen(true);
    } else {
      setOpen(false);
      setIsModalOpen(false);
    }
  }, [totalSelected]);

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="h-12 fixed left-[50%] bottom-2 w-[400px] -ml-[200px] z-50"
          animate={{ y: isOpen ? 0 : 100 }}
          initial={{ y: 100 }}
        >
          <div className="mx-2 md:mx-0 backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-12 justify-between items-center flex px-4 border dark:border-[#2C2C2C]">
            <span className="text-sm text-[#878787]">
              <NumberFlow value={totalSelected} /> selected
            </span>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => setRowSelection({})}>
                <span>Deselect all</span>
              </Button>
              <Button onClick={() => setIsModalOpen(true)}>
                <span>Export</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <ExportTransactionsModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
