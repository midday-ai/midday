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
  return (
    text
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
      .replace(/_(.+?)_/g, "$1")
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
      .trim()
  );
}
