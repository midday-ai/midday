"use client";

import { Editor } from "@/components/editor";
import type { JSONContent } from "novel";
import { useState } from "react";

const defaultContent: JSONContent = {
  type: "paragraph",
  content: [
    {
      type: "text",
      text: "Lost Island AB",
      marks: [{ type: "textStyle", attrs: { color: "white" } }],
    },
    {
      type: "hardBreak",
    },
    {
      type: "text",
      text: "pontus@lostisland.co",
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
      text: "Roslagsgatan 48",
    },
    {
      type: "hardBreak",
    },
    {
      type: "text",
      text: "211 34 Stockholm, Sweden",
    },
    {
      type: "hardBreak",
    },
    {
      type: "text",
      text: "VAT ID: SE1246767676020",
    },
    {
      type: "hardBreak",
    },
  ],
};

export function FromContent() {
  const [content, setContent] = useState(null);

  return (
    <div>
      <span className="font-mono text-[#878787] mb-2 text-[11px] block">
        From
      </span>
      <Editor initialContent={defaultContent} />
    </div>
  );
}
