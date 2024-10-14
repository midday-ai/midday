"use client";

import { Editor } from "@/components/editor";
import { LabelInput } from "./label-input";

export function NoteContent() {
  return (
    <div>
      <LabelInput name="settings.note" className="mb-2 block" />
      <Editor className="h-[78px]" />
    </div>
  );
}
