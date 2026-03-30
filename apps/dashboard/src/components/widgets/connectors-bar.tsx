"use client";

import { connectorApps, getConnectorLogoUrl } from "@midday/connectors";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ConnectorsModal } from "@/components/modals/connectors-modal";

const DISPLAY_COUNT = 3;

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

const container = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: 6, scale: 0.8 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] as const },
  },
};

const text = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

export function ConnectorsBar() {
  const [open, setOpen] = useState(false);
  const [displayed, setDisplayed] = useState<DisplayItem[] | null>(null);

  useEffect(() => {
    setDisplayed(pickRandom());
  }, []);

  return (
    <>
      <div className="flex justify-end mt-1">
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          variants={container}
          initial="hidden"
          animate="show"
          className="inline-flex items-center gap-2 px-3 py-1.5 group"
        >
          <motion.span
            variants={text}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground transition-colors"
          >
            Connect apps
            <Icons.ChevronRight size={11} />
          </motion.span>
          <div className="flex items-center -space-x-1.5">
            {displayed?.map(({ id, name, logo }) => (
              <motion.div
                key={id}
                variants={item}
                className="size-4 overflow-hidden rounded-full border border-background flex-shrink-0 bg-background"
              >
                <img
                  src={logo}
                  alt={name}
                  className="w-full h-full object-contain"
                />
              </motion.div>
            ))}
          </div>
        </motion.button>
      </div>

      <ConnectorsModal open={open} onOpenChange={setOpen} />
    </>
  );
}
