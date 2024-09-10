"use client";

import { bulkUpdateTransactionsAction } from "@/actions/bulk-update-transactions-action";
import { useTransactionsStore } from "@/store/transactions";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { useAction } from "next-safe-action/hooks";
import { SelectCategory } from "./select-category";
import { SelectUser } from "./select-user";

type Props = {
  ids: string[];
};

export function BulkActions({ ids }: Props) {
  const { toast } = useToast();

  const { setRowSelection } = useTransactionsStore();

  const bulkUpdateTransactions = useAction(bulkUpdateTransactionsAction, {
    onExecute: ({ input }) => {
      if (input.type === "status") {
        setRowSelection({});
      }
    },
    onSuccess: ({ data }) => {
      setRowSelection({});
      toast({
        title: `Updated ${data?.length} transactions.`,
        variant: "success",
        duration: 3500,
      });
    },
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="space-x-2">
          <span>Actions</span>
          <Icons.ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Category className="mr-2 h-4 w-4" />
              <span>Categories</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                className="p-0 w-[250px] h-[270px]"
              >
                <SelectCategory
                  onChange={(selected) => {
                    bulkUpdateTransactions.execute({
                      type: "category",
                      data: ids.map((transaction) => ({
                        id: transaction,
                        category_slug: selected.slug,
                      })),
                    });
                  }}
                  headless
                />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Visibility className="mr-2 h-4 w-4" />
              <span>Visibility</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={14}>
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => {
                    bulkUpdateTransactions.execute({
                      type: "status",
                      data: ids.map((transaction) => ({
                        id: transaction,
                        status: "posted",
                      })),
                    });
                  }}
                >
                  Include
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => {
                    bulkUpdateTransactions.execute({
                      type: "status",
                      data: ids.map((transaction) => ({
                        id: transaction,
                        status: "excluded",
                      })),
                    });
                  }}
                >
                  Exclude
                </DropdownMenuCheckboxItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Face className="mr-2 h-4 w-4" />
              <span>Assign</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                className="w-[230px] h-[170px] p-4"
              >
                <SelectUser
                  onSelect={(selected) => {
                    bulkUpdateTransactions.execute({
                      type: "assigned",
                      data: ids.map((transaction) => ({
                        id: transaction,
                        assigned_id: selected?.id,
                      })),
                    });
                  }}
                />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.AlertCircle className="mr-2 h-4 w-4" />
              <span>Status</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={14}>
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => {
                    bulkUpdateTransactions.execute({
                      type: "status",
                      data: ids.map((transaction) => ({
                        id: transaction,
                        status: "completed",
                      })),
                    });
                  }}
                >
                  Completed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => {
                    bulkUpdateTransactions.execute({
                      type: "status",
                      data: ids.map((transaction) => ({
                        id: transaction,
                        status: "posted",
                      })),
                    });
                  }}
                >
                  Uncompleted
                </DropdownMenuCheckboxItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
