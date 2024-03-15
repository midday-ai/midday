import { Button } from "@midday/ui/button";
import Link from "next/link";

export function CTAButtons() {
  return (
    <div className="flex items-center space-x-4">
      <Link href="/talk-to-us">
        <Button variant="outline" className="border border-white h-12 px-6">
          Talk to us
        </Button>
      </Link>
      <Button className="h-11 px-5">Get Started</Button>
    </div>
  );
}
