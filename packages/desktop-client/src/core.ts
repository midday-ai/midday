export { invoke } from "@tauri-apps/api/core";
export { emit, listen } from "@tauri-apps/api/event";
export { getCurrentWindow, Window } from "@tauri-apps/api/window";
export { openUrl } from "@tauri-apps/plugin-opener";

/**
 * Download a file from a URL directly to the user's ~/Downloads folder.
 */
export async function nativeDownload(url: string, filename: string) {
  const { download } = await import("@tauri-apps/plugin-upload");
  const { downloadDir } = await import("@tauri-apps/api/path");

  const dir = await downloadDir();
  await download(url, `${dir}/${filename}`);
}

/**
 * Write a Blob to a user-selected location via save dialog.
 */
export async function nativeSaveFile(blob: Blob, filename: string) {
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { open } = await import("@tauri-apps/plugin-fs");
    const { downloadDir } = await import("@tauri-apps/api/path");

    console.log("[nativeSaveFile] Starting file save:", {
      filename,
      blobSize: blob.size,
      blobType: blob.type,
    });

    if (!blob || blob.size === 0) {
      throw new Error("Blob is empty or invalid");
    }

    const buffer = await blob.arrayBuffer();
    console.log("[nativeSaveFile] Converted blob to buffer:", {
      bufferSize: buffer.byteLength,
    });

    if (buffer.byteLength === 0) {
      throw new Error("Buffer is empty after conversion");
    }

    // Extract file extension for filter
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    const filters = extension
      ? [{ name: "Files", extensions: [extension] }]
      : undefined;

    // Show save dialog with default path in Downloads folder
    const defaultPath = `${await downloadDir()}/${filename}`;
    const selectedPath = await save({
      defaultPath,
      filters,
      title: "Save File",
    });

    if (!selectedPath) {
      // User cancelled the dialog
      console.log("[nativeSaveFile] User cancelled save dialog");
      return;
    }

    // Write file to selected path
    // The save dialog automatically adds the path to filesystem scope
    // Use open() with write/create/truncate flags for reliable file writing
    const file = await open(selectedPath, {
      write: true,
      create: true,
      truncate: true,
    });
    await file.write(new Uint8Array(buffer));
    await file.close();

    console.log("[nativeSaveFile] File saved successfully:", selectedPath);

    // Optionally reveal file in Finder (macOS will bounce the folder icon)
    // This is optional - comment out if you don't want to open Finder
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      // Open the file's parent directory in Finder
      // On macOS, this will cause the folder icon to bounce if Downloads folder
      const parentDir = selectedPath.substring(
        0,
        selectedPath.lastIndexOf("/"),
      );
      await openUrl(`file://${parentDir}`);
    } catch (error) {
      // Ignore errors - revealing file is optional
      console.log("[nativeSaveFile] Could not reveal file:", error);
    }
  } catch (error) {
    console.error("[nativeSaveFile] Error saving file:", error);
    throw error;
  }
}
