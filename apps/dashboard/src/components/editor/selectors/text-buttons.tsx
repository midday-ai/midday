import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { EditorBubbleItem, type EditorInstance, useEditor } from "novel";

import { cn } from "@midday/ui/cn";
type SelectorItem = {
  name: string;
  isActive: (editor: EditorInstance) => boolean;
  command: (editor: EditorInstance) => void;
  icon: React.ElementType;
};

export const TextButtons = () => {
  const { editor } = useEditor();

  if (!editor) return null;

  const items: SelectorItem[] = [
    {
      name: "bold",
      isActive: (editor) => editor.isActive("bold"),
      command: (editor) => editor.chain().focus().toggleBold().run(),
      icon: Icons.Bold,
    },
    {
      name: "italic",
      isActive: (editor) => editor.isActive("italic"),
      command: (editor) => editor.chain().focus().toggleItalic().run(),
      icon: Icons.Italic,
    },
    {
      name: "underline",
      isActive: (editor) => editor.isActive("underline"),
      command: (editor) => editor.chain().focus().toggleUnderline().run(),
      icon: Icons.Underlined,
    },
    {
      name: "strike",
      isActive: (editor) => editor.isActive("strike"),
      command: (editor) => editor.chain().focus().toggleStrike().run(),
      icon: Icons.Strikethrough,
    },
  ];
  return (
    <div className="flex">
      {items.map((item) => (
        <EditorBubbleItem
          key={item.name}
          onSelect={(editor) => {
            item.command(editor);
          }}
        >
          <Button
            size="icon"
            className={cn("rounded-none text-primary h-8", {
              "bg-accent": item.isActive(editor),
            })}
            variant="ghost"
          >
            <item.icon className="size-4" />
          </Button>
        </EditorBubbleItem>
      ))}
    </div>
  );
};
