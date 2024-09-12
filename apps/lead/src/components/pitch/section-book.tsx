import { Button } from "@/components/ui/button";
import Link from "next/link";
import CalEmbed from "../cal-embed";

export function SectionBook() {
  return (
    <div className="min-h-screen relative w-screen">
      <div className="absolute left-4 right-4 md:left-8 md:right-8 top-4 flex justify-between text-lg">
        <span>Book a meeting</span>
        <Link href="https://app-business.solomon-ai.app">
          <Button variant="ghost" className="rounded-2xl font-bold">Sign up</Button>
        </Link>
      </div>
      <div className="flex flex-col min-h-screen justify-center container">
        <div className="h-[400px] md:h-[600px] px-4 md:px-0 text-center flex flex-col items-center justify-center">
          <CalEmbed/>
        </div>
      </div>
    </div>
  );
}
