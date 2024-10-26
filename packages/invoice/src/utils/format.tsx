import { Link, Text, View } from "@react-pdf/renderer";

interface EditorDoc {
  type: "doc";
  content: EditorNode[];
}

interface EditorNode {
  type: string;
  content?: InlineContent[];
}

interface InlineContent {
  type: string;
  text?: string;
  marks?: Mark[];
}

interface Mark {
  type: string;
  attrs?: {
    href?: string;
  };
}

interface TextStyle {
  fontSize: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic" | "oblique";
  color?: string;
  textDecoration?: string;
}

export function formatEditorToPdf(doc?: EditorDoc): JSX.Element | null {
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

export function formatEditorToHtml(doc?: EditorDoc): JSX.Element | null {
  if (!doc || !doc.content) {
    return null;
  }

  return (
    <>
      {doc.content.map((node, nodeIndex) => {
        if (node.type === "paragraph") {
          return (
            <p
              key={`paragraph-${nodeIndex.toString()}`}
              className="mb-1 leading-relaxed"
            >
              {node.content?.map((inlineContent, inlineIndex) => {
                if (inlineContent.type === "text") {
                  let style = "text-xs";
                  let href: string | undefined;

                  if (inlineContent.marks) {
                    for (const mark of inlineContent.marks) {
                      if (mark.type === "bold") {
                        style += " font-medium";
                      } else if (mark.type === "italic") {
                        style += " italic";
                      } else if (mark.type === "link") {
                        href = mark.attrs?.href;
                        style += " underline";
                      }
                    }
                  }

                  const content = inlineContent.text || "";
                  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content);

                  if (href || isEmail) {
                    const linkHref =
                      href || (isEmail ? `mailto:${content}` : content);
                    return (
                      <a
                        key={`link-${nodeIndex}-${inlineIndex.toString()}`}
                        href={linkHref}
                        className={`${style} underline`}
                      >
                        {content}
                      </a>
                    );
                  }

                  return (
                    <span
                      key={`text-${nodeIndex}-${inlineIndex.toString()}`}
                      className={style}
                    >
                      {content}
                    </span>
                  );
                }
                if (inlineContent.type === "hardBreak") {
                  return (
                    <br key={`break-${nodeIndex}-${inlineIndex.toString()}`} />
                  );
                }
                return null;
              })}
            </p>
          );
        }
        return null;
      })}
    </>
  );
}

type FormatAmountParams = {
  currency: string;
  amount: number;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatAmount({
  currency,
  amount,
  locale = "en-US",
  minimumFractionDigits,
  maximumFractionDigits,
}: FormatAmountParams) {
  if (!currency) {
    return;
  }

  return Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}
