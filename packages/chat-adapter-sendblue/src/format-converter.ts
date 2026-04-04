/**
 * Plain-text format converter for iMessage via Sendblue.
 *
 * iMessage is a plain-text platform — markdown bold/italic/links are not
 * rendered natively. Outbound messages strip all formatting. Inbound messages
 * are treated as plain text.
 */

/**
 * Strip markdown-style formatting for Sendblue outbound messages.
 * Preserves newlines and URLs but removes bold, italic, code fences, etc.
 */
export function toPlainText(text: string): string {
  const urlPlaceholders: string[] = [];

  let result = text
    // Protect URLs from being mangled by markdown stripping
    .replace(/https?:\/\/[^\s)>\]]+/g, (url) => {
      urlPlaceholders.push(url);
      return `%%URLPH${urlPlaceholders.length - 1}%%`;
    })
    // code blocks → content only
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```(\w*\n?)?/g, "").trim())
    // inline code
    .replace(/`([^`]+)`/g, "$1")
    // bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    // bold
    .replace(/\*\*(.+?)\*\*/g, "$1")
    // italic
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/(?<!\w)_(.+?)_(?!\w)/g, "$1")
    // strikethrough
    .replace(/~~(.+?)~~/g, "$1")
    // markdown links → "text (url)"
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    // headings
    .replace(/^#{1,6}\s+/gm, "")
    // horizontal rules
    .replace(/^[-*_]{3,}$/gm, "")
    // unordered list markers
    .replace(/^[\s]*[-*+]\s+/gm, "• ")
    .trim();

  // Restore protected URLs
  result = result.replace(
    /%%URLPH(\d+)%%/g,
    (_, idx) => urlPlaceholders[Number(idx)]!,
  );

  return result;
}
