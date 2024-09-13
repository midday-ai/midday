"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
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
  const ref = useRef();
  const { events } = useDraggable(ref);

  const totalLength = chatExamples.reduce((accumulator, currentString) => {
    return accumulator + currentString.title.length * 8.2 + 50;
  }, 0);

  return (
    <div
      className="scrollbar-hide absolute bottom-[100px] left-0 right-0 z-10 cursor-grabbing overflow-scroll"
      {...events}
      ref={ref}
    >
      <motion.ul
        variants={listVariant}
        initial="hidden"
        animate="show"
        className="ml-4 flex items-center space-x-4"
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
              className="cursor-default rounded-full bg-[#1D1D1D] px-3 py-2 font-mono text-xs text-[#878787]"
            >
              {example.title}
            </motion.li>
          </button>
        ))}
      </motion.ul>
    </div>
  );
}
