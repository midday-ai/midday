import type { UpdateTransactionValues } from "@/actions/schema";
import { Textarea } from "@midday/ui/textarea";
import { useState } from "react";

type Props = {
  id: string;
  defaultValue: string;
  updateTransaction: (values: UpdateTransactionValues) => void;
};

export function Note({ id, defaultValue, updateTransaction }: Props) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Textarea
      defaultValue={defaultValue}
      required
      autoFocus
      placeholder="Note"
      className="min-h-[100px] resize-none"
      onBlur={() => {
        if (value !== defaultValue) {
          updateTransaction({
            id,
            note: value?.length > 0 ? value : null,
          });
        }
      }}
      onChange={(evt) => setValue(evt.target.value)}
    />
  );
}
