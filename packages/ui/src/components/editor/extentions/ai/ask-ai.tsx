"use client";

import { MdOutlineAutoAwesome } from "react-icons/md";
import { BubbleMenuButton } from "../bubble-menu/bubble-menu-button";

type Props = {
  onSelect: () => void;
};

export function AskAI({ onSelect }: Props) {
  return (
    <BubbleMenuButton
      action={onSelect}
      isActive={false}
      className="flex space-x-2 items-center"
    >
      <MdOutlineAutoAwesome className="size-4" />
    </BubbleMenuButton>
  );
}
