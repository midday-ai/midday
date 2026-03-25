"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const COLS = 5;
const MAX = 5;

function randomHeights() {
  return Array.from(
    { length: COLS },
    () => Math.floor(Math.random() * MAX) + 1,
  );
}

export function ChartLoadingOverlay() {
  const [heights, setHeights] = useState([2, 4, 3, 5, 3]);

  useEffect(() => {
    setHeights(randomHeights());
    const id = setInterval(() => setHeights(randomHeights()), 800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-center h-full -mt-5">
      <div className="flex items-end gap-[1px]">
        {heights.map((h, c) => (
          <div
            key={c}
            className="w-[3px] relative"
            style={{ height: MAX * 2 + (MAX - 1) }}
          >
            <div className="absolute bottom-0 left-0 flex flex-col-reverse gap-[1px]">
              <AnimatePresence initial={false}>
                {Array.from({ length: h }, (_, r) => (
                  <motion.div
                    key={r}
                    className="w-[2px] h-[2px] bg-primary"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    exit={{ scaleY: 0 }}
                    style={{ originY: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      mass: 0.5,
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
