import { formatEditorContent } from "../format";

export function EditorContent({ content }: { content?: JSON }) {
  if (!content) {
    return null;
  }

  return (
    <div tw="flex" style={{ lineHeight: 0.4 }}>
      {formatEditorContent(content)}
    </div>
  );
}
