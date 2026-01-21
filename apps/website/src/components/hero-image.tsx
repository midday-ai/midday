"use client";

import Image from "next/image";
import { useState } from "react";

interface HeroImageProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  width?: number;
  height?: number;
}

export function HeroImage({
  lightSrc,
  darkSrc,
  alt,
  width = 1200,
  height = 800,
}: HeroImageProps) {
  const [isLightLoaded, setIsLightLoaded] = useState(false);
  const [isDarkLoaded, setIsDarkLoaded] = useState(false);

  return (
    <>
      <Image
        src={lightSrc}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-auto object-contain relative z-0 dark:hidden transition-all duration-700 ease-out"
        style={{
          filter: isLightLoaded ? "blur(0px)" : "blur(20px)",
          transform: isLightLoaded ? "scale(1)" : "scale(1.02)",
        }}
        priority
        onLoad={() => setIsLightLoaded(true)}
      />
      <Image
        src={darkSrc}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-auto object-contain relative z-0 hidden dark:block transition-all duration-700 ease-out"
        style={{
          filter: isDarkLoaded ? "blur(0px)" : "blur(20px)",
          transform: isDarkLoaded ? "scale(1)" : "scale(1.02)",
        }}
        priority
        onLoad={() => setIsDarkLoaded(true)}
      />
    </>
  );
}
