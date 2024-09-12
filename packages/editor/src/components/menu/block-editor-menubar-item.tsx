import React from "react";

import "./menubar-item.scss";

// Define the props type for the MenuItem
export interface BlockMenuBarItemProps {
  icon: React.ReactNode;
  title: string;
  action: () => void;
  isActive?: () => boolean;
}

export const BlockMenubarMenuItem: React.FC<BlockMenuBarItemProps> = ({
  icon,
  title,
  action,
  isActive = () => false,
}) => (
  <button
    className={`menu-item ${isActive() ? "border border-zinc-950 text-white" : "bg-white text-black"}`}
    onClick={action}
    title={title}
  >
    {icon}
  </button>
);
