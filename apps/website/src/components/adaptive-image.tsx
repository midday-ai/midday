import { cn } from "@midday/ui/utils";
import Image from "next/image";
import type ImageProps from "next/image";

type Props = ImageProps;

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
