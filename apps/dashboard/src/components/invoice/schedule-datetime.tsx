"use client";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@midday/ui/input";
import { AnimatePresence, motion } from "framer-motion";

export function ScheduleDateTime() {
  return (
    <AnimatePresence>
      <motion.div
        key="schedule-datetime"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <Input type="datetime-local" className="w-[200px]" />
      </motion.div>
    </AnimatePresence>
  );
}
