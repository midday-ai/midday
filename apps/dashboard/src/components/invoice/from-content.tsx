"use client";

import { Editor } from "@/components/editor";
import type { JSONContent } from "novel";
import { LabelInput } from "./label-input";

const defaultContent: JSONContent = {
  type: "paragraph",
  content: [
    {
      type: "text",
      text: "Lost Island AB",
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
  ],
};

export function FromContent() {
  return (
    <div>
      <LabelInput name="settings.fromContent" />
      <Editor initialContent={defaultContent} className="h-[115px]" />
    </div>
  );
}
