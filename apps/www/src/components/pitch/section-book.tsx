import Link from "next/link";
import { Button } from "@midday/ui/button";

export function SectionBook() {
  return (
    <div className="relative min-h-screen w-screen">
      <div className="absolute left-4 right-4 top-4 flex justify-between text-lg md:left-8 md:right-8">
        <span>Book a meeting</span>
        <Link href="https://app-business.solomon-ai.app">
          <Button variant="outline">Sign up</Button>
        </Link>
      </div>
      <div className="container flex min-h-screen flex-col justify-center p-[5%]">
        <div className="flex h-[400px] flex-col items-center justify-center px-4 text-center md:h-[600px] md:px-0">
          <h2 className="text-2xl">Contact us</h2>
          <a href="mailto:support@solomon-ai.app">yoanyomba@solomon-ai.co</a>
        </div>

        <div className="mt-10 flex justify-center md:mt-0">
          <a
            href="https://github.com/SolomonAIEngineering/orbitkit"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" className="font-normal">
              Proudly Open Source
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
