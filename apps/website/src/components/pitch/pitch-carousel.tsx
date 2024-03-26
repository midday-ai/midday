"use client";

import { SectionBook } from "@/components/pitch/section-book";
import { SectionFive } from "@/components/pitch/section-five";
import { SectionFour } from "@/components/pitch/section-four";
import { SecitonOne } from "@/components/pitch/section-one";
import { SecitonThree } from "@/components/pitch/section-three";
import { SecitonTwo } from "@/components/pitch/section-two";
import { Carousel, CarouselContent, CarouselItem } from "@midday/ui/carousel";
import { CarouselToolbar } from "./carousel-toolbar";

export function PitchCarusel() {
  return (
    <Carousel className="w-full h-full relative">
      <CarouselContent>
        <CarouselItem>
          <SecitonOne />
        </CarouselItem>
        <CarouselItem>
          <SecitonTwo />
        </CarouselItem>
        <CarouselItem>
          <SecitonThree />
        </CarouselItem>
        <CarouselItem>
          <SectionFour />
        </CarouselItem>
        <CarouselItem>
          <SectionFive />
        </CarouselItem>
        <CarouselItem>
          <SectionBook />
        </CarouselItem>
      </CarouselContent>

      <CarouselToolbar />
    </Carousel>
  );
}
