import { Button } from "@midday/ui/button";

export function Hero() {
  return (
    <section className="text-center mt-20">
      <Button variant="outline" className="rounded-full">
        Announcing our public beta
      </Button>

      <h1 className="text-6xl font-medium mt-6">Run your business smarter.</h1>

      <h3 className="mt-8">
        Integer quis vestibulum lorem. Curabitur consectetur nulla nec justo
        <br />
        congue mattis. Nulla tincidunt ante eros, nec interdum dui varius quis.
      </h3>
    </section>
  );
}
