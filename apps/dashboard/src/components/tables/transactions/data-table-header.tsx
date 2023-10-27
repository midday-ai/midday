"use client";

import { Button } from "@midday/ui/button";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { DataTableCell } from "./data-table-row";

type Props = {
  collapsed?: boolean;
};

export function DataTableHeader({ collapsed }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [column, value] = searchParams.get("sort")
    ? searchParams.get("sort")?.split(":")
    : [];

  const createSortQuery = useCallback(
    (name: string) => {
      const params = new URLSearchParams(searchParams);
      const prevSort = params.get("sort");

      if (`${name}:asc` === prevSort) {
        params.set("sort", `${name}:desc`);
      } else if (`${name}:desc` === prevSort) {
        params.delete("sort");
      } else {
        params.set("sort", `${name}:asc`);
      }

      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  return (
    <div
      className="sticky -top-[1px] z-10 backdrop-blur backdrop-filter bg-opacity-50"
      style={{ background: "rgba(18, 18, 18,.9)" }}
    >
      <div className="flex items-center h-[45px] hover:bg-secondary">
        <DataTableCell className="w-[100px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("date")}
          >
            <span>Date</span>
            {"date" === column && value === "asc" && <ArrowDown size={16} />}
            {"date" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </DataTableCell>

        <DataTableCell className="w-[430px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("name")}
          >
            <span>Description</span>
            {"name" === column && value === "asc" && <ArrowDown size={16} />}
            {"name" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </DataTableCell>

        <DataTableCell className="w-[200px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("amount")}
          >
            <span>Amount</span>
            {"amount" === column && value === "asc" && <ArrowDown size={16} />}
            {"amount" === column && value === "desc" && <ArrowUp size={16} />}
          </Button>
        </DataTableCell>

        <motion.div
          className="border-r"
          initial={false}
          animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 200 }}
          transition={{
            duration: 0.25,
            ease: "easeInOut",
          }}
        >
          <DataTableCell>
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("category")}
            >
              <span>Category</span>
              {"method" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"method" === column && value === "desc" && <ArrowUp size={16} />}
            </Button>
          </DataTableCell>
        </motion.div>

        <motion.div
          className="border-r"
          initial={false}
          animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 150 }}
          transition={{
            duration: 0.25,
            ease: "easeInOut",
          }}
        >
          <DataTableCell>
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("method")}
            >
              <span>Method</span>
              {"method" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"method" === column && value === "desc" && <ArrowUp size={16} />}
            </Button>
          </DataTableCell>
        </motion.div>

        <motion.div
          className="border-r"
          initial={false}
          animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 200 }}
          transition={{
            duration: 0.25,
            ease: "easeInOut",
          }}
        >
          <DataTableCell>
            <Button
              className="p-0 hover:bg-transparent space-x-2"
              variant="ghost"
              onClick={() => createSortQuery("assigned")}
            >
              <span>Assigned</span>
              {"assigned" === column && value === "asc" && (
                <ArrowDown size={16} />
              )}
              {"assigned" === column && value === "desc" && (
                <ArrowUp size={16} />
              )}
            </Button>
          </DataTableCell>
        </motion.div>

        <DataTableCell className="w-[100px]">
          <Button
            className="p-0 hover:bg-transparent space-x-2"
            variant="ghost"
            onClick={() => createSortQuery("attachment")}
          >
            <span>Status</span>
            {"attachment" === column && value === "asc" && (
              <ArrowDown size={16} />
            )}
            {"attachment" === column && value === "desc" && (
              <ArrowUp size={16} />
            )}
          </Button>
        </DataTableCell>
      </div>
    </div>
  );
}
