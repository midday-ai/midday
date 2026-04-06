"use client";

import { cn } from "@midday/ui/cn";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

export type TextMorphProps = {
  children: string;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  transition?: Transition;
  preserveSpace?: string | string[];
};

export function TextMorph({
  children,
  as: Component = "p",
  className,
  style,
  transition,
  preserveSpace,
}: TextMorphProps) {
  const measureRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [currentWidth, setCurrentWidth] = useState<number | null>(null);
  const initialTextRef = useRef(children);
  const characters = useMemo(() => {
    return children.split("").map((char, index) => ({
      id: `${children}-${char}-${index}`,
      label: char === " " ? "\u00A0" : char,
    }));
  }, [children]);

  const labelsToMeasure = useMemo(() => {
    if (!preserveSpace) {
      return [children];
    }

    const labels = Array.isArray(preserveSpace)
      ? preserveSpace
      : [preserveSpace];
    return Array.from(new Set([...labels, children]));
  }, [children, preserveSpace]);

  useLayoutEffect(() => {
    if (children === initialTextRef.current && currentWidth === null) {
      return;
    }

    const nextWidth =
      measureRefs.current[
        labelsToMeasure.indexOf(children)
      ]?.getBoundingClientRect().width ?? 0;

    if (nextWidth > 0) {
      setCurrentWidth(nextWidth);
    }
  }, [children, labelsToMeasure, currentWidth]);

  const defaultTransition: Transition = {
    type: "spring",
    stiffness: 220,
    damping: 24,
    mass: 0.7,
  };

  return (
    <Component
      className={cn(
        "relative inline-flex justify-center whitespace-nowrap",
        className,
      )}
      aria-label={children}
      style={{
        ...style,
        width: currentWidth ? `${currentWidth}px` : style?.width,
        transition: "width 420ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div
        className="absolute inset-0 invisible pointer-events-none"
        aria-hidden="true"
      >
        {labelsToMeasure.map((label, index) => (
          <span
            key={label}
            ref={(element) => {
              measureRefs.current[index] = element;
            }}
            className="absolute left-0 top-0 whitespace-nowrap"
          >
            {label}
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={children}
          className="inline-flex justify-center"
          initial={{ opacity: 0, y: "0.18em", filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: "-0.14em", filter: "blur(6px)" }}
          transition={transition || defaultTransition}
        >
          {characters.map((character, index) => (
            <motion.span
              key={character.id}
              className="inline-block"
              aria-hidden="true"
              initial={{ opacity: 0, y: "0.14em" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "-0.1em" }}
              transition={{
                duration: 0.22,
                ease: [0.22, 1, 0.36, 1],
                delay: index * 0.012,
              }}
            >
              {character.label}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </Component>
  );
}
