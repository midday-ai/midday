"use client";

import { Button } from "@midday/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import Image from "next/image";
import { useRef, useState } from "react";
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
  const [value, setValue] = useState("https://cdn.midday.ai/all.zip");
  const ref = useRef();
  const { events } = useDraggable(ref);

  return (
    <div className="sm:h-screen sm:w-screen overflow-hidden">
      <div
        className="fixed bg-background z-10 top-0 left-0 right-0 overflow-scroll scrollbar-hide cursor-grabbing"
        {...events}
        ref={ref}
      >
        <div className="w-[4900px] flex h-screen">
          <div className="grid grid-cols-8 gap-4 items-center">
            {repeated.map((asset, index) => (
              <div className="h-auto max-w-full" key={index.toString()}>
                {asset}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-10 z-20 w-full flex justify-center items-center -ml-[80px]">
        <div className="h-[48px] w-[200px] rounded-full border border-border backdrop-filter backdrop-blur-xl bg-[#121212] bg-opacity-70 text-center flex items-center p-1 pl-2 justify-between space-x-4">
          <Select onValueChange={setValue} value={value}>
            <SelectTrigger className="w-[180px] border-0 space-x-2">
              <SelectValue placeholder="All" className="border-0" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="https://cdn.midday.ai/all.zip">
                  All
                </SelectItem>
                <SelectItem value="https://cdn.midday.ai/videos.zip">
                  Videos
                </SelectItem>
                <SelectItem value="https://cdn.midday.ai/founders.zip">
                  Founders
                </SelectItem>
                <SelectItem value="https://cdn.midday.ai/screens.zip">
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
