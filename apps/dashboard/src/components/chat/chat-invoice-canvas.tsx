"use client";

import { cn } from "@midday/ui/cn";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Suspense, useEffect, useRef } from "react";
import { Form } from "@/components/invoice/form";
import { FormContext } from "@/components/invoice/form-context";
import { InvoiceSuccess } from "@/components/invoice-success";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useInvoiceEditorStore } from "@/store/invoice-editor";
import { useTRPC } from "@/trpc/client";

function InvoiceCanvasContent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { invoiceType, invoiceId } = useInvoiceParams();
  const prevInvoiceIdRef = useRef(invoiceId);

  useEffect(() => {
    if (prevInvoiceIdRef.current && prevInvoiceIdRef.current !== invoiceId) {
      useInvoiceEditorStore.getState().reset();
      queryClient.invalidateQueries({
        queryKey: trpc.invoice.getById.queryKey(),
      });
    }
    prevInvoiceIdRef.current = invoiceId;
  }, [invoiceId, queryClient, trpc.invoice.getById]);

  const { data: defaultSettings } = useSuspenseQuery(
    trpc.invoice.defaultSettings.queryOptions(),
  );

  const { data } = useQuery(
    trpc.invoice.getById.queryOptions(
      { id: invoiceId! },
      { enabled: !!invoiceId, staleTime: 30 * 1000 },
    ),
  );

  return (
    <FormContext defaultSettings={defaultSettings} data={data}>
      <div className="flex flex-col h-full">
        <div className="flex-1 min-h-0">
          {invoiceType === "success" ? <InvoiceSuccess /> : <Form />}
        </div>
      </div>
    </FormContext>
  );
}

export function ChatInvoiceCanvas() {
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
            "fixed top-0 md:top-[70px] right-0 bottom-0 z-40",
            "w-full md:w-[650px]",
            "bg-background",
            "border-l border-border",
            "will-change-transform",
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
