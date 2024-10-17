"use client";

import { generateEditorContent } from "@/actions/ai/editor/generate-editor-content";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useClickAway } from "@uidotdev/usehooks";
import { readStreamableValue } from "ai/rsc";
import { motion } from "framer-motion";
import { useEditor } from "novel";
import { useState } from "react";

const selectors = [
  {
    name: "Grammar",
    icon: Icons.Spellcheck,
  },
  {
    name: "Improve",
    icon: Icons.WrapText,
  },
  {
    name: "Condense",
    icon: Icons.Condense,
  },
];

type Props = {
  onOpenChange: (open: boolean) => void;
  context?: Record<string, string>;
  setThinking: (thinking: boolean) => void;
};

const formatEditorContent = (content: string) => {
  return content.replace(/\n/g, "<br />");
};

export function AISelector({ onOpenChange, context, setThinking }: Props) {
  const { editor } = useEditor();
  const [generation, setGeneration] = useState<string>("");

  const [isTypingPrompt, setIsTypingPrompt] = useState(false);
  const ref = useClickAway<HTMLDivElement>(() => {
    onOpenChange(false);
    setIsTypingPrompt(false);
  });

  const handleGenerate = async (selection: string) => {
    setThinking(true);

    const text = editor?.state.doc.textBetween(
      editor?.state?.selection?.from,
      editor?.state?.selection?.to,
      "",
    );

    if (!text) return;

    const { output } = await generateEditorContent({
      input: text,
      context: `${selection}\n
        ${Object.entries(context ?? {})
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")}`,
    });

    let generatedContent = "";
    for await (const delta of readStreamableValue(output)) {
      generatedContent += delta;
      setGeneration(generatedContent);

      editor?.commands.insertContent(formatEditorContent(delta ?? ""));
    }

    onOpenChange(false);
    setThinking(false);
  };

  return (
    <div ref={ref} className="flex whitespace-nowrap divide-x">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {isTypingPrompt ? (
          <div className="relative">
            <Input
              placeholder="Type your prompt…"
              autoFocus
              onBlur={() => setIsTypingPrompt(false)}
              className="w-[280px] text-[11px] border-none px-4 h-8"
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onOpenChange(false);
                  handleGenerate(`Custom prompt: ${e.currentTarget.value}`);
                }
              }}
            />

            <kbd className="pointer-events-none h-5 select-none items-center gap-1 px-1.5 font-mono text-[13px] font-medium absolute right-2 top-1/2 -translate-y-1/2">
              <span>↵</span>
            </kbd>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="h-8 text-[10px] whitespace-nowrap w-auto px-2 font-medium flex items-center space-x-1 pl-4"
            onClick={() => setIsTypingPrompt(true)}
          >
            <Icons.AIOutline className="size-3" />
            <span>Ask AI</span>
          </Button>
        )}
      </motion.div>

      {!isTypingPrompt &&
        selectors.map((selector, index) => (
          <motion.div
            key={selector.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: (index + 1) * 0.05 }}
          >
            <Button
              variant="ghost"
              onClick={() => handleGenerate(selector.name)}
              className={cn(
                "h-8 text-[10px] whitespace-nowrap w-auto px-2 font-medium flex items-center space-x-1",
                index === selectors.length - 1 && "pr-3",
              )}
            >
              <selector.icon className="size-3" />
              <span>{selector.name}</span>
            </Button>
          </motion.div>
        ))}
    </div>
  );
}
