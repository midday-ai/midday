import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";

export function CtaButton({ children }: { children: React.ReactNode }) {
  return (
    <Link href="https://app.midday.ai">
      <Button
        className="mt-12 h-11 space-x-2 items-center py-2"
        variant="outline"
      >
        <span>{children}</span>
        <Icons.ArrowOutward />
      </Button>
    </Link>
  );
}
