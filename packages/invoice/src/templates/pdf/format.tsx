import { Link, Text, View } from "@react-pdf/renderer";
import type { EditorDoc } from "../types";

export function formatEditorContent(doc?: EditorDoc): JSX.Element | null {
  if (!doc || !doc.content) {
    return null;
  }

  return (
    <>
      {doc.content.map((node, nodeIndex) => {
        if (node.type === "paragraph") {
          return (
            <View
              key={`paragraph-${nodeIndex.toString()}`}
              style={{ marginBottom: 5 }}
            >
              {node.content?.map((inlineContent, inlineIndex) => {
                if (inlineContent.type === "text") {
                  const style: TextStyle = { fontSize: 9 };
                  let href: string | undefined;

                  if (inlineContent.marks) {
                    for (const mark of inlineContent.marks) {
                      if (mark.type === "bold") {
                        style.fontWeight = 500;
                      } else if (mark.type === "italic") {
                        style.fontStyle = "italic";
                      } else if (mark.type === "link") {
                        href = mark.attrs?.href;
                        style.textDecoration = "underline";
                      }
                    }
                  }

                  const content = inlineContent.text || "";
                  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content);

                  if (href || isEmail) {
                    const linkHref =
                      href || (isEmail ? `mailto:${content}` : content);
                    return (
                      <Link
                        key={`link-${nodeIndex.toString()}-${inlineIndex.toString()}`}
                        src={linkHref}
                        style={{
                          ...style,
                          color: "black",
                          textDecoration: "underline",
                        }}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <Text
                      key={`text-${nodeIndex.toString()}-${inlineIndex.toString()}`}
                      style={style}
                    >
                      {content}
                    </Text>
                  );
                }
                if (inlineContent.type === "hardBreak") {
                  return (
                    <View
                      key={`break-${nodeIndex.toString()}-${inlineIndex.toString()}`}
                      style={{ marginBottom: 5 }}
                    />
                  );
                }
                return null;
              })}
            </View>
          );
        }

        return null;
      })}
    </>
  );
}
