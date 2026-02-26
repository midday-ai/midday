import { Text, View } from "@react-pdf/renderer";
import type { EditorDoc } from "../../../types";
import { EditorContent } from "./editor-content";

type Props = {
  content?: EditorDoc | null;
  noteLabel?: string;
};

export function Note({ content, noteLabel }: Props) {
  if (!content) return null;
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 9, fontWeight: 500 }}>{noteLabel}</Text>
      <EditorContent content={content} />
    </View>
  );
}
