import { ImageIcon } from "@radix-ui/react-icons";
import { IconProps } from "@radix-ui/react-icons/dist/types";

import React from "react";
import { cn } from "../../utils/cn";
import {
  Card,
  CardDescription,
  CardTitle,
} from "../card";

interface EmptyFileUploadCardProps
  extends React.ComponentPropsWithoutRef<typeof Card> {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ForwardRefExoticComponent<
    IconProps & React.RefAttributes<SVGSVGElement>
  >;
}

export function EmptyFileUploadCard({
  title,
  description,
  icon: Icon = ImageIcon,
  action,
  className,
  ...props
}: EmptyFileUploadCardProps) {
  return (
    <Card
      className={cn(
        "flex w-full flex-col items-center justify-center space-y-6 bg-transparent p-16",
        className,
      )}
      {...props}
    >
      <div className="mr-4 shrink-0 rounded-full border border-dashed p-4">
        <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </div>
      {action ? action : null}
    </Card>
  );
}
