/* eslint-disable react/no-unescaped-entities */
"use client";

import { useRef } from "react";

import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useInView } from "framer-motion";

import TextShimmer from "@/components/magicui/text-shimmer";
import Link from "next/link";
import BenefitList from "./benefit-list";
import { ContactDoc } from "./contact-doc";
import { ValueProps } from "./value-props";

export function Hero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <>
      <section className="relative mx-auto mt-56 max-w-[80rem] px-6 text-center md:px-8">
        <Link
          href="/pitch"
          className="backdrop-filter-[12px] inline-flex h-7 items-center justify-between rounded-full border border-white/5 bg-black px-3 text-xs text-foreground dark:text-black transition-all ease-in hover:cursor-pointer hover:bg-white/20 group gap-1 translate-y-[-1rem] animate-fade-in"
        >
          <TextShimmer className="inline-flex items-center justify-center">
            <span>✨ PromptMD Case Study </span>{" "}
            <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
          </TextShimmer>
        </Link>
        <div className="flex flex-col items-center justify-center gap-y-[1%]">
          <h1 className="text-white bg-gradient-to-br from-white to-gray-400 bg-clip-text py-6 text-5xl font-medium leading-none tracking-tighter text-foreground text-balance sm:text-6xl md:text-7xl lg:text-8xl translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
            We will save your business
            <br className="hidden md:block" /> $50K In 1 Week, Free Of Charge
          </h1>
          <p className="mb-12 text-lg tracking-tight text-gray-400 md:text-xl text-balance translate-y-[-1rem] animate-fade-in [--animation-delay:400ms]">
            We will help you streamline operations, reduce costs, and increase
            profitability.
            <br className="hidden md:block" /> Get started today and see the
            savings.
          </p>
        </div>

        <div className="flex justify-center md:pt-[2%]">
          <ContactDoc />
        </div>

        <div className="flex justify-center md:py-[10%]">
          <ValueProps />
        </div>
      </section>
    </>
  );
}
