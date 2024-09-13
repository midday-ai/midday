import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Story",
};

export default function Page() {
  return (
    <div className="container max-w-[750px]">
      <h1 className="mb-16 mt-24 text-center text-5xl font-medium leading-snug">
        This is why we’re building <br />
        Solomon AI.
      </h1>

      <h3 className="mb-2 text-xl font-medium">Problem</h3>
      <p className="mb-8 text-[#878787]">
        In today&apos;s volatile economic landscape, financial instability looms
        over businesses, solopreneurs, and consumers alike. Unpredictable
        factors such as market fluctuations, payment delays, shifting rates, and
        seasonal demand swings can derail even the most carefully laid plans.
      </p>

      <h3 className="mb-2 text-xl font-medium">Solution</h3>
      <p className="mb-8 text-[#878787]">
        Solomon AI leverages cutting-edge AI and machine learning to conduct
        comprehensive financial stress tests and scenario simulations. By
        identifying potential vulnerabilities and opportunities, we help you
        craft robust strategies to navigate economic uncertainties and build
        lasting financial stability.
      </p>

      <h3 className="mb-2 text-xl font-medium">Building In Public</h3>
      <p className="mb-3 text-[#878787]">
        We&apos;ve always admired companies that prioritize transparency and
        collaboration with users to build the best possible product. Whether
        it&rsquo;s through 15-minute user calls or building in public, these are
        values we hold dear and will continue to uphold, regardless of how far
        or big we go.
      </p>
      <p className="mb-12 text-[#878787]">
        Join us in reshaping financial management - where AI meets human
        insight, and where your success is our priority.
      </p>

      <div className="mb-8 mt-6">
        <p className="text-mb mb-2 text-[#878787]">
          Empowering your financial future,
        </p>
        <p className="text-md mb-2 font-bold">Solomon AI Team</p>
      </div>
    </div>
  );
}
