import { formatEditorContent } from "../format";

export function EditorContent({ content }: { content?: JSON }) {
  if (!content) {
    return null;
  }

  return (
    <div className="font-mono leading-4">{formatEditorContent(content)}</div>
  );
}
