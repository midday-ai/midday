"use client";

import { updateTransactionAction } from "@/actions";
import { Textarea } from "@midday/ui/textarea";
import { startTransition, useState } from "react";

export function Note({ id, defaultValue }) {
  const [value, setValue] = useState(defaultValue);

  const handleOnBlur = () => {
    startTransition(() => {
      updateTransactionAction(id, {
        note: value,
      });
    });
  };

  return (
    <Textarea
      name="feedback"
      defaultValue={defaultValue}
      required
      autoFocus
      placeholder="Note"
      className="min-h-[100px] resize-none"
      onBlur={handleOnBlur}
      onChange={(evt) => setValue(evt.target.value)}
    />
  );
}
