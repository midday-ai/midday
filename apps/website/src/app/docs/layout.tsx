import { DocsChatProvider } from "@/components/docs/docs-chat-provider";
import type { ReactNode } from "react";
import { Suspense } from "react";

export const metadata = {
  title: "Documentation",
  description: "Learn how to use Midday to run your business finances",
};

function DocsLayoutContent({ children }: { children: ReactNode }) {
  return <DocsChatProvider>{children}</DocsChatProvider>;
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DocsLayoutContent>{children}</DocsLayoutContent>
    </Suspense>
  );
}
