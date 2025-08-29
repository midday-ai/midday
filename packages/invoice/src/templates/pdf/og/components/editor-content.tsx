import type { EditorDoc } from "../../../types";
import { formatEditorContent } from "../format";

type Props = {
  content?: EditorDoc | null;
};

export function EditorContent({ content }: Props) {
  if (!content) {
    return null;
  }

  return (
    <div tw="flex" style={{ lineHeight: 1.5 }}>
      {formatEditorContent(content)}
    </div>
  );
}
