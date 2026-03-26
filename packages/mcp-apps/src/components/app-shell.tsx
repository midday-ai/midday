import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between pb-4 mb-4 border-b border-border -mx-4 px-4">
        <Icons.LogoSmall className="size-5 text-muted-foreground" />
        <Button variant="outline" size="icon" asChild>
          <a
            href="https://app.midday.ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icons.ExternalLink className="size-3" />
          </a>
        </Button>
      </header>
      {children}
    </>
  );
}
