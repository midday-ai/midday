import { formatEditorToTw } from "../../../utils/format";

export function EditorContent({ content }: { content?: JSON }) {
  if (!content) {
    return null;
  }

  return <div tw="flex">{formatEditorToTw(content)}</div>;
}
