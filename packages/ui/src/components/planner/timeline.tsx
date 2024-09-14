import React from "react";
import { useCalendar } from "../../contexts/planner-context";
import { cn } from "../../utils/cn";

import {
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

export const Timeline: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  const { timeLabels } = useCalendar();

  return (
    <TableHeader>
      <TableRow className="bg-background">
        <TableHead></TableHead>
        {timeLabels.map((label, index) => (
          <TableHead
            key={index}
            className={cn(
              "sticky top-0 z-10 min-w-56 border-x bg-background text-center lg:min-w-72",
            )}
          >
            {label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
};
