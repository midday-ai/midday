import { Icons } from "@midday/ui/icons";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="flex items-center pt-1 pb-4 mb-5 border-b border-border -mx-4 px-4">
        <Icons.LogoSmall className="size-4 text-muted-foreground" />
      </header>
      {children}
    </>
  );
}
