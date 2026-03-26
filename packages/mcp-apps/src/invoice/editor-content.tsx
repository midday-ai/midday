type Mark = {
  type: string;
  attrs?: Record<string, any>;
};

type InlineContent = {
  type: string;
  text?: string;
  marks?: Mark[];
};

type DocNode = {
  type: string;
  content?: InlineContent[];
};

type EditorDoc = {
  type?: string;
  content?: DocNode[];
};

function nodeKey(node: DocNode, index: number): string {
  const text =
    node.content
      ?.map((c) => c.text ?? c.type)
      .join("")
      .slice(0, 32) ?? "";
  return `${node.type}-${text || index}`;
}

function inlineKey(
  inline: InlineContent,
  parentKey: string,
  index: number,
): string {
  if (inline.type === "hardBreak") return `${parentKey}-br-${index}`;
  return `${parentKey}-${inline.text?.slice(0, 24) ?? inline.type}-${index}`;
}

function formatEditorContent(doc?: EditorDoc): React.ReactNode | null {
  if (!doc?.content) return null;

  return (
    <>
      {doc.content.map((node, ni) => {
        const nk = nodeKey(node, ni);
        if (node.type === "paragraph") {
          return (
            <p key={nk} className="m-0 min-h-[1em]">
              {node.content?.map((inline, ii) => {
                const ik = inlineKey(inline, nk, ii);

                if (inline.type === "text") {
                  const style: React.CSSProperties = { fontSize: 11 };

                  if (inline.marks) {
                    for (const mark of inline.marks) {
                      if (mark.type === "bold") style.fontWeight = 600;
                      else if (mark.type === "italic")
                        style.fontStyle = "italic";
                      else if (mark.type === "link")
                        style.textDecoration = "underline";
                      else if (mark.type === "strike")
                        style.textDecoration = "line-through";
                    }
                  }

                  const content = inline.text || "";

                  return (
                    <span key={ik} style={style}>
                      {content}
                    </span>
                  );
                }

                if (inline.type === "hardBreak") {
                  return <br key={ik} />;
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

type Props = {
  content?: EditorDoc | null;
};

export function EditorContent({ content }: Props) {
  if (!content) return null;
  return <div className="leading-[16px]">{formatEditorContent(content)}</div>;
}
