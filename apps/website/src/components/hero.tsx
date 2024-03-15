import { CTAButtons } from "@/components/cta-buttons";
import { Button } from "@midday/ui/button";

export function Hero() {
  return (
    <section className="text-center mt-20 items-center flex flex-col">
      <Button variant="outline" className="rounded-full">
        Announcing our public beta
      </Button>

      <h1 className="text-6xl font-medium mt-6">Run your business smarter.</h1>

      <p className="mt-8 text-[#707070]">
        Integer quis vestibulum lorem. Curabitur consectetur nulla nec justo
        <br />
        congue mattis. Nulla tincidunt ante eros, nec interdum dui varius quis.
      </p>

      <div className="mt-8">
        <CTAButtons />
      </div>

      <p className="text-xs text-[#707070] mt-6">No credit card required.</p>
    </section>
  );
}
