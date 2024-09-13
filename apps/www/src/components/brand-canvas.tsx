"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@midday/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useDraggable } from "react-use-draggable-scroll";

const assets = [
  <Image
    key="1"
    src={require("public/branding/1.png")}
    width={600}
    alt="keyboard"
  />,
  <Image
    key="2"
    src={require("public/branding/2.png")}
    width={600}
    alt="founders"
  />,
  <Image
    key="3"
    src={require("public/branding/3.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="1"
    src={require("public/branding/11.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="4"
    src={require("public/branding/4.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="5"
    src={require("public/branding/5.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="7"
    src={require("public/branding/7.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="8"
    src={require("public/branding/8.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="9"
    src={require("public/branding/9.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="10"
    src={require("public/branding/10.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="1"
    src={require("public/branding/1.png")}
    width={600}
    alt="keyboard"
  />,
  <Image
    key="2"
    src={require("public/branding/2.png")}
    width={600}
    alt="founders"
  />,
  <Image
    key="3"
    src={require("public/branding/3.png")}
    width={600}
    alt="screens"
  />,
];

const repeated = [...assets, ...assets, ...assets, ...assets, ...assets];

export function BrandCanvas() {
  const [value, setValue] = useState(
    "https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/all.zip",
  );
  const ref = useRef();
  const { events } = useDraggable(ref);

  return (
    <div className="overflow-hidden sm:h-screen sm:w-screen">
      <div
        className="scrollbar-hide fixed left-0 right-0 top-0 z-10 cursor-grabbing overflow-scroll bg-background"
        {...events}
        ref={ref}
      >
        <div className="flex h-screen w-[4900px]">
          <div className="grid grid-cols-8 items-center gap-4">
            {repeated.map((asset, index) => (
              <div className="h-auto max-w-full" key={index.toString()}>
                {asset}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-10 z-20 -ml-[80px] flex w-full items-center justify-center">
        <div className="flex h-[48px] w-[200px] items-center justify-between space-x-4 rounded-full border border-border bg-[#121212] bg-opacity-70 p-1 pl-2 text-center backdrop-blur-xl backdrop-filter">
          <Select onValueChange={setValue} value={value}>
            <SelectTrigger className="w-[180px] space-x-2 border-0">
              <SelectValue placeholder="All" className="border-0" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/all.zip">
                  All
                </SelectItem>
                <SelectItem value="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/videos.zip">
                  Videos
                </SelectItem>
                <SelectItem value="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/founders.zip">
                  Founders
                </SelectItem>
                <SelectItem value="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/screens.zip">
                  Screens
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button className="rounded-full">
            <a href={value} download title="Download">
              Download
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
