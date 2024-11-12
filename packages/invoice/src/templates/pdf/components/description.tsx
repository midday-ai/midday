import { View } from "@react-pdf/renderer";
import { isValidJSON } from "../../../utils/content";
import { EditorContent } from "./editor-content";

export function Description({ content }: { content: string }) {
  const value = isValidJSON(content) ? JSON.parse(content) : null;

  return (
    <View style={{ flex: 3, alignSelf: "flex-start", marginTop: -10 }}>
      <EditorContent content={value} />
    </View>
  );
}
