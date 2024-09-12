import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/editor/utils";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";
import type { Editor } from "@tiptap/core";

import { LinkProps } from "../../types";

interface LinkEditBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  editor: Editor;
  onSetLink: ({ url, text, openInNewTab }: LinkProps) => void;
  close?: () => void;
}

const LinkEditBlock = ({
  editor,
  onSetLink,
  close,
  className,
  ...props
}: LinkEditBlockProps) => {
  const [field, setField] = useState<LinkProps>({
    url: "",
    text: "",
    openInNewTab: false,
  });

  const data = useMemo(() => {
    const { href, target } = editor.getAttributes("link");
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, " ");

    return {
      url: href,
      text,
      openInNewTab: target === "_blank" ? true : false,
    };
  }, [editor]);

  useEffect(() => {
    setField(data);
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSetLink(field);
    close?.();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={cn("space-y-4", className)} {...props}>
        <div className="space-y-1">
          <Label>Link</Label>
          <Input
            type="url"
            required
            placeholder="Paste a link"
            value={field.url ?? ""}
            onChange={(e) => setField({ ...field, url: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <Label>Display text (optional)</Label>
          <Input
            type="text"
            placeholder="Text to display"
            value={field.text ?? ""}
            onChange={(e) => setField({ ...field, text: e.target.value })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Label>Open in new tab</Label>
          <Switch
            checked={field.openInNewTab}
            onCheckedChange={() =>
              setField({ ...field, openInNewTab: !field.openInNewTab })
            }
          />
        </div>

        <div className="flex justify-end space-x-2">
          {close && (
            <Button variant="ghost" type="button" onClick={close}>
              Cancel
            </Button>
          )}

          <Button type="submit">Insert</Button>
        </div>
      </div>
    </form>
  );
};

export { LinkEditBlock };
