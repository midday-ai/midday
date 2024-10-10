import {
  Color,
  HorizontalRule,
  Placeholder,
  StarterKit,
  TaskItem,
  TaskList,
  TextStyle,
  TiptapLink,
  UpdatedImage,
} from "novel/extensions";

import { cx } from "class-variance-authority";

// TODO I am using cx here to get tailwind autocomplete working, idk if someone else can write a regex to just capture the class key in objects

// You can overwrite the placeholder with your own configuration
const placeholder = Placeholder;
//   const tiptapLink = TiptapLink.configure({
//     HTMLAttributes: {
//       class: cx(
//         "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer",
//       ),
//     },
//   });

const starterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: cx("list-disc list-outside leading-3 -mt-2"),
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: cx("list-decimal list-outside leading-3 -mt-2"),
    },
  },
  listItem: {
    HTMLAttributes: {
      class: cx("leading-normal -mb-2"),
    },
  },
  blockquote: {
    HTMLAttributes: {
      class: cx("border-l-4 border-primary"),
    },
  },
  horizontalRule: false,
  dropcursor: {
    color: "#DBEAFE",
    width: 4,
  },
  gapcursor: false,
});

export const defaultExtensions = [starterKit, placeholder, TextStyle, Color];
