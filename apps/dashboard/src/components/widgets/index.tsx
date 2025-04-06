import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@midday/ui/carousel";
import * as React from "react";
import { Assistant } from "./assistant";
import { Invoice } from "./invoice";
import { WidgetsNavigation } from "./navigation";
import { Spending } from "./spending";
import { Tracker } from "./tracker";
// import { Vault } from "./vault";
// import { Inbox } from "./inbox";
// import { Transactions } from "./widgets/transactions";
// import { AccountBalance } from "./widgets/account-balance";

type Props = {
  disabled: boolean;
};

export async function Widgets({ disabled }: Props) {
  const items = [
    <Assistant key="assistant" />,
    <Spending disabled={disabled} key="spending" />,
    <Invoice key="invoice" />,
    <Tracker key="tracker" />,
    // <Transactions key="transactions" disabled={disabled} />,
    // <Inbox key="inbox" disabled={disabled} />,
    // <AccountBalance key="account-balance" />,
    // <Vault key="vault" />,
  ];

  return (
    <Carousel
      className="flex flex-col"
      opts={{
        align: "start",
        watchDrag: false,
      }}
    >
      <WidgetsNavigation />
      <div className="ml-auto hidden md:flex">
        <CarouselPrevious className="static p-0 border-none hover:bg-transparent" />
        <CarouselNext className="static p-0 border-none hover:bg-transparent" />
      </div>

      <CarouselContent className="-ml-[20px] 2xl:-ml-[40px] flex-col md:flex-row space-y-6 md:space-y-0">
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
