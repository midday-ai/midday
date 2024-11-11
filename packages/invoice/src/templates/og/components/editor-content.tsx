import { formatEditorContent } from "../format";

export function EditorContent({ content }: { content?: JSON }) {
  if (!content) {
    return null;
  }

  return (
    <div tw="flex" style={{ lineHeight: 1.5 }}>
      {formatEditorContent(content)}
    </div>
  );
}
