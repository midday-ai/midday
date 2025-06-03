"use client";

import { isDesktopApp } from "@midday/desktop-client/platform";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { webContents } from "@todesktop/client-core";
import { useEffect, useState } from "react";

export function BrowserNavigation() {
  if (!isDesktopApp()) {
    return null;
  }

  const [canGoForward, setCanGoForward] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  // useEffect(() => {
  //   webContents.on("did-navigate", async () => {
  //     if (await webContents.canGoForward()) {
  //       setCanGoForward(true);
  //     } else {
  //       setCanGoForward(false);
  //     }

  //     if (await webContents.canGoBack()) {
  //       setCanGoBack(true);
  //     } else {
  //       setCanGoBack(false);
  //     }
  //   });
  // }, []);

  const handleOnNavigate = (dir: "back" | "forward") => {
    if (dir === "back") {
      // @ts-expect-error
      window.todesktop.contents.goBack();
    }

    if (dir === "forward") {
      // @ts-expect-error
      window.todesktop.contents.goForward();
    }
  };

  return (
    <div className="hidden todesktop:block no-drag h-6">
      <button
        type="button"
        onClick={() => handleOnNavigate("back")}
        className={cn(!canGoBack && "opacity-50")}
        disabled={!canGoBack}
      >
        <Icons.ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={() => handleOnNavigate("forward")}
        className={cn(!canGoForward && "opacity-50")}
        disabled={!canGoForward}
      >
        <Icons.ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
