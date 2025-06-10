import { invoke } from "@midday/desktop-client/core";
import { isDesktopApp } from "@midday/desktop-client/platform";

export async function downloadFile(url: string, filename: string) {
  if (!isDesktopApp()) {
    // Web mode - normal download
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  try {
    // Desktop mode - open download URL in default browser
    // The browser will have access to user's authentication and handle the download
    console.log("📥 Opening download in browser:", { url, filename });

    const downloadUrl = `${window.location.origin}${url}`;

    // Use Tauri's opener plugin via invoke to open URL in default browser
    await invoke("plugin:opener|open_url", {
      url: downloadUrl,
    });

    console.log("✅ Download opened in browser:", downloadUrl);
  } catch (error) {
    console.error("❌ Failed to open download in browser:", error);
    throw error;
  }
}
