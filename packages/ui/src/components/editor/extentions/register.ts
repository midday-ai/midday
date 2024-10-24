import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";

// Add your extensions here
export const extensions = [
  StarterKit,
  Placeholder.configure({ placeholder: "Write something..." }),
];
