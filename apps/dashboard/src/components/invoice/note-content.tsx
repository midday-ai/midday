"use client";

import { Editor } from "@/components/editor";
import { LabelInput } from "./label-input";

export function NoteContent() {
  return (
    <div>
      <LabelInput name="settings.noteLabel" className="mb-2 block" />
      <Editor className="h-[78px]" />
    </div>
  );
}
