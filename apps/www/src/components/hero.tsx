"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { motion } from "framer-motion";

import { Globe } from "./globe";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => null,
});

export function Hero() {
  const [isPlaying, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(true);
  }, []);

  return (
    <motion.section
      className="relative md:mt-[250px] md:min-h-[375px]"
      onViewportEnter={() => {
        if (!isPlaying) {
          setPlaying(true);
        }
      }}
      onViewportLeave={() => {
        if (isPlaying) {
          setPlaying(false);
        }
      }}
    >
      <div className="hero-slide-up mt-[240px] flex flex-col">
        <Link href="/updates/assistant">
          <Button
            variant="outline"
            className="flex items-center space-x-2 rounded-full border-border"
          >
            <span className="font-mono text-xs">
              Introducing Solomon AI Assistant
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={12}
              height={12}
              fill="none"
            >
              <path
                fill="currentColor"
                d="M8.783 6.667H.667V5.333h8.116L5.05 1.6 6 .667 11.333 6 6 11.333l-.95-.933 3.733-3.733Z"
              />
            </svg>
          </Button>
        </Link>

        <h1 className="mt-6 text-[30px] font-medium leading-none md:text-[90px]">
          A better way to act
          <br />
          on your finances
        </h1>

        <p className="mt-4 max-w-[600px] md:mt-6">
          We extract unknown relationships from your finances and help you act
          on them.
        </p>

        <div className="mt-8">
          <div className="flex items-center space-x-4">
            <Link href="/talk-to-us">
              <Button
                variant="outline"
                className="h-12 rounded-2xl border border-primary px-6"
              >
                Talk to us
              </Button>
            </Link>

            <a href="https://app-business.solomon-ai.app">
              <Button className="h-12 rounded-2xl px-5">
                Get Early Access
              </Button>
            </a>
          </div>
        </div>

        <p className="mt-8 font-mono text-xs text-[#707070]">
          Appreciated by{" "}
          <Link href="/open-startup" prefetch>
            <span className="underline">our</span>
          </Link>{" "}
          customers.
        </p>
      </div>

      <div className="pointer-events-none absolute -right-[380px] -top-[500px] h-auto w-auto scale-50 transform-gpu grayscale md:-right-[200px] md:-top-[200px] md:flex md:scale-100 lg:animate-[open-scale-up-fade_1.5s_ease-in-out] xl:-right-[100px]">
        <div className={cn(isPlaying && "animate-webgl-scale-in-fade")}>
          <Globe />
          {/* {isPlaying && (
            <Spline
              scene="https://prod.spline.design/HAMm7mSDmXF4PVqs/scene.splinecode"
              style={{
                width: "auto",
                height: "auto",
                background: "transparent",
              }}
            />
          )} */}
        </div>
      </div>
    </motion.section>
  );
}
