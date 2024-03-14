import { Hero } from "@/components/hero";
import { Screens } from "@/components/screens";
import { SectionOne } from "@/components/section-one";
import { SectionTwo } from "@/components/section-two";
import { SectionFive } from "./section-five";
import { SectionFour } from "./section-four";
import { SectionThree } from "./section-three";

export function StartPage() {
  return (
    <>
      <Hero />
      <Screens />
      <SectionOne />
      <SectionTwo />
      <SectionThree />
      <SectionFour />
      <SectionFive />
    </>
  );
}
