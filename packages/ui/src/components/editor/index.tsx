"use client";

import "./styles.css";

import {
  EditorContent,
  type Editor as EditorInstance,
  type JSONContent,
  useEditor,
} from "@tiptap/react";
import { BubbleMenu } from "./extentions/bubble-menu";
import { registerExtensions } from "./extentions/register";

type EditorProps = {
  initialContent?: JSONContent | string;
  placeholder?: string;
  onUpdate?: (editor: EditorInstance) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
  tabIndex?: number;
};

export function Editor({
  initialContent,
  placeholder,
  onUpdate,
  onBlur,
  onFocus,
  className,
  tabIndex,
}: EditorProps) {
  const editor = useEditor({
    extensions: registerExtensions({ placeholder }),
    content: initialContent,
    immediatelyRender: false,
    onBlur,
    onFocus,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor);
    },
  });

  if (!editor) return null;

  return (
    <>
      <EditorContent
        editor={editor}
        className={className}
        tabIndex={tabIndex}
      />
      <BubbleMenu editor={editor} />
    </>
  );
}
