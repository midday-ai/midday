import { isValidJSON } from "../../../utils/content";
import { EditorContent } from "./editor-content";

export function Description({ content }: { content: string }) {
  const value = isValidJSON(content) ? JSON.parse(content) : null;
  return <EditorContent content={value} />;
}
