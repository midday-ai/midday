"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

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
      className="md:mt-[250px] relative md:min-h-[375px]"
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
      <div className="hero-slide-up flex flex-col mt-[240px]">
        <Link href="/updates/assistant">
          <Button
            variant="outline"
            className="rounded-full border-border flex space-x-2 items-center"
          >
            <span className="font-mono text-xs">
              Introducing Midday Assistant v1
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

        <h1 className="text-[30px] md:text-[90px] font-medium mt-6 leading-none">
          Run your
          <br /> business smarter.
        </h1>

        <p className="mt-4 md:mt-6 max-w-[600px]">
          An all-in-one tool for freelancers, contractors, consultants, and
          micro businesses to monitor financial health, time-track projects,
          store files, and send invoices.
        </p>

        <div className="mt-8">
          <div className="flex items-center space-x-4">
            <Link href="/talk-to-us">
              <Button
                variant="outline"
                className="border border-primary h-12 px-6"
              >
                Talk to us
              </Button>
            </Link>

            <a href="https://app.midday.ai">
              <Button className="h-12 px-5">Get Early Access</Button>
            </a>
          </div>
        </div>

        <p className="text-xs text-[#707070] mt-8 font-mono">
          Used by over{" "}
          <Link href="/open-startup">
            <span className="underline">3200+</span>
          </Link>{" "}
          businesses.
        </p>
      </div>

      <div className="scale-50 md:scale-100 -top-[500px] -right-[380px] pointer-events-none transform-gpu grayscale md:flex lg:animate-[open-scale-up-fade_1.5s_ease-in-out] absolute md:-right-[200px] xl:-right-[100px] w-auto h-auto md:-top-[200px]">
        <div className={cn(isPlaying && "animate-webgl-scale-in-fade")}>
          {isPlaying && (
            <Spline
              scene="https://prod.spline.design/HAMm7mSDmXF4PVqs/scene.splinecode"
              style={{
                width: "auto",
                height: "auto",
                background: "transparent",
              }}
            />
          )}
        </div>
      </div>
    </motion.section>
  );
}
