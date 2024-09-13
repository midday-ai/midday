"use client";

import { setViewCount } from "@/actions/set-view-count";
import { SectionBook } from "@/components/pitch/section-book";
import { SectionDemo } from "@/components/pitch/section-demo";
import { SectionNext } from "@/components/pitch/section-next";
import { SectionProblem } from "@/components/pitch/section-problem";
import { SectionSolution } from "@/components/pitch/section-solution";
import { SectionStart } from "@/components/pitch/section-start";
import { SectionSubscription } from "@/components/pitch/section-subscription";
import { SectionTeam } from "@/components/pitch/section-team";
import { SectionTraction } from "@/components/pitch/section-traction";
import { SectionVision } from "@/components/pitch/section-vision";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useEffect, useRef, useState } from "react";
import { CarouselToolbar } from "./carousel-toolbar";
import { SectionCustomerProblem } from "./sections/section-customer-problem";
import { SectionPart0HowMoneyFlowsThroughTheBusiness } from "./sections/section-part-0-how-money-flows-through-the-business";
import { SectionPart1PayrollProblem } from "./sections/section-part-1-payroll-problem";
import { SectionPart3CashflowExpenseManagement } from "./sections/section-part-3-cashflow-expense-management";
import { SectionPart4SupplyChain } from "./sections/section-part-4-supply-chain";

export function PitchCarousel() {
  const [views, setViews] = useState(0);
  const called = useRef(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    async function fetchViewsCount() {
      try {
        // const data = await setViewCount("pitch");
        // setViews(data);
        setViews(18000);
      } catch {}
    }

    if (!called.current) {
      fetchViewsCount();
      called.current = true;
    }
  }, [called.current]);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <Carousel className="w-full min-h-full relative" setApi={setApi}>
      <CarouselContent>
        <CarouselItem>
          <SectionStart />
        </CarouselItem>
        <CarouselItem>
          <SectionCustomerProblem />
        </CarouselItem>
        <CarouselItem>
          <SectionPart0HowMoneyFlowsThroughTheBusiness />
        </CarouselItem>
        <CarouselItem>
          <SectionPart1PayrollProblem />
        </CarouselItem>
        {/* <CarouselItem>
          <SectionDemo playVideo={current === 4} />
        </CarouselItem> */}
        {/* <CarouselItem>
          <SectionTraction />
        </CarouselItem> */}
        <CarouselItem>
          <SectionPart3CashflowExpenseManagement />
        </CarouselItem>
        {/* <CarouselItem>
          <SectionPart4SupplyChain />
        </CarouselItem> */}
        <CarouselItem>
          <SectionVision />
        </CarouselItem>
        {/* <CarouselItem>
          <SectionNext />
        </CarouselItem> */}
        <CarouselItem>
          <SectionBook />
        </CarouselItem>
      </CarouselContent>

      <CarouselToolbar views={views} />
    </Carousel>
  );
}
