"use client";

import Image from "next/image";
import { Assistant } from "@/components/assistant";
import { motion } from "framer-motion";
import keyboard from "public/keyboard.png";

export function Keyboard() {
  return (
    <div className="relative mb-[100px] text-left">
      <motion.div
        className="absolute -right-[175px] -top-[130px] z-20 bg-gradient-to-l from-[#0C0C0C] md:-right-[200px] md:-top-[90px] lg:-top-9 xl:-top-4"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="scale-[0.55] md:scale-[0.55] lg:scale-[0.7] xl:scale-[0.84]">
          <Assistant />
        </div>
      </motion.div>

      <div className="absolute bottom-[1px] left-[1px] right-[1px] top-[1px] z-[15] h-full w-[500px] bg-background/80 transition-all duration-200 ease-out" />

      <Image
        src={keyboard}
        alt="Download Solomon AI"
        width={1092}
        height={448}
        className="relative z-10"
        quality={100}
        priority
      />
    </div>
  );
}
