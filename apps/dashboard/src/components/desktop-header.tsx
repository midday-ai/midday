"use client";

import { isDesktopApp } from "@midday/desktop-client/platform";
import { DesktopTrafficLight } from "./desktop-traffic-light";

export function DesktopHeader() {
  if (!isDesktopApp()) {
    return null;
  }

  // This is used to make the header draggable on macOS
  return (
    <div
      data-tauri-drag-region={true}
      className="absolute top-0 left-0 right-0 h-8 z-50 group border-radius-[10px] overflow-hidden"
    >
      <div className="hidden group-hover:flex">
        <DesktopTrafficLight />
      </div>
    </div>
  );
}
