import { cn } from "@midday/ui/cn";
import Image from "next/image";
import type ImageProps from "next/image";

type Props = {
  lightSrc: string;
  darkSrc: string;
  className: string;
} & typeof ImageProps;

export function AdaptiveImage({
  lightSrc,
  darkSrc,
  className,
  ...rest
}: Props) {
  return (
    <>
      <Image
        src={darkSrc}
        className={cn("hidden dark:block", className)}
        {...rest}
      />

      <Image
        src={lightSrc}
        className={cn("block dark:hidden", className)}
        {...rest}
      />
    </>
  );
}
