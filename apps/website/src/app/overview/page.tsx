import type { Metadata } from "next";
import Image from "next/image";
import Overview from "public/product-overview.jpg";

export const metadata: Metadata = {
  title: "Financial Overview",
};

export default function Page() {
  return (
    <div className="container">
      <div className="mb-40">
        <h1 className="mt-24 font-medium text-center text-[100px] md:text-[170px] mb-2 leading-none text-stroke">
          Financial
        </h1>

        <h3 className="font-medium text-center text-[100px] md:text-[170px] mb-2 leading-none">
          Overview
        </h3>

        <div className="flex items-center flex-col text-center relative">
          <p className="text-lg mt-4 max-w-[600px]">
            Get real-time insight into your business's financial state. Keep
            track of your spending, income and overall financial health.
          </p>
        </div>
      </div>

      <Image src={Overview} quality={100} alt="Overview" />
    </div>
  );
}
