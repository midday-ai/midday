"use client";

import { isDesktopApp } from "@midday/desktop-client/platform";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";

export function DesktopPageLoaded() {
  // useEffect(() => {
  //   if (!isDesktopApp()) {
  //     return;
  //   }

  //   const showWindow = async () => {
  //     try {
  //       console.log("📄 Calling show_window command");
  //       await invoke("show_window");
  //       console.log("✅ Window shown successfully");
  //     } catch (error) {
  //       console.error("Failed to show window:", error);
  //     }
  //   };

  //   // Simple timeout approach - let content load naturally then show window
  //   const timer = setTimeout(showWindow, 400);

  //   // Cleanup timer if component unmounts
  //   return () => clearTimeout(timer);
  // }, []);

  return null;
}
