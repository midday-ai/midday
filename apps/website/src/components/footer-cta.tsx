import { Button } from "@midday/ui/button";
import Link from "next/link";

export function FooterCTA() {
  return (
    <div className="border rounded-2xl container text-center px-24 py-12 mb-32 mt-24 flex items-center flex-col bg-[#121212]">
      <h3 className="text-8xl font-medium">Stress free by midday.</h3>
      <p className="text-[#878787] mt-6">
        Integer quis vestibulum lorem. Curabitur consectetur nulla nec justo
        congue
        <br />
        mattis. Nulla tincidunt ante eros, nec interdum dui varius quis.
      </p>

      <div className="flex items-center space-x-4 mt-10 mb-8">
        <Link href="/talk-to-us">
          <Button variant="outline" className="border border-white h-12 px-6">
            Talk to us
          </Button>
        </Link>
        <Button className="h-11 px-5">Get Started</Button>
      </div>
    </div>
  );
}
