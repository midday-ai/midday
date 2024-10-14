"use client";

import { Editor } from "@/components/editor";
import type { JSONContent } from "novel";
import { Controller, useFormContext } from "react-hook-form";
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
  const { control } = useFormContext();

  return (
    <div>
      <LabelInput name="settings.fromLabel" />
      <Controller
        name="fromContent"
        control={control}
        defaultValue={defaultContent}
        render={({ field }) => (
          <Editor
            initialContent={field.value}
            onChange={field.onChange}
            className="h-[115px]"
          />
        )}
      />
    </div>
  );
}
