"use client";

import { useTRPC } from "@/trpc/client";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";

type Props = {
  id: string;
  defaultValue?: string | null;
};

export function DealNote({ id, defaultValue }: Props) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [value, setValue] = useState(defaultValue);
  const [debouncedValue] = useDebounceValue(value, 500);

  const updateDealMutation = useMutation(
    trpc.deal.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.deal.getById.queryKey({ id }),
        });
      },
    }),
  );

  const handleUpdate = useCallback(() => {
    if (debouncedValue !== defaultValue) {
      updateDealMutation.mutate({
        id,
        internalNote:
          debouncedValue && debouncedValue.length > 0 ? debouncedValue : null,
      });
    }
  }, [debouncedValue, defaultValue, id, updateDealMutation.mutate]);

  useEffect(() => {
    handleUpdate();
  }, [handleUpdate]);

  return (
    <Textarea
      defaultValue={defaultValue ?? ""}
      id="note"
      placeholder="Note"
      className="min-h-[100px] resize-none"
      onChange={(evt) => setValue(evt.target.value)}
    />
  );
}
