import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/utils";
import Link from "next/link";

export function CTAButtons({ dark }) {
  return (
    <div className="flex items-center space-x-4">
      <Link href="/talk-to-us">
        <Button
          variant="outline"
          className={cn(
            "border border-primary h-12 px-6",
            dark && "border-white text-white"
          )}
        >
          Talk to us
        </Button>
      </Link>

      <a href="https://app.midday.ai">
        <Button
          className={cn(
            "h-11 px-5",
            dark && "bg-white text-black hover:bg-white/80"
          )}
        >
          Get Early Access
        </Button>
      </a>
    </div>
  );
}
