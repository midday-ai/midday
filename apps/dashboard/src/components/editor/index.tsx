"use client";

import { cn } from "@midday/ui/cn";
import {
  EditorBubble,
  EditorContent,
  type EditorInstance,
  EditorRoot,
  type JSONContent,
} from "novel";
import { useCallback, useEffect, useState } from "react";
import { setupExtensions } from "./extensions";
import { AISelector } from "./selectors/ai-selector";
import { AskAI } from "./selectors/ask-ai";
import { LinkSelector } from "./selectors/link-selector";
import { TextButtons } from "./selectors/text-buttons";

type Props = {
  initialContent?: JSONContent;
  className?: string;
  onChange?: (content?: JSONContent) => void;
  onBlur?: (content: JSONContent | null) => void;
  placeholder?: string;
};

export function Editor({
  initialContent,
  className,
  onChange,
  onBlur,
  placeholder,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [openLink, setOpenLink] = useState(false);
  const [content, setContent] = useState<JSONContent | undefined>(
    initialContent,
  );

  const handleUpdate = useCallback(
    ({ editor }: { editor: EditorInstance }) => {
      const json = editor.getJSON();
      const newIsEmpty = editor.state.doc.textContent.length === 0;

      setIsEmpty(newIsEmpty);
      setContent(newIsEmpty ? null : json);
      onChange?.(newIsEmpty ? null : json);
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.(content ?? null);
  }, [content, onBlur]);

  useEffect(() => {
    if (!content?.content?.length) {
      setIsEmpty(true);
    }
  }, [content]);

  const showPlaceholder = isEmpty && !isFocused && !thinking;

  return (
    <EditorRoot>
      <EditorContent
        className={cn(
          "font-mono text-[11px] text-primary leading-[18px] invoice-editor",
          showPlaceholder &&
            "w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,background_1px,background_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,background_1px,background_5px)]",
          className,
        )}
        extensions={setupExtensions({ placeholder })}
        initialContent={content}
        onUpdate={handleUpdate}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
      >
        <EditorBubble
          pluginKey="editor"
          className="flex w-fit overflow-hidden rounded-full border border-border bg-background shadow-xl"
        >
          {showAI ? (
            <AISelector onOpenChange={setShowAI} setThinking={setThinking} />
          ) : (
            <>
              <TextButtons />
              <LinkSelector open={openLink} onOpenChange={setOpenLink} />
              <AskAI onSelect={() => setShowAI(true)} />
            </>
          )}
        </EditorBubble>
      </EditorContent>
    </EditorRoot>
  );
}
