import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  size?: number;
};

function BankFallback({ alt, size }: { alt: string; size: number }) {
  const initial = alt?.charAt(0)?.toUpperCase() || "B";
  return (
    <div
      className="flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

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
      ) : null}
      <AvatarFallback>
        <BankFallback alt={alt} size={size} />
      </AvatarFallback>
    </Avatar>
  );
}
