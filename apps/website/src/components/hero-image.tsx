"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import heroImage from "public/hero.png";
import { useState } from "react";

export function HeroImage() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute -right-[420px] -top-[100px]"
    >
      <div className="[transform:perspective(4101px)_rotateX(51deg)_rotateY(-13deg)_rotateZ(40deg)]">
        <Image
          src={heroImage}
          alt="Dashboard interface showing financial data and charts"
          width={1141}
          height={641}
          quality={100}
          priority
          onLoad={() => setIsLoaded(true)}
          className="border border-border [box-shadow:0px_80px_60px_0px_rgba(0,0,0,0.35),0px_35px_28px_0px_rgba(0,0,0,0.25),0px_18px_15px_0px_rgba(0,0,0,0.20),0px_10px_8px_0px_rgba(0,0,0,0.17),0px_5px_4px_0px_rgba(0,0,0,0.14),0px_2px_2px_0px_rgba(0,0,0,0.10)]"
        />
      </div>
    </motion.div>
  );
}
