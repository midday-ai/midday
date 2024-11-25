import { Text, View } from "@react-pdf/renderer";
import { isValidJSON } from "../../../utils/content";
import { EditorContent } from "./editor-content";

export function Description({ content }: { content: string }) {
  const value = isValidJSON(content) ? JSON.parse(content) : null;

  // If the content is not valid JSON, return the content as a string
  if (!value) {
    return (
      <Text style={{ fontFamily: "Helvetica", fontSize: 9 }}>{content}</Text>
    );
  }

  return (
    <View
      style={{
        alignSelf: "flex-start",
        marginTop: -10,
      }}
    >
      <EditorContent content={value} />
    </View>
  );
}
