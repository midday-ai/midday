"use client";

import { HeroChatInput } from "./hero-chat-input";
import { useDocsChat } from "./docs-chat-provider";

export function DocsHomeHero() {
  const { sendMessage } = useDocsChat();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Documentation
        </p>
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-4">
          How can we help?
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto leading-relaxed mb-10">
          Get instant answers about invoicing, banking, time tracking, and more.
        </p>
        <HeroChatInput onSubmit={sendMessage} />
      </div>
    </div>
  );
}
