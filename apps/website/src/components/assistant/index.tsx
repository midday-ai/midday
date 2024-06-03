"use client";

import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function Assistant() {
  const [isExpanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);

  const toggleOpen = () => setExpanded((prev) => !prev);

  return (
    <div className="overflow-hidden p-0 max-w-[760px] h-[480px] bg-background border-border border w-full rounded-md relative">
      <Header toggleSidebar={toggleOpen} isExpanded={isExpanded} />
      <Sidebar setExpanded={setExpanded} isExpanded={isExpanded} />
    </div>
  );
}
