import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import { useState } from "react";

const CDN_DOMAIN =
  process.env.NEXT_PUBLIC_STORAGE_CDN_DOMAIN ?? "cdn-engine.midday.ai";
const DEFAULT_BANK_LOGO = `https://${CDN_DOMAIN}/default.jpg`;

type Props = {
  src: string | null;
  alt: string;
  size?: number;
};

export function BankLogo({ src, alt, size = 34 }: Props) {
  const [hasError, setHasError] = useState(false);
  const showingFallback = !src || hasError;

  return (
    <Avatar
      style={{ width: size, height: size }}
      className={cn(!showingFallback && "border border-border")}
    >
      {src && !hasError ? (
        <AvatarImage
          src={src}
          alt={alt}
          className="object-contain bg-white"
          onError={() => setHasError(true)}
        />
      ) : (
        <AvatarImage
          src={DEFAULT_BANK_LOGO}
          alt={alt}
          className="object-contain"
        />
      )}
      <AvatarFallback>
        <AvatarImage
          src={DEFAULT_BANK_LOGO}
          alt={alt}
          className="object-contain"
        />
      </AvatarFallback>
    </Avatar>
  );
}
