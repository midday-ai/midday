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
  tags: { id: string; name: string }[];
};

export function BulkActions({ ids, tags }: Props) {
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
              <Icons.Status className="mr-2 h-4 w-4" />
              <span>Tags</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="py-2 max-h-[200px] overflow-y-auto max-w-[220px]"
              >
                {tags?.length > 0 ? (
                  tags?.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag.id}
                      checked={ids.includes(tag.id)}
                      onCheckedChange={() => {
                        bulkUpdateTransactions.execute({
                          type: "tags",
                          data: ids.map((transaction) => ({
                            id: transaction,
                            tag_id: tag.id,
                          })),
                        });
                      }}
                    >
                      {tag.name}
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <p className="text-sm text-[#878787] px-2">No tags found</p>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Visibility className="mr-2 h-4 w-4" />
              <span>Exclude</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={14}>
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => {
                    bulkUpdateTransactions.execute({
                      type: "status",
                      data: ids.map((transaction) => ({
                        id: transaction,
                        internal: true,
                      })),
                    });
                  }}
                >
                  Yes
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => {
                    bulkUpdateTransactions.execute({
                      type: "status",
                      data: ids.map((transaction) => ({
                        id: transaction,
                        internal: false,
                      })),
                    });
                  }}
                >
                  No
                </DropdownMenuCheckboxItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Files className="mr-2 h-4 w-4" />
              <span>Archive</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={14}>
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => {
                    bulkUpdateTransactions.execute({
                      type: "status",
                      data: ids.map((transaction) => ({
                        id: transaction,
                        status: "archived",
                      })),
                    });
                  }}
                >
                  Yes
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
                  No
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
                className="w-[230px] h-[170px] p-4 space-y-4"
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

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Repeat className="mr-2 h-4 w-4" />
              <span>Recurring</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={14}>
                {[
                  {
                    label: "None",
                    value: null,
                  },
                  {
                    label: "Weekly",
                    value: "weekly",
                  },
                  {
                    label: "Monthly",
                    value: "monthly",
                  },
                  {
                    label: "Annually",
                    value: "annually",
                  },
                ].map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.value}
                    onCheckedChange={() => {
                      bulkUpdateTransactions.execute({
                        type: "recurring",
                        data: ids.map((transaction) => ({
                          id: transaction,
                          frequency: item.value,
                          recurring: item.value !== null,
                        })),
                      });
                    }}
                  >
                    {item.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
