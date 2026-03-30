"use client";

import { connectorApps, getConnectorLogoUrl } from "@midday/connectors";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ConnectorsModal } from "@/components/modals/connectors-modal";

const DISPLAY_COUNT = 7;

type DisplayItem = { id: string; name: string; logo: string };

const activeConnectors = connectorApps.filter((c) => c.active);

function pickRandom(): DisplayItem[] {
  const copy = [...activeConnectors];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy
    .slice(0, DISPLAY_COUNT)
    .map((c) => ({ id: c.id, name: c.name, logo: getConnectorLogoUrl(c.id) }));
}

export function ConnectorsBar() {
  const [open, setOpen] = useState(false);
  const [displayed, setDisplayed] = useState<DisplayItem[] | null>(null);

  useEffect(() => {
    setDisplayed(pickRandom());
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center justify-between w-full px-4 py-2 mt-0.5 bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)] backdrop-blur-lg hover:bg-[rgba(240,240,240,0.95)] dark:hover:bg-[rgba(25,25,25,0.85)] transition-colors group"
        >
          <span className="text-[12px] text-[#878787]/60 group-hover:text-[#878787] transition-colors">
            Connect your tools to Midday
          </span>

          <div className="flex items-center">
            <div className="flex items-center -space-x-2">
              {displayed?.map(({ id, name, logo }, i) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.05 + i * 0.05,
                  }}
                  className="size-[18px] overflow-hidden rounded-full border-[1.5px] border-background flex-shrink-0 bg-background"
                >
                  <img
                    src={logo}
                    alt={name}
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Icons.ChevronRight
                size={16}
                className="text-[#878787]/40 ml-1 group-hover:text-[#878787] transition-colors"
              />
            </motion.div>
          </div>
        </button>
      </motion.div>

      <ConnectorsModal open={open} onOpenChange={setOpen} />
    </>
  );
}
