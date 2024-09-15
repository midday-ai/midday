import React, { FC, useState } from "react";
import { Resource } from "../../types/resource";
import { cn } from "../../utils";

import { TableCell } from "../table";

export interface ResourceTableCellProps
  extends React.HTMLAttributes<HTMLTableCellElement> {
  resourceItem: Resource;
}

const ResourceTableCell: FC<ResourceTableCellProps> = ({
  className,
  resourceItem,
  ...props
}) => {
  return (
    <TableCell
      className={cn(className, "sticky left-0 z-10 border-y bg-background")}
      {...props}
    >
      <div className="flex items-center space-x-4">
        <div className="relative h-10 w-10">
          <img
            className="rounded-full object-fill"
            src={resourceItem.details.image}
            alt={resourceItem.name}
          />
        </div>
        <h2>{resourceItem.name}</h2>
      </div>
    </TableCell>
  );
};

export default ResourceTableCell;
