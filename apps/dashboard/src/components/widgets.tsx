import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@midday/ui/carousel";
import * as React from "react";
import { Spending } from "./charts/spending";
import { Transactions } from "./charts/transactions";
import { Inbox } from "./widgets/inbox";
import { Insights } from "./widgets/insights";
import { Tracker } from "./widgets/tracker";

export function Widgets({ disabled, initialPeriod, searchParams }) {
  return (
    <Carousel
      className="w-full flex flex-col"
      opts={{
        align: "start",
      }}
    >
      <div className="ml-auto">
        <CarouselPrevious className="static p-0 border-none hover:bg-transparent" />
        <CarouselNext className="static p-0 border-none hover:bg-transparent" />
      </div>

      <CarouselContent className="-ml-[40px]">
        <CarouselItem className="lg:basis-1/2 xl:basis-1/3 pl-[40px]">
          <Insights />
        </CarouselItem>
        <CarouselItem className="lg:basis-1/2 xl:basis-1/3 pl-[40px]">
          <Spending disabled={disabled} initialPeriod={initialPeriod} />
        </CarouselItem>
        <CarouselItem className="lg:basis-1/2 xl:basis-1/3 pl-[40px]">
          <Insights />
        </CarouselItem>
        <CarouselItem className="lg:basis-1/2 xl:basis-1/3 pl-[40px]">
          <Insights />
        </CarouselItem>
        <CarouselItem className="lg:basis-1/2 xl:basis-1/3 pl-[40px]">
          <Insights />
        </CarouselItem>
        <CarouselItem className="lg:basis-1/2 xl:basis-1/3 pl-[40px]">
          <div className="border aspect-square" />
        </CarouselItem>
        <CarouselItem className="lg:basis-1/2 xl:basis-1/3 pl-[40px]">
          <div className="border aspect-square" />
        </CarouselItem>
        <CarouselItem className="lg:basis-1/2 xl:basis-1/3 pl-[40px]">
          <div className="border aspect-square" />
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  );
}
