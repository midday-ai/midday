"use client";

import config from "@/config";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function DesktopCommandMenuSignIn() {
  return (
    <div className="flex h-full flex-col">
      <Icons.Logo className="absolute top-8 left-8" />

      <div className="flex items-center w-full justify-center h-full">
        <a href={config.desktopUrl}>
          <Button variant="outline">Login to {config.company}</Button>
        </a>
      </div>
    </div>
  );
}
