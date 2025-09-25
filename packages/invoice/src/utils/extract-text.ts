import { generateText } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { isValidJSON } from "./content";

/**
 * Extracts text content from various JSON formats, including TipTap rich text
 * @param value - The value to extract text from (string or JSON string)
 * @returns The extracted text content or the original value if extraction fails
 */
export function extractTextFromValue(value: string): string {
  if (isValidJSON(value)) {
    try {
      const parsed = JSON.parse(value);

      // If it's a string, return as is
      if (typeof parsed === "string") {
        return parsed;
      }

      // Use TipTap's generateText utility for JSON content
      if (typeof parsed === "object" && parsed !== null) {
        try {
          const textContent = generateText(parsed, [
            StarterKit,
            Link,
            Underline,
          ]);

          if (textContent.trim()) {
            return textContent.trim();
          }
        } catch {
          // If generateText fails, return original value
          return value;
        }
      }
    } catch {
      // If parsing fails, return original value
      return value;
    }
  }

  return value;
}
