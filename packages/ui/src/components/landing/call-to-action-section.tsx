"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { motion, useAnimation, useInView } from "framer-motion";
import {
  BarChart,
  BrainCircuit,
  ChevronRight,
  File,
  Globe,
  HeartHandshake,
  Lightbulb,
  Rss,
  Shield,
} from "lucide-react";

import { cn } from "../../utils";
import { buttonVariants } from "../button";
import Marquee from "../magicui/marquee";

/**
 * Interface for tile object
 */
interface Tile {
  icon: JSX.Element;
  bg: JSX.Element;
}

/**
 * Array of tiles with icons and background gradients
 */
const tiles: Tile[] = [
  {
    icon: <HeartHandshake className="size-full" />,
    bg: (
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-orange-600 via-rose-600 to-violet-600 opacity-70 blur-[20px] filter"></div>
    ),
  },
  {
    icon: <Globe className="size-full" />,
    bg: (
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-70 blur-[20px] filter"></div>
    ),
  },
  {
    icon: <File className="size-full" />,
    bg: (
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-emerald-600 opacity-70 blur-[20px] filter"></div>
    ),
  },
  {
    icon: <Shield className="size-full" />,
    bg: (
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 opacity-70 blur-[20px] filter"></div>
    ),
  },
  {
    icon: <Rss className="size-full" />,
    bg: (
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-orange-600 via-rose-600 to-violet-600 opacity-70 blur-[20px] filter"></div>
    ),
  },
  {
    icon: <BarChart className="size-full" />,
    bg: (
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-gray-600 via-gray-500 to-gray-400 opacity-70 blur-[20px] filter"></div>
    ),
  },
];

/**
 * Shuffles an array randomly
 * @param {T[]} array - Array to be shuffled
 * @returns {T[]} Shuffled array
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j]!, newArray[i]!];
  }
  return newArray;
}

/**
 * Card component props
 */
interface CardProps {
  icon: JSX.Element;
  bg: JSX.Element;
}

/**
 * Card component
 * @param {CardProps} props - The props for the Card component
 * @returns {JSX.Element} Rendered Card component
 */
const Card: React.FC<CardProps> = ({ icon, bg }) => {
  const id = useId();
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        transition: { delay: Math.random() * 2, ease: "easeOut", duration: 1 },
      });
    }
  }, [controls, inView]);

  return (
    <motion.div
      key={id}
      ref={ref}
      initial={{ opacity: 0 }}
      animate={controls}
      className={cn(
        "relative size-20 cursor-pointer overflow-hidden rounded-2xl border p-4",
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        "transform-gpu dark:bg-transparent dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
      )}
    >
      {icon}
      {bg}
    </motion.div>
  );
};

/**
 * CallToActionSection component
 * @returns {JSX.Element} Rendered CallToActionSection component
 */
export const CallToActionSection: React.FC<{
  title: string;
  description: string;
  children?: React.ReactNode;
}> = ({ title, description, children }) => {
  const [randomTiles1, setRandomTiles1] = useState<Tile[]>([]);
  const [randomTiles2, setRandomTiles2] = useState<Tile[]>([]);
  const [randomTiles3, setRandomTiles3] = useState<Tile[]>([]);
  const [randomTiles4, setRandomTiles4] = useState<Tile[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRandomTiles1(shuffleArray([...tiles]));
      setRandomTiles2(shuffleArray([...tiles]));
      setRandomTiles3(shuffleArray([...tiles]));
      setRandomTiles4(shuffleArray([...tiles]));
    }
  }, []);

  return (
    <section id="cta">
      <div className="py-14">
        <div className="flex w-full flex-col items-center justify-center">
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
            <MarqueeRows
              tiles1={randomTiles1}
              tiles2={randomTiles2}
              tiles3={randomTiles3}
              tiles4={randomTiles4}
            />
            <CTAContent title={title} description={description}>
              {children}
            </CTAContent>
            <BottomGradient />
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * MarqueeRows component props
 */
interface MarqueeRowsProps {
  tiles1: Tile[];
  tiles2: Tile[];
  tiles3: Tile[];
  tiles4: Tile[];
}

/**
 * MarqueeRows component
 * @param {MarqueeRowsProps} props - The props for the MarqueeRows component
 * @returns {JSX.Element} Rendered MarqueeRows component
 */
const MarqueeRows: React.FC<MarqueeRowsProps> = ({
  tiles1,
  tiles2,
  tiles3,
  tiles4,
}) => (
  <>
    <Marquee reverse className="-delay-[200ms] [--duration:10s]" repeat={5}>
      {tiles1.map((tile, idx) => (
        <Card key={idx} {...tile} />
      ))}
    </Marquee>
    <Marquee reverse className="[--duration:25s]" repeat={5}>
      {tiles2.map((tile, idx) => (
        <Card key={idx} {...tile} />
      ))}
    </Marquee>
    <Marquee reverse className="-delay-[200ms] [--duration:20s]" repeat={5}>
      {tiles1.map((tile, idx) => (
        <Card key={idx} {...tile} />
      ))}
    </Marquee>
    <Marquee reverse className="[--duration:30s]" repeat={5}>
      {tiles2.map((tile, idx) => (
        <Card key={idx} {...tile} />
      ))}
    </Marquee>
    <Marquee reverse className="-delay-[200ms] [--duration:20s]" repeat={5}>
      {tiles3.map((tile, idx) => (
        <Card key={idx} {...tile} />
      ))}
    </Marquee>
    <Marquee reverse className="[--duration:30s]" repeat={5}>
      {tiles4.map((tile, idx) => (
        <Card key={idx} {...tile} />
      ))}
    </Marquee>
  </>
);

/**
 * CTAContent component
 * @returns {JSX.Element} Rendered CTAContent component
 */
const CTAContent: React.FC<{
  title: string;
  description: string;
  children?: React.ReactNode;
}> = ({ title, description, children }) => (
  <div className="absolute z-10">
    <div className="mx-auto size-24 rounded-[2rem] border bg-white/10 p-3 shadow-2xl backdrop-blur-md dark:bg-black/10 lg:size-32">
      <Lightbulb className="mx-auto size-14 text-black dark:text-white lg:size-24" />
    </div>
    <div className="z-10 mt-4 flex flex-col items-center text-center text-primary">
      <h1 className="text-3xl font-bold lg:text-4xl">{title}</h1>
      <p className="mt-2">{description}</p>
      {children}
    </div>
    <div className="bg-backtround absolute inset-0 -z-10 rounded-full opacity-40 blur-xl dark:bg-background" />
  </div>
);

/**
 * BottomGradient component
 * @returns {JSX.Element} Rendered BottomGradient component
 */
const BottomGradient: React.FC = () => (
  <div className="to-backtround absolute inset-x-0 bottom-0 h-full bg-gradient-to-b from-transparent to-70% dark:to-background" />
);
