import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@midday/ui/sheet";
import Image from "next/image";
import type { User } from "./apps";

export function App({
  id,
  logo,
  name,
  short_description,
  description,
  settings,
  onInitialize,
  images,
  active,
}: {
  id: string;
  logo: {
    src: string;
    width: number;
    height: number;
  };
  name: string;
  short_description: string;
  description: string;
  settings: Record<string, any>;
  onInitialize: (user: User) => void;
  images: string[];
  active?: boolean;
}) {
  return (
    <Card key={id} className="w-full flex flex-col">
      <Sheet>
        <div className="pt-6 pl-6 h-16 flex items-center">
          <Image
            src={logo.src}
            alt={name}
            width={logo.width}
            height={logo.height}
            quality={100}
          />
        </div>

        <CardHeader className="pb-0">
          <div className="flex items-center space-x-2 pb-4">
            <CardTitle className="text-md font-medium leading-none p-0 m-0">
              {name}
            </CardTitle>
            {!active && (
              <span className="text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D] px-3 py-1 rounded-full cursor-default font-mono">
                Coming soon
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-xs text-[#878787] pb-4">
          {short_description}
        </CardContent>

        <div className="px-6 pb-6 flex gap-2 mt-auto">
          <Button
            variant="outline"
            className="w-full"
            onClick={onInitialize}
            disabled={!onInitialize || !active}
          >
            Install
          </Button>

          <SheetTrigger asChild disabled={!active}>
            <Button variant="outline" className="w-full">
              Details
            </Button>
          </SheetTrigger>
        </div>

        <SheetContent>
          <SheetHeader>
            <div className="mb-4">
              <Image
                src={images[0]}
                alt={name}
                width={465}
                height={290}
                quality={100}
              />
            </div>

            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center space-x-2">
                <Image
                  src={logo}
                  alt={name}
                  className="size-10 object-cover"
                  width={40}
                  height={40}
                  quality={100}
                />
                <div>
                  <h3 className="text-lg leading-none">{name}</h3>
                  <span className="text-xs text-[#878787]">
                    1.3k installs • Published by Midday
                  </span>
                </div>
              </div>

              <div>
                <Button
                  variant="outline"
                  className="w-full border-primary"
                  onClick={onInitialize}
                  disabled={!onInitialize || !active}
                >
                  Install
                </Button>
              </div>
            </div>
          </SheetHeader>

          <Accordion
            type="multiple"
            defaultValue={["description"]}
            className="mt-4"
          >
            <AccordionItem value="description" className="border-none">
              <AccordionTrigger>How it works</AccordionTrigger>
              <AccordionContent className="text-[#878787] text-sm">
                {description}
              </AccordionContent>
            </AccordionItem>

            {settings && (
              <AccordionItem value="settings" className="border-none">
                <AccordionTrigger>Settings</AccordionTrigger>
                <AccordionContent className="text-[#878787] text-sm">
                  Settings
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          <div className="absolute bottom-4 pt-8 border-t border-border">
            <p className="text-[10px] text-[#878787]">
              All apps on the Midday App Store are open-source and
              peer-reviewed. Midday Labs AB maintains high standards but doesn't
              endorse third-party apps. Apps published by Midday are officially
              certified. Report any concerns about app content or behavior.
            </p>

            <button type="button" className="text-[10px] text-red-500">
              Report app
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
