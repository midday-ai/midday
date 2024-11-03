import { updateInvoiceAction } from "@/actions/invoice/update-invoice-action";
import { Textarea } from "@midday/ui/textarea";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

type Props = {
  id: string;
  defaultValue?: string | null;
};

export function InvoiceNote({ id, defaultValue }: Props) {
  const [value, setValue] = useState(defaultValue);
  const updateInvoice = useAction(updateInvoiceAction);

  return (
    <Textarea
      defaultValue={defaultValue ?? ""}
      id="note"
      placeholder="Note"
      className="min-h-[100px] resize-none"
      onBlur={() => {
        if (value !== defaultValue) {
          updateInvoice.execute({
            id,
            internal_note: value && value.length > 0 ? value : null,
          });
        }
      }}
      onChange={(evt) => setValue(evt.target.value)}
    />
  );
}
