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
        <CarouselItem className="basis-1/3 pl-[40px]">
          <Spending disabled={disabled} initialPeriod={initialPeriod} />
        </CarouselItem>
        <CarouselItem className="basis-1/3 pl-[40px]">
          <Transactions disabled={disabled} />
        </CarouselItem>
        <CarouselItem className="basis-1/3 pl-[40px]">
          <Tracker date={searchParams?.date} />
        </CarouselItem>
        <CarouselItem className="basis-1/3 pl-[40px]">
          <Inbox disabled={disabled} />
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  );
}
