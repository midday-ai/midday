import { View } from "@react-pdf/renderer";
import type { EditorDoc } from "../../types";
import { formatEditorContent } from "../format";

type Props = {
  content?: EditorDoc;
};

export function EditorContent({ content }: Props) {
  if (!content) {
    return null;
  }

  return (
    <View style={{ marginTop: 10, lineHeight: 0.9 }}>
      {formatEditorContent(content)}
    </View>
  );
}
