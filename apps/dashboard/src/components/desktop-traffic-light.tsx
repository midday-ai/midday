"use client";

import { Window } from "@tauri-apps/api/window";

export function DesktopTrafficLight() {
  const getMainWindow = async () => {
    const mainWindow = await Window.getByLabel("main");
    if (!mainWindow) {
      throw new Error("Main window not found");
    }
    return mainWindow;
  };

  const handleClose = async () => {
    try {
      const window = await getMainWindow();
      // Hide the main window instead of closing it
      await window.hide();
    } catch (error) {
      console.error("Failed to hide main window:", error);
    }
  };

  const handleMinimize = async () => {
    try {
      const window = await getMainWindow();
      await window.minimize();
    } catch (error) {
      console.error("Failed to minimize main window:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      const window = await getMainWindow();
      const isMaximized = await window.isMaximized();

      if (isMaximized) {
        await window.unmaximize();
      } else {
        await window.toggleMaximize();
      }
    } catch (error) {
      console.error("Failed to toggle maximize main window:", error);
    }
  };

  return (
    <div className="fixed top-[8px] left-[8px] space-x-[8px] flex">
      {/* Close button (red) */}
      <button
        type="button"
        onClick={handleClose}
        className="w-[10px] h-[10px] bg-border rounded-full hover:bg-red-500 cursor-pointer"
        aria-label="Close window"
      />
      {/* Minimize button (yellow) */}
      <button
        type="button"
        onClick={handleMinimize}
        className="w-[10px] h-[10px] bg-border rounded-full hover:bg-yellow-500 cursor-pointer"
        aria-label="Minimize window"
      />
      {/* Maximize/Restore button (green) */}
      <button
        type="button"
        onClick={handleMaximize}
        className="w-[10px] h-[10px] bg-border rounded-full hover:bg-green-500 cursor-pointer"
        aria-label="Toggle maximize"
      />
    </div>
  );
}
