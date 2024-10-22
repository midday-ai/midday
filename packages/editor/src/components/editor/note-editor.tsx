import { Content } from "@tiptap/core";
import { useMemo } from "react";
import { SmartNote } from "solomon-ai-typescript-sdk";
import * as Y from "yjs";

import { Card } from "@midday/ui/card";
import { BlockEditor } from "./blockeditor";

/**
 * Props for the NoteEditor component.
 * @extends React.HTMLAttributes<HTMLDivElement>
 */
export interface NoteEditorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Callback function to be called when the note content changes.
   * @param content - The updated content of the note as a string.
   */
  callback: (content: string) => void;

  /**
   * Optional SmartNote object representing an existing note to edit.
   * If provided, the editor will be pre-populated with the note's content.
   */
  note?: SmartNote;

  /**
   * The application ID for AI integration.
   */
  aiAppId: string;

  /**
   * The base URL for AI API calls.
   */
  aiBaseUrl: string;

  /**
   * The authentication token for AI API access.
   */
  aiToken: string;
}

/**
 * NoteEditor component for creating or editing notes with AI assistance.
 * 
 * This component renders a card containing a BlockEditor, which provides
 * a rich text editing experience with collaborative features and AI integration.
 * 
 * @param props - The props for the NoteEditor component.
 * @returns A React functional component.
 */
export const NoteEditor: React.FC<NoteEditorProps> = ({
  callback,
  note,
  aiAppId,
  aiBaseUrl,
  aiToken,
}) => {
  /**
   * Create a new Yjs document for collaborative editing.
   * This document is memoized to ensure it's only created once per component instance.
   */
  const ydoc = useMemo(() => new Y.Doc(), []);

  /**
   * Initialize the content of the editor.
   * If a note is provided, use its content; otherwise, it remains undefined.
   */
  let initialContent: Content | undefined = undefined;
  if (note) {
    initialContent = note.content;
  }

  return (
    <Card className="p-[1.5%]">
      <BlockEditor
        hasCollab={true}
        ydoc={ydoc}
        label={note ? "Update" : "Submit"}
        onContentChange={callback}
        content={initialContent}
        aiToken={aiToken}
        aiAppId={aiAppId}
        aiBaseUrl={aiBaseUrl}
      />
    </Card>
  );
};
