import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private beta | Midday",
};

export default function Closed() {
  return (
    <div>
      <div className="absolute left-5 top-4 md:left-10 md:top-10">
        <Link href="https://midday.ai">
          <Icons.Logo />
        </Link>
      </div>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          <div className="flex w-full flex-col relative">
            <div className="w-[2px] h-[2px] bg-primary rounded-full absolute -top-[20px] -left-[100px] animate-[pulse_2s_ease-in-out_infinite]" />
            <div className="w-[3px] h-[3px] bg-primary rounded-full absolute -top-[70px] left-[5%] animate-[pulse_2s_ease-in-out_infinite]" />
            <div
              className="w-[5px] h-[5px] bg-primary rounded-full absolute -top-[120px] left-[80px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "500ms" }}
            />
            <div
              className="w-[5px] h-[5px] bg-primary rounded-full absolute -top-[80px] left-[180px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-[3px] h-[3px] bg-[#FFD02B] rounded-full absolute -top-[20px] -right-[40px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "200ms" }}
            />
            <div
              className="w-[2px] h-[2px] bg-primary rounded-full absolute -top-[100px] -right-[100px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "2s" }}
            />

            <div
              className="w-[5px] h-[5px] bg-primary rounded-full absolute top-[80px] -right-[100px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "0ms" }}
            />

            <div className="pb-4 bg-gradient-to-r from-primary dark:via-primary dark:to-[#848484] to-[#000] inline-block text-transparent bg-clip-text">
              <h1 className="font-medium pb-1 text-3xl">
                We will soon open up for beta.{" "}
              </h1>
            </div>

            <p className="font-medium pb-1 text-2xl text-[#606060]">
              You can't log in yet, but keep a lookout in your email for when we
              open up for beta testing.
            </p>

            <div className="pointer-events-auto mt-6 flex flex-col mb-4">
              <Link href="https://midday.ai" className="w-full">
                <Button className="w-full">Back to home page</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
