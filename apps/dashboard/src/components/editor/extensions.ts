import { Placeholder, StarterKit, TextStyle } from "novel/extensions";

const starterKit = StarterKit.configure();

export function setupExtensions({ placeholder }: { placeholder?: string }) {
  return [
    starterKit,
    placeholder ? Placeholder.configure({ placeholder }) : null,
    TextStyle,
  ];
}
