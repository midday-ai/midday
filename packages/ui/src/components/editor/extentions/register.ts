// You can find the list of extensions here: https://tiptap.dev/docs/editor/extensions/functionality

import Document from "@tiptap/extension-document";
import Link from "@tiptap/extension-link";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

// Add your extensions here
const extensions = [
  StarterKit,
  Paragraph,
  Document,
  Text,
  Underline,
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: "https",
  }),
];

export function registerExtensions(options?: { placeholder?: string }) {
  const { placeholder } = options ?? {};
  return [...extensions, Placeholder.configure({ placeholder })];
}
