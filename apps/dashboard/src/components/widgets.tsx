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
import { AccountBalance } from "./widgets/account-balance";
import { Inbox } from "./widgets/inbox";
import { Insights } from "./widgets/insights";
import { Tracker } from "./widgets/tracker";

type Props = {
  disabled: boolean;
  initialPeriod: any;
  searchParams: any;
};

export const initialWidgetsVisibility = {
  insights: true,
  spending: true,
  tracker: true,
  inbox: false,
  transactions: false,
};

export function Widgets({ disabled, initialPeriod, searchParams }: Props) {
  const items = [
    <Insights key="insights" />,
    <Spending
      disabled={disabled}
      initialPeriod={initialPeriod}
      key="spending"
    />,
    <Tracker key="tracker" date={searchParams?.date} hideDaysIndicators />,
    <Transactions key="transactions" disabled={disabled} />,
    <Inbox key="inbox" disabled={disabled} />,
    <AccountBalance key="account-balance" />,
  ];

  return (
    <Carousel
      className="flex flex-col"
      opts={{
        align: "start",
      }}
    >
      <div className="ml-auto">
        <CarouselPrevious className="static p-0 border-none hover:bg-transparent" />
        <CarouselNext className="static p-0 border-none hover:bg-transparent" />
      </div>

      <CarouselContent className="-ml-[20px] 2xl:-ml-[40px]">
        {items.map((item, idx) => {
          return (
            <CarouselItem
              className="lg:basis-1/2 xl:basis-1/3 3xl:basis-1/4 pl-[20px] 2xl:pl-[40px]"
              key={idx.toString()}
            >
              {item}
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
}
