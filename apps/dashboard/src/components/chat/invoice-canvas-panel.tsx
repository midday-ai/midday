"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { Form } from "@/components/invoice/form";
import { FormContext } from "@/components/invoice/form-context";
import { InvoiceSuccess } from "@/components/invoice-success";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useInvoiceEditorStore } from "@/store/invoice-editor";
import { useTRPC } from "@/trpc/client";

function InvoiceCanvasContent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { type, invoiceId, setParams } = useInvoiceParams();

  const { data: defaultSettings } = useSuspenseQuery(
    trpc.invoice.defaultSettings.queryOptions(),
  );

  const { data } = useQuery(
    trpc.invoice.getById.queryOptions(
      { id: invoiceId! },
      { enabled: !!invoiceId, staleTime: 30 * 1000 },
    ),
  );

  const handleClose = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.invoice.getById.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.invoice.defaultSettings.queryKey(),
    });
    useInvoiceEditorStore.getState().reset();
    setParams(null);
  };

  return (
    <FormContext defaultSettings={defaultSettings} data={data}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium">New Invoice</span>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.Close className="size-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {type === "success" ? <InvoiceSuccess /> : <Form />}
        </div>
      </div>
    </FormContext>
  );
}

export function InvoiceCanvasPanel() {
  const { canvas } = useInvoiceParams();
  const isOpen = canvas === true;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className={cn(
            "fixed top-0 right-0 bottom-0 z-50",
            "w-full md:w-[650px]",
            "bg-white dark:bg-[#080808]",
            "border-l border-border",
            "shadow-[-4px_0_24px_rgba(0,0,0,0.08)]",
            "dark:shadow-[-4px_0_24px_rgba(0,0,0,0.3)]",
          )}
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <InvoiceCanvasContent />
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
