"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { Editor } from "@/components/editor";
import { useAction } from "next-safe-action/hooks";
import { LabelInput } from "./label-input";

export function NoteContent() {
  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  return (
    <div>
      <LabelInput
        name="template.note_label"
        onSave={(value) => {
          updateInvoiceTemplate.execute({
            note_label: value,
          });
        }}
        className="mb-2 block"
      />
      <Editor className="h-[78px]" />
    </div>
  );
}
