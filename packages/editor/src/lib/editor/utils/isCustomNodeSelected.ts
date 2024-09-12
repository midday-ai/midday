import {
  AiImage,
  AiWriter,
  CodeBlock,
  Figcaption,
  HorizontalRule,
  ImageBlock,
  ImageUpload,
  Link,
} from "@/extensions";
import { TableOfContentsNode } from "@/extensions/tableOfContentsNode";
import { Editor } from "@tiptap/react";

export const isTableGripSelected = (node: HTMLElement) => {
  let container = node;

  while (container && !["TD", "TH"].includes(container.tagName)) {
    container = container.parentElement!;
  }

  const gripColumn =
    container &&
    container.querySelector &&
    container.querySelector("a.grip-column.selected");
  const gripRow =
    container &&
    container.querySelector &&
    container.querySelector("a.grip-row.selected");

  if (gripColumn || gripRow) {
    return true;
  }

  return false;
};

export const isCustomNodeSelected = (editor: Editor, node: HTMLElement) => {
  const customNodes = [
    HorizontalRule.name,
    ImageBlock.name,
    ImageUpload.name,
    CodeBlock.name,
    ImageBlock.name,
    Link.name,
    AiWriter.name,
    AiImage.name,
    Figcaption.name,
    TableOfContentsNode.name,
  ];

  return (
    customNodes.some((type) => editor.isActive(type)) ||
    isTableGripSelected(node)
  );
};

export default isCustomNodeSelected;
