import type { Metadata } from "next";
import Image from "next/image";
import signature from "public/email/signature-dark.png";
import founders from "public/founders.png";

export const metadata: Metadata = {
  title: "Story",
  description: "This is why we’re building Midday.",
};

export default function Page() {
  return (
    <div className="container max-w-[750px]">
      <h1 className="mt-24 font-medium text-center text-5xl mb-16 leading-snug">
        This is why we’re building <br />
        Midday.
      </h1>

      <h3 className="font-medium text-xl mb-2">Problem</h3>
      <p className="text-[#878787] mb-8">
        After years of running our own businesses, we've always felt something
        was missing, especially when it came to the mundane tasks. Your monthly
        routine typically involves tracking time, sending invoices, collecting
        receipts, and organizing documents. All which are scattered across
        various platforms. We've observed that these tools are often provided by
        large industry giants that struggle to adapt and innovate quickly.
      </p>

      <h3 className="font-medium text-xl mb-2">Solution</h3>
      <p className="text-[#878787] mb-8">
        So, we asked ourselves, why not create one comprehensive tool for all
        these tasks? Inspired by companies like Notion that revolutionized
        all-in-one tools, we embarked on developing an all-in-one business OS.
        Our goal is to help entrepreneurs gain deeper business insights,
        streamline tedious tasks, and serve as a bridge between you and your
        accountant, allowing you to focus on the enjoyable aspects of your work.
      </p>

      <h3 className="font-medium text-xl mb-2">Open source</h3>
      <p className="text-[#878787] mb-12">
        We've always admired companies that prioritize transparency and
        collaboration with users to build the best possible product. Whether
        it's through 15-minute user calls, building in public, or open-sourcing
        our system, these are values we hold dear and will continue to uphold,
        regardless of how far or big we go.
      </p>

      <Image src={founders} width={800} height={514} alt="Pontus & Viktor" />

      <div className="mt-6 mb-8">
        <p className="text-sm text-[#878787] mb-2">Best regards, founders</p>
        <Image
          src={signature}
          alt="Signature"
          className="block w-[143px] h-[20px]"
        />
      </div>
    </div>
  );
}
