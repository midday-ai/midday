import { useMemo } from "react";
import { Content } from "@tiptap/core";
import { SmartNote } from "solomon-ai-typescript-sdk";
import * as Y from "yjs";

import { BlockEditor } from "./blockeditor";

export interface NoteEditorProps extends React.HTMLAttributes<HTMLDivElement> {
  callback: (content: string) => void;
  note?: SmartNote;
  aiAppId: string;
  aiBaseUrl: string;
  aiToken: string;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  callback,
  note,
  aiAppId,
  aiBaseUrl,
  aiToken,
}) => {
  const ydoc = useMemo(() => new Y.Doc(), []);

  let initialContent: Content | undefined = undefined;
  if (note) {
    initialContent = note.content;
  }

  return (
    <>
      <BlockEditor
        hasCollab={true}
        ydoc={ydoc}
        // enableMenubar
        label={note ? "Update" : "Submit"}
        onContentChange={callback}
        content={initialContent}
        aiToken={aiToken}
        aiAppId={aiAppId}
        aiBaseUrl={aiBaseUrl}
      />
    </>
  );
};
