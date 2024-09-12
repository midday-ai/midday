import React, { useRef, useState } from "react";
import { cn } from "@/lib/editor/utils";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import type { Editor } from "@tiptap/core";

interface ImageEditBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  editor: Editor;
  close: () => void;
}

const ImageEditBlock = ({
  editor,
  className,
  close,
  ...props
}: ImageEditBlockProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState<string>("");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleLink = () => {
    editor.chain().focus().setImage({ src: link }).run();
    close();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      editor.chain().setImage({ src }).focus().run();
    };

    reader.readAsDataURL(files[0]);

    close();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLink();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={cn("space-y-6", className)} {...props}>
        <div className="space-y-1">
          <Label>Attach an image link</Label>
          <div className="flex">
            <Input
              type="url"
              required
              placeholder="https://example.com"
              value={link}
              className="grow"
              onChange={(e) => setLink(e.target.value)}
            />
            <Button type="submit" className="ml-2 inline-block">
              Submit
            </Button>
          </div>
        </div>
        <Button className="w-full" onClick={handleClick}>
          Upload from your computer
        </Button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          multiple
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </form>
  );
};

export { ImageEditBlock };
