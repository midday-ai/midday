"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
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

export function ChatExamples({ onSubmit }) {
  const ref = useRef(undefined);
  const { events } = useDraggable(ref);

  const totalLength = chatExamples.reduce((accumulator, currentString) => {
    return accumulator + currentString.title.length * 8.2 + 50;
  }, 0);

  return (
    <div
      className="absolute z-10 bottom-[100px] left-0 right-0 overflow-scroll scrollbar-hide cursor-grabbing"
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
            key={example.title}
            type="button"
            onClick={() => onSubmit(example.title)}
          >
            <motion.li
              variants={itemVariant}
              className="font-mono text-[#878787] text-xs dark:bg-[#1D1D1D] bg-white px-3 py-2 rounded-full cursor-default"
            >
              {example.title}
            </motion.li>
          </button>
        ))}
      </motion.ul>
    </div>
  );
}
