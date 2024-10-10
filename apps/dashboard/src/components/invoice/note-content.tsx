"use client";

import { Editor } from "@/components/editor";
import { useState } from "react";

export function NoteContent() {
  const [content, setContent] = useState(null);

  return (
    <div>
      <span className="font-mono text-[#878787] mb-2 text-[11px] block">
        Note
      </span>

      <div className="h-[78px] w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,background_1px,background_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,background_1px,background_5px)]" />

      {/* <Editor /> */}
    </div>
  );
}
