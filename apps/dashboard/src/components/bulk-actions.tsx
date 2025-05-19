"use client";

import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SelectCategory } from "./select-category";
import { SelectUser } from "./select-user";

type Props = {
  ids: string[];
};

export function BulkActions({ ids }: Props) {
  const trpc = useTRPC();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { setRowSelection } = useTransactionsStore();

  const updateTransactionsMutation = useMutation(
    trpc.transactions.updateMany.mutationOptions({
      onSuccess: (_, data) => {
        // Invalidate the transaction list query
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });

        // Reset the row selection
        setRowSelection({});

        toast({
          title: `Updated ${data?.ids.length} transactions.`,
          variant: "success",
          duration: 3500,
        });
      },
      onError: () => {
        toast({
          title: "Something went wrong please try again.",
          duration: 3500,
          variant: "error",
        });
      },
    }),
  );

  const { data: tags } = useQuery({
    ...trpc.tags.get.queryOptions(),
    enabled: ids.length > 0,
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
                    updateTransactionsMutation.mutate({
                      ids,
                      categorySlug: selected.slug,
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
                {tags && tags.length > 0 ? (
                  tags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag.id}
                      checked={ids.includes(tag.id)}
                      onCheckedChange={() => {
                        updateTransactionsMutation.mutate({
                          ids,
                          tagId: tag.id,
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
                    updateTransactionsMutation.mutate({
                      ids,
                      internal: true,
                    });
                  }}
                >
                  Yes
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => {
                    updateTransactionsMutation.mutate({
                      ids,
                      internal: false,
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
                    updateTransactionsMutation.mutate({
                      ids,
                      status: "archived",
                    });
                  }}
                >
                  Yes
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => {
                    updateTransactionsMutation.mutate({
                      ids,
                      status: "posted",
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
                    updateTransactionsMutation.mutate({
                      ids,
                      assignedId: selected?.id,
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
                    updateTransactionsMutation.mutate({
                      ids,
                      status: "completed",
                    });
                  }}
                >
                  Completed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => {
                    updateTransactionsMutation.mutate({
                      ids,
                      status: "posted",
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
                      updateTransactionsMutation.mutate({
                        ids,
                        frequency: item.value as
                          | "weekly"
                          | "monthly"
                          | "annually"
                          | "irregular",
                        recurring: item.value !== null,
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
