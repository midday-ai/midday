import type { EditorDoc } from "../../../types";
import { formatEditorContent } from "../format";

type Props = {
  content?: EditorDoc | null;
};

export function EditorContent({ content }: Props) {
  if (!content) {
    return null;
  }

  return <div className="leading-4">{formatEditorContent(content)}</div>;
}
