"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useEditor } from "novel";

type Props = {
  onSelect: () => void;
};

export const AskAI = ({ onSelect }: Props) => {
  const { editor } = useEditor();

  if (!editor) return null;

  return (
    <Button
      size="icon"
      className="rounded-none text-primary h-8"
      variant="ghost"
      onClick={onSelect}
    >
      <Icons.AIOutline className="size-4" />
    </Button>
  );
};
