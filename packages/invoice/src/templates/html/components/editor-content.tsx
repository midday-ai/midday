import { formatEditorToHtml } from "../../../utils/format";

export function EditorContent({ content }: { content?: JSON }) {
  if (!content) {
    return null;
  }

  return (
    <div className="font-mono text-[11px] leading-5">
      {formatEditorToHtml(content)}
    </div>
  );
}
