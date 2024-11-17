"use client";

import { cn } from "@midday/ui/cn";
import type { ImageProps } from "next/image";
import Image from "next/image";

interface DynamicImageProps extends Omit<ImageProps, "src" | "className"> {
  lightSrc: ImageProps["src"];
  darkSrc: ImageProps["src"];
  className?: string;
}

export function DynamicImage({
  lightSrc,
  darkSrc,
  alt,
  className,
  ...props
}: DynamicImageProps) {
  return (
    <>
      <Image
        src={lightSrc}
        alt={alt}
        className={cn("dark:hidden", className)}
        {...props}
      />
      <Image
        src={darkSrc}
        alt={alt}
        className={cn("hidden dark:block", className)}
        {...props}
      />
    </>
  );
}
