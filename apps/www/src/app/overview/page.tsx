import type { Metadata } from "next";
import Image from "next/image";
import { Assistant } from "@/components/assistant";
import Overview from "public/product-overview.jpg";
import Spending from "public/product-spending.png";

export const metadata: Metadata = {
  title: "Financial Overview",
};

export default function Page() {
  return (
    <div className="container mb-52">
      <div className="mb-40">
        <h1 className="text-stroke mb-2 mt-24 text-center text-[75px] font-medium leading-none md:text-[170px]">
          Financial
        </h1>

        <h3 className="mb-2 text-center text-[75px] font-medium leading-none md:text-[170px]">
          Overview
        </h3>

        <div className="relative flex flex-col items-center text-center">
          <p className="mt-4 max-w-[600px] text-lg">
            Get real-time insight into your business's financial state. Keep
            track of your spending, income and overall financial health.
          </p>
        </div>
      </div>

      <Image src={Overview} quality={100} alt="Overview" />

      <div className="relative mt-28 flex flex-col items-center text-center">
        <div className="max-w-[600px]">
          <h4 className="mb-4 text-xl font-medium md:text-2xl">
            From revenue to spending
          </h4>
          <p className="text-sm text-[#878787]">
            The financial overview is there for your business when you feel that
            you don’t have enough insights about your company. See crucial
            numbers on how your company is doing, what you spent the most on
            last year or just keep track of your transactions.
          </p>
        </div>

        <Image
          src={Spending}
          quality={100}
          alt="Spending"
          className="mt-10 w-full max-w-[834px]"
        />

        <div className="mt-32 max-w-[550px]">
          <h4 className="mb-4 text-xl font-medium md:text-2xl">
            Use assistant to dive deeper
          </h4>
          <p className="text-sm text-[#878787] md:mb-10">
            Use the assistant to ask questions about your business's financials,
            all just one keystroke away.
          </p>
        </div>

        <div className="-mt-20 scale-[0.45] text-left md:mt-0 md:scale-100">
          <Assistant />
        </div>
      </div>
    </div>
  );
}
