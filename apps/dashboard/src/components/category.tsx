"use client";

import { cn } from "@midday/ui/cn";

type CategoryIconProps = {
  color?: string;
  size?: number;
  className?: string;
};

export function CategoryColor({
  color,
  className,
  size = 12,
}: CategoryIconProps) {
  return (
    <div
      className={cn("flex-shrink-0", className)}
      style={{
        backgroundColor: color,
        width: size,
        height: size,
      }}
    />
  );
}

type Props = {
  name: string;
  className?: string;
  color?: string;
};

export function Category({ name, color, className }: Props) {
  return (
    <div
      className={cn(
        "flex space-x-2 items-center min-w-0 overflow-hidden",
        className,
      )}
    >
      <CategoryColor color={color} />
      {name && <span className="truncate">{name}</span>}
    </div>
  );
}
