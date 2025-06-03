"use client";

import { isDesktopApp } from "@midday/desktop-client/platform";
import { DesktopTrafficLight } from "./desktop-traffic-light";

export function DesktopHeader() {
  if (!isDesktopApp()) {
    return null;
  }

  // This is used to make the header draggable on macOS
  return (
    <div data-tauri-drag-region className="fixed top-0 w-full h-10 z-50 group">
      <div className="hidden group-hover:flex">
        <DesktopTrafficLight />
      </div>
    </div>
  );
}
