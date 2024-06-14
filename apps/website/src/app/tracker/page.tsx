import type { Metadata } from "next";
import Image from "next/image";
import Tracker from "public/product-tracker.jpg";

export const metadata: Metadata = {
  title: "Time Tracker",
};

export default function Page() {
  return (
    <div className="container">
      <div className="mb-40">
        <h1 className="mt-24 font-medium text-center text-[100px] md:text-[170px] mb-2 leading-none text-stroke">
          Time
        </h1>

        <h3 className="font-medium text-center text-[100px] md:text-[170px] mb-2 leading-none">
          Tracker
        </h3>

        <div className="flex items-center flex-col text-center relative">
          <p className="text-lg mt-4 max-w-[600px]">
            Track your projects time and gain insightful project overviews.
          </p>
        </div>
      </div>

      <Image src={Tracker} quality={100} alt="Tracker" />
    </div>
  );
}
