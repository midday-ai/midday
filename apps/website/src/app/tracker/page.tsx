import type { Metadata } from "next";
import Image from "next/image";
import Projects from "public/product-projects.png";
import Slot from "public/product-slot.png";
import Tracker from "public/product-tracker.jpg";

export const metadata: Metadata = {
  title: "Time Tracker",
  description:
    "Track your projects time and gain insightful project overviews.",
};

export default function Page() {
  return (
    <div className="container mb-52">
      <div className="mb-40">
        <h1 className="mt-24 font-medium text-center text-[75px] md:text-[170px] mb-2 leading-none text-stroke">
          Time
        </h1>

        <h3 className="font-medium text-center text-[75px] md:text-[170px] mb-2 leading-none">
          Tracker
        </h3>

        <div className="flex items-center flex-col text-center relative">
          <p className="text-lg mt-4 max-w-[600px]">
            Track your projects time and gain insightful project overviews.
          </p>
        </div>
      </div>

      <Image src={Tracker} quality={100} alt="Tracker" />

      <div className="flex items-center flex-col text-center relative mt-28">
        <div className="max-w-[600px]">
          <h4 className="font-medium text-xl md:text-2xl mb-4">
            Have an overview of whats going on
          </h4>
          <p className="text-[#878787] text-sm">
            Instead of using old docs or sheets, use the tracker when you are
            tracking your business time on a project. Share the results with
            your client or just keep an overview for your own sake.
          </p>
        </div>

        <Image
          src={Projects}
          quality={100}
          alt="Projects"
          className="mt-10 max-w-[834px] w-full"
        />

        <div className="mt-32 max-w-[600px]">
          <h4 className="font-medium text-xl md:text-2xl mb-4">
            Track all your projects
          </h4>
          <p className="text-[#878787] text-sm mb-10">
            Track multiple projects simultaneously, invite your whole team, and
            see what people are working on. Easily connect each project to your
            upcoming invoice.
          </p>
        </div>

        <Image
          src={Slot}
          quality={100}
          alt="Slot"
          className="mt-10 max-w-[400px] w-full"
        />
      </div>
    </div>
  );
}
