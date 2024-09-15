import * as React from "react";

type FooterProps = {
  description: string;
};

export function Footer({ description }: FooterProps) {
  return (
    <div className="z-20 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-4 flex h-14 items-center md:mx-8">
        <p className="text-left text-xs leading-loose text-muted-foreground md:text-sm">
          {description}{" "}
        </p>
      </div>
    </div>
  );
}
