"use client";

import { Editor } from "@/components/editor";
import type { JSONContent } from "novel";
import { useState } from "react";

const defaultContent: JSONContent = {
  type: "paragraph",
  content: [
    {
      type: "text",
      text: "Acme inc",
    },
    {
      type: "hardBreak",
    },
    {
      type: "text",
      text: "john.doe@acme.com",
    },
    {
      type: "hardBreak",
    },
    {
      type: "text",
      text: "36182-4441",
    },
    {
      type: "hardBreak",
    },
    {
      type: "text",
      text: "Street 56",
    },
    {
      type: "hardBreak",
    },
    {
      type: "text",
      text: "243 21 California, USA",
    },
    {
      type: "hardBreak",
    },
    {
      type: "text",
      text: "VAT ID: SE1246767676020",
    },
  ],
};

export function CustomerContent() {
  const [content, setContent] = useState(null);

  return (
    <div>
      <span className="font-mono text-[#878787] mb-2 text-[11px] block">
        To
      </span>
      <Editor initialContent={defaultContent} className="h-[115px]" />
    </div>
  );
}