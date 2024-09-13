import type { Metadata } from "next";
import Image from "next/image";
import Projects from "public/product-projects.png";
import Slot from "public/product-slot.png";
import Tracker from "public/product-tracker.jpg";

export const metadata: Metadata = {
  title: "Time Tracker",
};

export default function Page() {
  return (
    <div className="container mb-52">
      <div className="mb-40">
        <h1 className="text-stroke mb-2 mt-24 text-center text-[75px] font-medium leading-none md:text-[170px]">
          Time
        </h1>

        <h3 className="mb-2 text-center text-[75px] font-medium leading-none md:text-[170px]">
          Tracker
        </h3>

        <div className="relative flex flex-col items-center text-center">
          <p className="mt-4 max-w-[600px] text-lg">
            Track your projects time and gain insightful project overviews.
          </p>
        </div>
      </div>

      <Image src={Tracker} quality={100} alt="Tracker" />

      <div className="relative mt-28 flex flex-col items-center text-center">
        <div className="max-w-[600px]">
          <h4 className="mb-4 text-xl font-medium md:text-2xl">
            Have an overview of whats going on
          </h4>
          <p className="text-sm text-[#878787]">
            Instead of using old docs or sheets, use the tracker when you are
            tracking your business time on a project. Share the results with
            your client or just keep an overview for your own sake.
          </p>
        </div>

        <Image
          src={Projects}
          quality={100}
          alt="Projects"
          className="mt-10 w-full max-w-[834px]"
        />

        <div className="mt-32 max-w-[600px]">
          <h4 className="mb-4 text-xl font-medium md:text-2xl">
            Track all your projects
          </h4>
          <p className="mb-10 text-sm text-[#878787]">
            Track multiple projects simultaneously, invite your whole team, and
            see what people are working on. Easily connect each project to your
            upcoming invoice.
          </p>
        </div>

        <Image
          src={Slot}
          quality={100}
          alt="Slot"
          className="mt-10 w-full max-w-[400px]"
        />
      </div>
    </div>
  );
}
