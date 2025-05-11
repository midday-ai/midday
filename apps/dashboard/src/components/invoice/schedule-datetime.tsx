"use client";

import { Calendar } from "@/components/ui/calendar";
import { useTRPC } from "@/trpc/client";
import { DateTimePicker } from "@midday/ui/date-time-picker";
import { Input } from "@midday/ui/input";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useFormContext } from "react-hook-form";

export function ScheduleDateTime() {
  const trpc = useTRPC();
  const { watch, setValue } = useFormContext();

  const scheduledAt = watch("scheduled_at");

  // TODO: Update current scheduler
  //   const updateScheduler = useMutation(
  //     trpc.invoice.updateScheduler.mutationOptions(),
  //   );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    console.log(value);

    setValue("scheduled_at", value, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        key="schedule-datetime"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <DateTimePicker />
      </motion.div>
    </AnimatePresence>
  );
}
