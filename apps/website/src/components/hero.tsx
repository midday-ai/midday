import { Button } from "@midday/ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <section className="text-center mt-20 items-center flex flex-col">
      <Button
        variant="outline"
        className="rounded-full border-border flex space-x-2 items-center"
      >
        <span>Announcing our public beta</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={12}
          height={12}
          fill="none"
        >
          <path
            fill="currentColor"
            d="M8.783 6.667H.667V5.333h8.116L5.05 1.6 6 .667 11.333 6 6 11.333l-.95-.933 3.733-3.733Z"
          />
        </svg>
      </Button>

      <h1 className="text-6xl font-medium mt-6">Run your business smarter.</h1>

      <p className="mt-8 text-[#707070]">
        Integer quis vestibulum lorem. Curabitur consectetur nulla nec justo
        <br />
        congue mattis. Nulla tincidunt ante eros, nec interdum dui varius quis.
      </p>

      <div className="mt-8">
        <div className="flex items-center space-x-4">
          <Link href="/talk-to-us">
            <Button
              variant="outline"
              className="border border-primary h-12 px-6"
            >
              Talk to us
            </Button>
          </Link>

          <a href="https://app.midday.ai">
            <Button className="h-12 px-5">Get Early Access</Button>
          </a>
        </div>
      </div>

      <p className="text-xs text-[#707070] mt-6">No credit card required.</p>
    </section>
  );
}
