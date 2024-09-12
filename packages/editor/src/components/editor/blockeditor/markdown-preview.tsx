import { useMemo } from "react";
import { Content } from "@tiptap/core";
import * as Y from "yjs";

import BlockEditor from "./blockEditor";

export interface MarkdownPreviewProps
  extends React.HTMLAttributes<HTMLDivElement> {
  callback?: (content: string) => void;
  content?: string;
  aiAppId: string;
  aiBaseUrl: string;
  aiToken: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  callback,
  content,
  aiAppId,
  aiBaseUrl,
  aiToken,
}) => {
  const ydoc = useMemo(() => new Y.Doc(), []);

  let initialContent: Content | undefined = undefined;
  if (content) {
    initialContent = content;
  }

  return (
    <>
      <BlockEditor
        aiToken={aiToken as string}
        ydoc={ydoc}
        onContentChange={callback}
        aiAppId={aiAppId}
        aiBaseUrl={aiBaseUrl}
        content={content}
        label={content ? "Update" : "Submit"}
        hasCollab={false}
      />
    </>
  );
};
