"use client";

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from "framer-motion";
import { cn } from "../utils";

export type TextMorphProps = {
  children: string;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  variants?: Variants;
  transition?: Transition;
};

export function TextMorph({
  children,
  as: Component = "p",
  className,
  style,
  variants,
  transition,
}: TextMorphProps) {
  const defaultVariants: Variants = {
    initial: { opacity: 0, y: 4, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -4, filter: "blur(4px)" },
  };

  const defaultTransition: Transition = {
    duration: 0.3,
    ease: "easeOut",
  };

  return (
    <Component
      className={cn("relative overflow-hidden", className)}
      style={style}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={children}
          className="inline-block whitespace-nowrap"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants || defaultVariants}
          transition={transition || defaultTransition}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </Component>
  );
}
