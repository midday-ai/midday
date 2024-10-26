import { View } from "@react-pdf/renderer";
import { formatEditorToPdf } from "../../../utils/format";

export function EditorContent({ content }: { content?: JSON }) {
  if (!content) {
    return null;
  }

  return <View style={{ marginTop: 10 }}>{formatEditorToPdf(content)}</View>;
}
