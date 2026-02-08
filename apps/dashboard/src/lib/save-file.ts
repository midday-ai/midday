import { isDesktopApp } from "@midday/desktop-client/platform";
import { saveAs } from "file-saver";

export async function saveFile(blob: Blob, filename: string) {
  if (!isDesktopApp()) {
    saveAs(blob, filename);
    return;
  }

  // Desktop mode - write blob bytes to ~/Downloads via Tauri fs plugin
  const { nativeSaveFile } = await import("@midday/desktop-client/core");
  try {
    await nativeSaveFile(blob, filename);
    console.log("[saveFile] File saved successfully:", filename);
  } catch (error) {
    console.error("[saveFile] Failed to save file:", error);
    throw error;
  }
}
