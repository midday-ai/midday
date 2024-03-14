"use client";

// Credit: https://buildui.com/recipes/magnified-dock

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
  },
  {
    id: "contacts",
    icon: require("public/dock/contacts.png"),
  },
  {
    id: "midday",
    icon: require("public/dock/midday.png"),
  },
  {
    id: "cal",
    icon: require("public/dock/cal.png"),
  },
  {
    id: "notion",
    icon: require("public/dock/notion.png"),
  },
  {
    id: "discord",
    icon: require("public/dock/discord.png"),
  },
];

const Component = React.forwardRef((props, ref) => (
  <Image {...props} ref={ref} />
));

const MotionComponent = motion(Component);

export function Dock() {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="mx-auto flex h-16 items-end gap-4 rounded-2xl bg-background px-4 pb-3 border border-[#707070]"
    >
      {apps.map((app) => (
        <AppIcon mouseX={mouseX} key={app.id} src={app.icon} />
      ))}
    </motion.div>
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
      width={50}
      height={50}
      alt=""
      quality={100}
      ref={ref}
      style={{ width }}
      className="aspect-square rounded-lg"
    />
  );
}
