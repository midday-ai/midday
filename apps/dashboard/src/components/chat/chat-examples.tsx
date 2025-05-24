"use client";

import { motion } from "framer-motion";
import { useMemo, useRef } from "react";
import { useDraggable } from "react-use-draggable-scroll";
import { chatExamples } from "./examples";

const listVariant = {
  hidden: { y: 45, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.08,
    },
  },
};

const itemVariant = {
  hidden: { y: 45, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

type Props = {
  handleSubmit: (example: string) => void;
};

export function ChatExamples({ handleSubmit }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  // @ts-expect-error: react-use-draggable-scroll expects a MutableRefObject<HTMLElement>
  const { events } = useDraggable(ref);

  const totalLength = chatExamples.reduce((accumulator, currentString) => {
    return accumulator + currentString.length * 8.2 + 20;
  }, 0);

  return (
    <div
      className="absolute z-10 bottom-[100px] left-0 right-0 overflow-scroll scrollbar-hide cursor-grabbing hidden md:block"
      {...events}
      ref={ref}
    >
      <motion.ul
        variants={listVariant}
        initial="hidden"
        animate="show"
        className="flex space-x-4 ml-4 items-center"
        style={{ width: `${totalLength}px` }}
      >
        {chatExamples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => handleSubmit(example)}
          >
            <motion.li
              variants={itemVariant}
              className="font-mono text-[#878787] bg-[#F2F1EF] text-xs dark:bg-[#1D1D1D] px-3 py-2 rounded-full cursor-default"
            >
              {example}
            </motion.li>
          </button>
        ))}
      </motion.ul>
    </div>
  );
}
