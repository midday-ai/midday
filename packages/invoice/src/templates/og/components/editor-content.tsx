import { formatEditorContent } from "../format";

export function EditorContent({ content }: { content?: JSON }) {
  if (!content) {
    return null;
  }

  return <div tw="flex">{formatEditorContent(content)}</div>;
}
