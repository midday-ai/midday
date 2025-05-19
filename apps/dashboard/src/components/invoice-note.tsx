"use client";

import { useTRPC } from "@/trpc/client";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Props = {
  id: string;
  defaultValue?: string | null;
};

export function InvoiceNote({ id, defaultValue }: Props) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [value, setValue] = useState(defaultValue);

  const updateInvoiceMutation = useMutation(
    trpc.invoice.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.getById.queryKey({ id }),
        });
      },
    }),
  );
  return (
    <Textarea
      defaultValue={defaultValue ?? ""}
      id="note"
      placeholder="Note"
      className="min-h-[100px] resize-none"
      onBlur={() => {
        if (value !== defaultValue) {
          updateInvoiceMutation.mutate({
            id,
            internalNote: value && value.length > 0 ? value : null,
          });
        }
      }}
      onChange={(evt) => setValue(evt.target.value)}
    />
  );
}
