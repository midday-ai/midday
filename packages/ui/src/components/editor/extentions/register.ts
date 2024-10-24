// You can find the list of extensions here: https://tiptap.dev/docs/editor/extensions/functionality

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";

// Add your extensions here
export const extensions = [
  StarterKit,
  Placeholder.configure({ placeholder: "Write something..." }),
  Link.configure({
    openOnClick: false,
    defaultProtocol: "https",
  }),
];
