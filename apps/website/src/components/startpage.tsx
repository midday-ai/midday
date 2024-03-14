import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Screens } from "@/components/screens";
import { SectionOne } from "@/components/section-one";
import { SectionTwo } from "@/components/section-two";

export function StartPage() {
  return (
    <>
      <Hero />
      <Screens />
      <SectionOne />
      <SectionTwo />
      <Footer />
    </>
  );
}
