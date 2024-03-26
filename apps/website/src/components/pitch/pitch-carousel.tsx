"use client";

import { SectionFive } from "@/components/pitch/section-five";
import { SectionFour } from "@/components/pitch/section-four";
import { SecitonOne } from "@/components/pitch/section-one";
import { SecitonThree } from "@/components/pitch/section-three";
import { SecitonTwo } from "@/components/pitch/section-two";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@midday/ui/carousel";
import { useEffect, useState } from "react";

export function PitchCarusel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <Carousel className="w-full h-full relative" setApi={setApi}>
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
      </CarouselContent>

      <div className="fixed flex justify-center left-0 bottom-5 w-full">
        <div className="h-12 w-[400px] flex justify-between">
          <button
            type="button"
            onClick={() => {
              api.scrollPrev();
            }}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => {
              api.scrollNext();
            }}
          >
            Next
          </button>
        </div>
      </div>
    </Carousel>
  );
}
