"use client";

import "./styles.css";

import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "./extentions/bubble-menu";
import { extensions } from "./extentions/register";

type EditorProps = {
  content?: string;
};

export function Editor({ content }: EditorProps) {
  const editor = useEditor({
    extensions,
    content,
  });

  return (
    <>
      <EditorContent editor={editor} />
      <BubbleMenu editor={editor} />
    </>
  );
}
