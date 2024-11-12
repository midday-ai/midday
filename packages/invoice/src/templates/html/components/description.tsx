import { isValidJSON } from "../../../utils/content";
import { EditorContent } from "./editor-content";

export function Description({ content }: { content: string }) {
  const value = isValidJSON(content) ? JSON.parse(content) : null;

  // If the content is not valid JSON, return the content as a string
  if (!value) {
    return <div className="font-mono leading-4 text-[11px]">{content}</div>;
  }

  return <EditorContent content={value} />;
}
