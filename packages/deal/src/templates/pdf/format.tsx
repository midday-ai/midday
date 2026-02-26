import { Link, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { EditorDoc } from "../../types";

type PDFTextStyle = Style & {
  fontFamily?: string;
  fontStyle?: "normal" | "italic" | "oblique";
  textDecoration?:
    | "none"
    | "underline"
    | "line-through"
    | "underline line-through";
};

export function formatEditorContent(doc?: EditorDoc) {
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
              style={{ alignItems: "flex-start" }}
            >
              <Text>
                {node.content?.map((inlineContent, inlineIndex) => {
                  if (inlineContent.type === "text") {
                    const style: PDFTextStyle = {
                      fontSize: 9,
                      fontFamily: "Inter",
                    };
                    let href: string | undefined;
                    let hasUnderline = false;
                    let hasStrike = false;

                    if (inlineContent.marks) {
                      for (const mark of inlineContent.marks) {
                        if (mark.type === "bold") {
                          style.fontWeight = 600;
                        }
                        if (mark.type === "italic") {
                          style.fontStyle = "italic";
                        }
                        if (mark.type === "link") {
                          href = mark.attrs?.href;
                          hasUnderline = true;
                        }
                        if (mark.type === "strike") {
                          hasStrike = true;
                        }
                      }
                    }

                    // Combine text decorations
                    if (hasUnderline && hasStrike) {
                      style.textDecoration = "underline line-through";
                    } else if (hasUnderline) {
                      style.textDecoration = "underline";
                    } else if (hasStrike) {
                      style.textDecoration = "line-through";
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
                    // This is a hack to force a line break in the PDF to look like the web editor
                    return (
                      <Text
                        key={`hard-break-${nodeIndex.toString()}-${inlineIndex.toString()}`}
                        style={{ height: 12, fontSize: 12 }}
                      >
                        {"\n"}
                      </Text>
                    );
                  }

                  return null;
                })}
              </Text>
            </View>
          );
        }

        return null;
      })}
    </>
  );
}
