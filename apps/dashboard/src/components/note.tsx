"use client";

import { updateTransactionAction } from "@/actions/update-transaction-action";
import { Textarea } from "@midday/ui/textarea";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

export function Note({ id, defaultValue }) {
  const [value, setValue] = useState(defaultValue);
  const action = useAction(updateTransactionAction);

  return (
    <Textarea
      name="feedback"
      defaultValue={defaultValue}
      required
      autoFocus
      placeholder="Note"
      className="min-h-[100px] resize-none"
      onBlur={() =>
        action.execute({
          id,
          note: value,
        })
      }
      onChange={(evt) => setValue(evt.target.value)}
    />
  );
}
