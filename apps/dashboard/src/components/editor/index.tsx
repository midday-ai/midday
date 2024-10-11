"use client";

import { cn } from "@midday/ui/cn";
import {
  EditorBubble,
  EditorContent,
  EditorRoot,
  type JSONContent,
} from "novel";
import { useState } from "react";
import { defaultExtensions } from "./extensions";
import { LinkSelector } from "./selectors/link-selector";
import { TextButtons } from "./selectors/text-buttons";

type Props = {
  initialContent?: JSONContent;
  className?: string;
};

export function Editor({ initialContent, className }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [content, setContent] = useState<JSONContent | undefined>(
    initialContent,
  );

  const isEmpty = content?.content?.length;

  return (
    <EditorRoot>
      <EditorContent
        className={cn(
          "font-mono text-[11px] text-primary leading-[18px] invoice-editor",
          !isEmpty &&
            !isFocused &&
            "w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,background_1px,background_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,background_1px,background_5px)]",
          className,
        )}
        extensions={defaultExtensions}
        initialContent={content}
        onUpdate={({ editor }) => {
          const json = editor.getJSON();
          setContent(json);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <EditorBubble
          pluginKey="editor"
          className="flex w-fit overflow-hidden rounded-full border border-border bg-background shadow-xl"
        >
          <TextButtons />
          <LinkSelector open={openLink} onOpenChange={setOpenLink} />
        </EditorBubble>
      </EditorContent>
    </EditorRoot>
  );
}
