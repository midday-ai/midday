"use client";

import { useDocsChat } from "./docs-chat-provider";
import { HeroChatInput } from "./hero-chat-input";

export function DocsHomeHero() {
  const { sendMessage } = useDocsChat();

  return (
    <div className="min-h-[50vh] md:min-h-[60vh] flex items-center justify-center px-4 pt-24 md:pt-32 pb-8">
      <div className="max-w-3xl mx-auto text-center w-full">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 md:mb-4">
          Documentation
        </p>
        <h1 className="text-3xl md:text-5xl font-serif tracking-tight mb-3 md:mb-4">
          How can we help?
        </h1>
        <p className="text-muted-foreground text-base lg:text-sm xl:text-base max-w-lg mx-auto leading-relaxed mb-8 md:mb-10 px-4 md:px-0">
          Learn how to run your business smarter with Midday.
        </p>
        <HeroChatInput onSubmit={sendMessage} />
      </div>
    </div>
  );
}
