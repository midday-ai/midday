"use client";

import { motion } from "framer-motion";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";

import "../../styles/assistant-button.css";

import { cn } from "../../utils/cn";

export interface AssistantButtonProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  callback?: () => void;
  className?: string;
}

const AssistantButton: React.FC<AssistantButtonProps> = ({
  callback,
  className,
}) => {
  return (
    <div className={cn(className)}>
      <div className={cn("absolute bottom-0 right-0 pb-10 pr-10")}>
        <motion.div className="text-[70px] duration-500 ease-in-out hover:scale-105 hover:cursor-pointer">
          <div className="rainbow-container">
            <div className="green"></div>
            <div className="pink"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AssistantButton;
