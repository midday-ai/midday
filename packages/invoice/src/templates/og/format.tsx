import type { EditorDoc } from "../types";

export function formatEditorContent(doc?: EditorDoc): JSX.Element | null {
  if (!doc || !doc.content) {
    return null;
  }

  return (
    <div tw="flex flex-col text-white">
      {doc.content.map((node, nodeIndex) => {
        if (node.type === "paragraph") {
          return (
            <p key={`paragraph-${nodeIndex.toString()}`} tw="flex flex-col">
              {node.content?.map((inlineContent, inlineIndex) => {
                if (inlineContent.type === "text") {
                  let style = "text-[22px]";

                  if (inlineContent.marks) {
                    for (const mark of inlineContent.marks) {
                      if (mark.type === "bold") {
                        style += " font-medium";
                      } else if (mark.type === "italic") {
                        style += " italic";
                      } else if (mark.type === "link") {
                        style += " underline";
                      }
                    }
                  }

                  if (inlineContent.text) {
                    return (
                      <span
                        key={`text-${nodeIndex}-${inlineIndex.toString()}`}
                        tw={style}
                      >
                        {inlineContent.text}
                      </span>
                    );
                  }
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
    </div>
  );
}
