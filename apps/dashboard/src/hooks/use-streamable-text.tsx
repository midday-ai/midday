import { type StreamableValue, readStreamableValue } from "ai/rsc";
import { useEffect, useState } from "react";

/**
 * A custom React hook that handles both static strings and streamable text content.
 *
 * @param content - The input content, which can be either a string or a StreamableValue<string>.
 * @returns The current value of the content as a string.
 *
 * @remarks
 * This hook is designed to work with both static strings and streamable content.
 * For static strings, it returns the content as-is.
 * For streamable content, it incrementally updates the returned value as new chunks arrive.
 *
 * @example
 * ```tsx
 * const MyComponent = ({ content }) => {
 *   const text = useStreamableText(content);
 *   return <div>{text}</div>;
 * };
 * ```
 */
export const useStreamableText = (
  content: string | StreamableValue<string>,
) => {
  const [rawContent, setRawContent] = useState(
    typeof content === "string" ? content : "",
  );

  useEffect(() => {
    /**
     * Asynchronous function to handle streamable content.
     * This function is immediately invoked within the effect.
     */
    (async () => {
      if (typeof content === "object") {
        let value = "";
        for await (const delta of readStreamableValue(content)) {
          if (typeof delta === "string") {
            setRawContent((value = value + delta));
          }
        }
      }
    })();
  }, [content]);

  return rawContent;
};
