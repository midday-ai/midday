"use client";

import { Hero } from "@/components/hero";
import { SphereMask } from "@midday/ui/magic";
import Particles from "@midday/ui/magicui/particles";

export default function Page() {
  return (
    <>
      <Hero />

      <SphereMask />
      <Particles
        className="absolute inset-0 -z-10"
        quantity={50}
        ease={70}
        size={0.05}
        staticity={40}
        color={"#ffffff"}
      />
    </>
  );
}
