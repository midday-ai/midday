import React from "react";
import Link from "next/link";
import { Button } from "@midday/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@midday/ui/sheet";
import { MenuIcon, PanelsTopLeft } from "lucide-react";

import { Menu } from "./menu";

/**
 * SheetMenu component that renders a responsive menu sheet for mobile devices.
 * It includes a trigger button and a slide-out sheet with a brand header and menu.
 *
 * @returns {React.ReactElement} The rendered SheetMenu component
 */
export const SheetMenu: React.FC = React.memo(() => {
  return (
    <Sheet>
      <SheetTrigger className="lg:hidden" asChild>
        <Button className="h-8" variant="outline" size="icon">
          <MenuIcon size={20} />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full flex-col px-3 sm:w-72" side="left">
        <SheetHeader>
          <BrandLink />
        </SheetHeader>
        <Menu isOpen />
      </SheetContent>
    </Sheet>
  );
});

SheetMenu.displayName = "SheetMenu";

/**
 * BrandLink component that renders the brand logo and name as a link.
 *
 * @returns {React.ReactElement} The rendered BrandLink component
 */
const BrandLink: React.FC = React.memo(() => (
  <Button
    className="flex items-center justify-center pb-2 pt-1"
    variant="link"
    asChild
  >
    <Link href="/dashboard" className="flex items-center gap-2">
      <PanelsTopLeft className="mr-1 h-6 w-6" />
      <h1 className="text-lg font-bold">Brand</h1>
    </Link>
  </Button>
));

BrandLink.displayName = "BrandLink";
