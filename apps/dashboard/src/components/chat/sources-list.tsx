import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { OpenURL } from "@/components/open-url";
import { getWebsiteLogo } from "@/utils/logos";
import { addUtmSource, getRootDomain, type SourceUrlPart } from "./chat-utils";

export function SourcesList({ sources }: { sources: SourceUrlPart[] }) {
  if (sources.length === 0) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center not-prose mt-3">
        <div className="flex items-center">
          <AnimatePresence mode="popLayout">
            {sources.map((source, index) => {
              const domain = getRootDomain(source.url);

              return (
                <Tooltip key={source.sourceId}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.6,
                        x: 50,
                        filter: "blur(4px)",
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: 0,
                        filter: "blur(0px)",
                        zIndex: sources.length - index,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.8,
                        x: -20,
                        filter: "blur(4px)",
                      }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.04,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="relative -ml-2 first:ml-0"
                      style={{ zIndex: sources.length - index }}
                    >
                      <OpenURL href={addUtmSource(source.url)}>
                        <div className="relative size-5 rounded-full bg-background border-2 border-border overflow-hidden flex items-center justify-center shadow-sm cursor-pointer">
                          <img
                            src={getWebsiteLogo(domain)}
                            alt={domain}
                            className="size-full object-cover"
                          />
                        </div>
                      </OpenURL>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {source.title || domain}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </AnimatePresence>
        </div>

        <span className="text-xs text-muted-foreground ml-2">
          {sources.length} {sources.length === 1 ? "source" : "sources"}
        </span>
      </div>
    </TooltipProvider>
  );
}
