import { View } from "@react-pdf/renderer";
import { formatEditorContent } from "../format";

export function EditorContent({ content }: { content?: JSON }) {
  if (!content) {
    return null;
  }

  return (
    <View style={{ marginTop: 10, lineHeight: 1.4 }}>
      {formatEditorContent(content)}
    </View>
  );
}
