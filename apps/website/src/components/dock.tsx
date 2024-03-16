"use client";

// Credit: https://buildui.com/recipes/magnified-dock

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import {
  type MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import React from "react";
import { useRef } from "react";

const apps = [
  {
    id: "finder",
    icon: require("public/dock/finder.png"),
    name: "Finder",
  },
  // {
  //   id: "contacts",
  //   icon: require("public/dock/contacts.png"),
  // },
  {
    id: "midday",
    icon: require("public/dock/midday.png"),
    name: "Midday",
  },
  {
    id: "cal",
    icon: require("public/dock/cal.png"),
    name: "Talk to us",
  },
  {
    id: "notion",
    icon: require("public/dock/notion.png"),
    name: "Roadmap",
  },
  {
    id: "discord",
    icon: require("public/dock/discord.png"),
    name: "Join the comunity",
  },
  {
    id: "github",
    icon: require("public/dock/github.png"),
    name: "Repository",
  },
];

const Component = React.forwardRef((props, ref) => (
  <Image {...props} ref={ref} />
));

const MotionComponent = motion(Component);

export function Dock() {
  const mouseX = useMotionValue(Infinity);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="mx-auto flex h-[58px] items-end gap-2 rounded-2xl px-2 pb-2 border dark:border-[#707070]"
      >
        {apps.map((app) => {
          return (
            <Tooltip key={app.id}>
              <TooltipTrigger>
                <AppIcon mouseX={mouseX} src={app.icon} />
              </TooltipTrigger>
              <TooltipContent className="py-1 px-3 rounded-sm" sideOffset={8}>
                <p className="text-xs">{app.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </motion.div>
    </TooltipProvider>
  );
}

function AppIcon({ mouseX, src }: { mouseX: MotionValue }) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-100, 0, 100], [40, 55, 40]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <MotionComponent
      src={src}
      width={60}
      height={60}
      alt=""
      quality={100}
      ref={ref}
      style={{ width }}
      className="aspect-square rounded-lg"
    />
  );
}
