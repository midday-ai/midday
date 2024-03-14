import { Button } from "@midday/ui/button";

export function Hero() {
  return (
    <section className="text-center mt-20 items-center flex flex-col">
      <Button variant="outline" className="rounded-full">
        Announcing our public beta
      </Button>

      <h1 className="text-6xl font-medium mt-6">Run your business smarter.</h1>

      <h3 className="mt-8 text-[#707070]">
        Integer quis vestibulum lorem. Curabitur consectetur nulla nec justo
        <br />
        congue mattis. Nulla tincidunt ante eros, nec interdum dui varius quis.
      </h3>

      <div className="flex items-center space-x-4 mt-8">
        <Button variant="outline" className="border border-white h-12 px-6">
          Talk to us
        </Button>
        <Button className="h-11 px-5">Start for free</Button>
      </div>

      <p className="text-xs text-[#707070] mt-8">No credit card required.</p>
    </section>
  );
}
