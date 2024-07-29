"use client";

import { useI18n } from "@/locales/client";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import Spline from "@splinetool/react-spline";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Hero() {
  const [isPlaying, setPlaying] = useState(false);
  const t = useI18n();

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
        <Link href="/updates/public-beta">
          <Button
            variant="outline"
            className="rounded-full border-border flex space-x-2 items-center"
          >
            <span className="font-mono text-xs">{t("hero.announcment")}</span>
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
          {t("hero.headline")}
          <br />
          {t("hero.headline_2")}
        </h1>

        <p className="mt-4 md:mt-6 max-w-[600px] text-[#878787]">
          {t("hero.description")}
        </p>

        <div className="mt-8">
          <div className="flex items-center space-x-4">
            <Link href="/talk-to-us">
              <Button
                variant="outline"
                className="border border-primary h-12 px-6"
              >
                {t("hero.talkToUs")}
              </Button>
            </Link>

            <a href="https://app.midday.ai">
              <Button className="h-12 px-5">{t("hero.getStarted")}</Button>
            </a>
          </div>
        </div>

        <p className="text-xs text-[#707070] mt-8 font-mono">
          {t("hero.usedBy")}{" "}
          <Link href="/open-startup" prefetch>
            <span className="underline">5200+</span>
          </Link>{" "}
          {t("hero.usedBy_2")}
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
