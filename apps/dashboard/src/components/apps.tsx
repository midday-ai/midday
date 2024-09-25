import { apps } from "@midday/apps";
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
  SheetTitle,
  SheetTrigger,
} from "@midday/ui/sheet";
import Image from "next/image";
import { AppsHeader } from "./apps-header";

export function Apps() {
  return (
    <div className="mt-4">
      <AppsHeader />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mx-auto mt-8">
        {apps.map((app) => (
          <Card key={app.id} className="w-full max-w-[325px]">
            <Sheet>
              <div className="pt-6 pl-6">
                <Image
                  src={app.logo}
                  alt={app.name}
                  className="size-10 object-cover"
                  width={40}
                  height={40}
                  quality={100}
                />
              </div>

              <CardHeader className="pb-0">
                <CardTitle className="text-md font-medium">
                  {app.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#878787] pb-4">
                {app.short_description}
              </CardContent>

              <div className="px-6 pb-6 flex gap-2">
                <Button variant="outline" className="w-full">
                  Install
                </Button>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Details
                  </Button>
                </SheetTrigger>
              </div>

              <SheetContent>
                <SheetHeader>
                  <div className="mb-4">
                    <Image
                      src={app.images[0]}
                      alt={app.name}
                      width={465}
                      height={290}
                      quality={100}
                    />
                  </div>

                  <div className="flex space-x-4 items-center border-b border-border pb-4">
                    <Image
                      src={app.logo}
                      alt={app.name}
                      className="size-10 object-cover"
                      width={40}
                      height={40}
                      quality={100}
                    />
                    <div>
                      <h3 className="text-lg leading-none">{app.name}</h3>
                      <span className="text-xs text-[#878787]">
                        1.3k installs • Published by Midday
                      </span>
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
                      {app.description}
                    </AccordionContent>
                  </AccordionItem>

                  {app.settings && (
                    <AccordionItem value="settings" className="border-none">
                      <AccordionTrigger>Settings</AccordionTrigger>
                      <AccordionContent className="text-[#878787] text-sm">
                        Settings
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>

                <div className="absolute bottom-0 py-8 border-t border-border">
                  <p className="text-[10px] text-[#878787]">
                    Every app published on the Midday App Store is open source
                    and thoroughly tested via peer reviews. Nevertheless, Midday
                    Labs AB. does not endorse or certify these apps unless they
                    are published by Midday. If you encounter inappropriate
                    content or behaviour please report it.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </Card>
        ))}
      </div>
    </div>
  );
}
