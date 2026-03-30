"use client";

import {
  ChatGPTMcpLogo,
  ClaudeMcpLogo,
  CopilotMcpLogo,
  CursorMcpLogo,
  ManusMcpLogo,
  PerplexityMcpLogo,
} from "@midday/app-store/logos";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { motion } from "framer-motion";
import { parseAsString, useQueryStates } from "nuqs";
import type { ComponentType } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { LocalStorageKeys } from "@/utils/constants";

const primaryClients: { id: string; name: string; Logo: ComponentType }[] = [
  { id: "chatgpt-mcp", name: "ChatGPT", Logo: ChatGPTMcpLogo },
  { id: "claude-mcp", name: "Claude", Logo: ClaudeMcpLogo },
];

const moreClients: { id: string; name: string; Logo: ComponentType }[] = [
  { id: "cursor-mcp", name: "Cursor", Logo: CursorMcpLogo },
  { id: "perplexity-mcp", name: "Perplexity", Logo: PerplexityMcpLogo },
  { id: "copilot-mcp", name: "Copilot", Logo: CopilotMcpLogo },
  { id: "manus-mcp", name: "Manus", Logo: ManusMcpLogo },
];

function McpConnectButton({
  id,
  name,
  Logo,
  onConnect,
}: {
  id: string;
  name: string;
  Logo: ComponentType;
  onConnect: (id: string) => void;
}) {
  return (
    <Button
      className="px-4 font-medium h-[40px] w-full"
      variant="outline"
      data-track="MCP App Selected"
      data-app={name}
      onClick={() => onConnect(id)}
    >
      <div className="flex items-center space-x-2">
        <div className="size-5 overflow-hidden rounded shrink-0 mcp-step-icon">
          <Logo />
        </div>
        <span>Connect {name}</span>
      </div>
    </Button>
  );
}

export function ConnectMcpStep() {
  const [, setParams] = useQueryStates({
    "mcp-app": parseAsString,
  });
  const [, setMcpBannerDismissed] = useLocalStorage(
    LocalStorageKeys.McpBannerDismissed,
    false,
  );

  const handleConnect = (id: string) => {
    setMcpBannerDismissed(true);
    setParams({ "mcp-app": id });
  };

  return (
    <div className="space-y-4">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-lg lg:text-xl font-serif"
      >
        Use Midday where you already work
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-sm text-muted-foreground leading-relaxed"
      >
        Ask questions and take action without leaving your favorite AI tool.
      </motion.p>

      <motion.ul
        className="space-y-2 pl-0 list-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.3 }}
      >
        {[
          "Send invoices and track payments in natural language",
          "Ask about your business — revenue, expenses, runway and more",
          "Categorize transactions and export reports",
          "Works with ChatGPT, Claude, Cursor and other AI tools",
        ].map((feature, index) => (
          <motion.li
            key={feature}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            className="flex items-start gap-3"
          >
            <div className="relative w-4 h-4 flex items-center justify-center shrink-0 mt-0.5 border border-border bg-secondary">
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                className="relative z-10"
              >
                <path
                  d="M2 5L4.5 7.5L8 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm text-muted-foreground leading-relaxed">
              {feature}
            </span>
          </motion.li>
        ))}
      </motion.ul>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="border-t border-border !mt-6"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="!mt-6"
      >
        <div className="flex gap-2">
          {primaryClients.map(({ id, name, Logo }) => (
            <McpConnectButton
              key={id}
              id={id}
              name={name}
              Logo={Logo}
              onConnect={handleConnect}
            />
          ))}
        </div>

        <Accordion type="single" collapsible className="border-t pt-2 mt-4">
          <AccordionItem value="more-options" className="border-0">
            <AccordionTrigger className="justify-center space-x-2 flex text-sm">
              <span>More options</span>
            </AccordionTrigger>
            <AccordionContent className="mt-4">
              <div className="flex flex-col space-y-2">
                {moreClients.map(({ id, name, Logo }) => (
                  <McpConnectButton
                    key={id}
                    id={id}
                    name={name}
                    Logo={Logo}
                    onConnect={handleConnect}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </motion.div>

      <style>
        {
          ".mcp-step-icon img, .mcp-step-icon svg { width: 100% !important; height: 100% !important; }"
        }
      </style>
    </div>
  );
}
