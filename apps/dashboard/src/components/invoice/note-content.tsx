"use client";

import { Editor } from "@/components/editor";

export function NoteContent() {
  return (
    <div>
      <span className="font-mono text-[#878787] mb-2 text-[11px] block">
        Note
      </span>

      <Editor className="h-[78px]" />
    </div>
  );
}
