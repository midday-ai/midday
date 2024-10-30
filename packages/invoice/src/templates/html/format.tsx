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
            <p key={`paragraph-${nodeIndex.toString()}`} className="mb-1">
              {node.content?.map((inlineContent, inlineIndex) => {
                if (inlineContent.type === "text") {
                  let style = "text-[11px]";
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
