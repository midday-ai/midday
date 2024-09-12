import MenuBar from "@/components/menu/menubar";

import "@/styles/index.css";

import React, { useEffect } from "react";
import { Extensions } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { SaveIcon, Trash2Icon } from "lucide-react";

interface BasicEditorProps {
  initialText?: string;
  onSave?: (content: string) => void;
  onUpdate?: (content: string) => void;
}

export const BasicEditor: React.FC<BasicEditorProps> = ({
  initialText,
  onSave,
  onUpdate,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure(),
      Highlight,
      TaskList,
      TaskItem,
      CharacterCount.configure({
        limit: 10000,
      }),
    ] as Extensions,
    content: initialText,
  });

  // Handle updates to the editor's content
  useEffect(() => {
    if (editor) {
      editor.on("update", () => {
        onUpdate?.(editor.getHTML());
      });
    }

    // Optionally handle unmount or cleanup
    return () => {
      editor?.destroy();
    };
  }, [editor, onUpdate]);

  // Handle save (assuming a dedicated save action/button)
  const handleSave = () => {
    if (editor) {
      onSave?.(editor.getHTML());
    }
  };

  return (
    <div className="editor flex h-full flex-col justify-between gap-2">
      <div className="md:min-h-[700px]">
        {editor && <MenuBar editor={editor} />}
        <EditorContent className="h-full flex-1" editor={editor} />
      </div>
      <div className="flex flex-1 items-end justify-end gap-2">
        <button
          onClick={handleSave}
          className="flex w-fit gap-2 rounded-xl border bg-white px-5 py-3 dark:bg-zinc-950 dark:text-white"
        >
          <SaveIcon className="h-6 w-6" />
          Save
        </button>
        <button
          onClick={handleSave}
          className="flex w-fit gap-2 rounded-xl border bg-white px-5 py-3 dark:bg-zinc-950 dark:text-white"
        >
          <Trash2Icon className="h-6 w-6" />
          Cancel
        </button>
      </div>
    </div>
  );
};
