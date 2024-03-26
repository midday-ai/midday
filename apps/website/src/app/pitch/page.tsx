import { SectionFive } from "@/components/pitch/section-five";
import { SectionFour } from "@/components/pitch/section-four";
import { SecitonOne } from "@/components/pitch/section-one";
import { SecitonThree } from "@/components/pitch/section-three";
import { SecitonTwo } from "@/components/pitch/section-two";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pitch | Midday",
};

export default function Page() {
  return (
    <div className="w-full bg-[#0C0C0C] flex flex-col">
      <SecitonOne />
      <SecitonTwo />
      <SecitonThree />
      <SectionFour />
      <SectionFive />
    </div>
  );
}
