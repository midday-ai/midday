"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";

export function DesktopTrafficLight() {
  const handleClose = async () => {
    try {
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };

  const handleMinimize = async () => {
    try {
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      const window = getCurrentWindow();
      const isMaximized = await window.isMaximized();

      if (isMaximized) {
        await window.unmaximize();
      } else {
        await window.toggleMaximize();
      }
    } catch (error) {
      console.error("Failed to toggle maximize:", error);
    }
  };

  return (
    <div className="fixed top-[9px] left-[9px] space-x-[8px] flex">
      {/* Close button (red) */}
      <button
        type="button"
        onClick={handleClose}
        className="w-[11px] h-[11px] bg-border rounded-full hover:bg-red-500 cursor-pointer"
        aria-label="Close window"
      />
      {/* Minimize button (yellow) */}
      <button
        type="button"
        onClick={handleMinimize}
        className="w-[11px] h-[11px] bg-border rounded-full hover:bg-yellow-500 cursor-pointer"
        aria-label="Minimize window"
      />
      {/* Maximize/Restore button (green) */}
      <button
        type="button"
        onClick={handleMaximize}
        className="w-[11px] h-[11px] bg-border rounded-full hover:bg-green-500 cursor-pointer"
        aria-label="Toggle maximize"
      />
    </div>
  );
}
