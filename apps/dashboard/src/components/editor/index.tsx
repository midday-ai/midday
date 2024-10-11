"use client";

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
};

export function Editor({ initialContent }: Props) {
  const [openLink, setOpenLink] = useState(false);
  const [content, setContent] = useState<JSONContent | undefined>(
    initialContent,
  );

  return (
    <EditorRoot>
      <EditorContent
        className="font-mono text-[11px] text-[#878787] leading-[18px]"
        extensions={defaultExtensions}
        initialContent={content}
        onUpdate={({ editor }) => {
          const json = editor.getJSON();
          setContent(json);
        }}
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
