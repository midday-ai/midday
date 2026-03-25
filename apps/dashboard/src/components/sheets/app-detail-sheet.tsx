"use client";

import { apps as appStoreApps } from "@midday/app-store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { parseAsString, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { MemoizedReactMarkdown } from "@/components/markdown";
import {
  ChatGPTSetupInstructions,
  ClaudeSetupInstructions,
} from "@/components/mcp-setup-instructions";

function AppHeroBanner({ app }: { app: (typeof appStoreApps)[number] }) {
  return (
    <div
      className="relative w-full flex items-center justify-center overflow-hidden bg-[#fafafa] dark:bg-[#0c0c0c]"
      style={{ height: 200 }}
    >
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, #e0e0e0 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          backgroundImage: "radial-gradient(circle, #333 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      />
      <div className="relative z-10 app-detail-sheet-icon">
        {app.logo && typeof app.logo !== "string" ? (
          <app.logo />
        ) : (
          <img src={app.logo as string} alt={app.name} />
        )}
        <style>
          {
            ".app-detail-sheet-icon img, .app-detail-sheet-icon svg { width: 64px !important; height: 64px !important; }"
          }
        </style>
      </div>
    </div>
  );
}

export function AppDetailSheet() {
  const [params, setParams] = useQueryStates({
    "mcp-app": parseAsString,
  });

  const appId = params["mcp-app"];

  const app = useMemo(() => {
    if (!appId) return null;
    return appStoreApps.find((a) => a.id === appId) ?? null;
  }, [appId]);

  if (!app) return null;

  return (
    <Sheet open={!!appId} onOpenChange={() => setParams({ "mcp-app": null })}>
      <SheetContent>
        <SheetHeader>
          <div className="mb-4">
            <AppHeroBanner app={app} />
          </div>

          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <h3 className="text-lg leading-none">{app.name}</h3>
              <span className="text-xs text-[#878787]">
                {"category" in app ? app.category : "Integration"} • By Midday
              </span>
            </div>
          </div>

          <div className="mt-4">
            <ScrollArea className="h-[calc(100vh-530px)] pt-2" hideScrollbar>
              <Accordion
                type="multiple"
                defaultValue={["description"]}
                className="mt-4"
              >
                <AccordionItem value="description" className="border-none">
                  <AccordionTrigger>How it works</AccordionTrigger>
                  <AccordionContent className="text-[#878787] text-sm">
                    {app.id === "chatgpt-mcp" ? (
                      <ChatGPTSetupInstructions />
                    ) : app.id === "claude-mcp" ? (
                      <ClaudeSetupInstructions />
                    ) : (
                      <div className="prose prose-sm prose-invert prose-p:text-[#878787] prose-p:my-3 [&_strong]:text-primary [&_strong]:font-normal max-w-none">
                        <MemoizedReactMarkdown>
                          {app.description || ""}
                        </MemoizedReactMarkdown>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollArea>
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
