"use client";

import { useTransactionsStore } from "@/store/transactions";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SelectUser } from "./select-user";

const DISCREPANCY_TYPES = [
  { value: "partial_payment", label: "Partial payment" },
  { value: "overpayment", label: "Overpayment" },
  { value: "duplicate", label: "Duplicate" },
  { value: "unrecognized", label: "Unrecognized" },
  { value: "bank_fee", label: "Bank fee" },
  { value: "split_payment", label: "Split payment" },
] as const;

type Props = {
  ids: string[];
};

export function BulkActions({ ids }: Props) {
  const trpc = useTRPC();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { setRowSelection } = useTransactionsStore();

  const invalidateAndReset = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.transactions.get.infiniteQueryKey(),
    });
    setRowSelection("all", {});
  };

  const updateTransactionsMutation = useMutation(
    trpc.transactions.updateMany.mutationOptions({
      onSuccess: (_, data) => {
        invalidateAndReset();
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

  const bulkConfirmMutation = useMutation(
    trpc.reconciliation.bulkConfirmMatches.mutationOptions({
      onSuccess: () => {
        invalidateAndReset();
        toast({
          title: `Confirmed ${ids.length} matches.`,
          variant: "success",
          duration: 3500,
        });
      },
    }),
  );

  const triggerReMatchMutation = useMutation(
    trpc.reconciliation.triggerReMatch.mutationOptions({
      onSuccess: () => {
        invalidateAndReset();
        toast({
          title: `Auto-matching ${ids.length} transactions...`,
          variant: "success",
          duration: 3500,
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
      <DropdownMenuContent align="end" className="w-[200px]" sideOffset={8}>
        {/* MCA matching actions */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => triggerReMatchMutation.mutate({ transactionIds: ids })}
          >
            Auto-match
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => bulkConfirmMutation.mutate({ transactionIds: ids })}
          >
            Confirm all matches
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* MCA flagging actions */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              Flag for review
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={14}>
                <DropdownMenuItem
                  onClick={() => {
                    // Bulk flag as NSF
                    for (const id of ids) {
                      updateTransactionsMutation.mutate({
                        ids: [id],
                        status: "posted", // Keep status, the flagDiscrepancy handles matchStatus
                      });
                    }
                    // TODO: Use bulk flagDiscrepancy when available
                    toast({
                      title: `Flagged ${ids.length} transactions as NSF`,
                      variant: "success",
                    });
                  }}
                >
                  Mark as NSF
                </DropdownMenuItem>
                {DISCREPANCY_TYPES.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => {
                      // TODO: Use bulk flagDiscrepancy when available
                      toast({
                        title: `Flagged ${ids.length} as ${type.label}`,
                        variant: "success",
                      });
                    }}
                  >
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Keep: Exclude */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              Exclude
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={14}>
                <DropdownMenuCheckboxItem
                  onCheckedChange={() => {
                    updateTransactionsMutation.mutate({
                      ids,
                      status: "excluded",
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

        {/* Keep: Tags */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              Tags
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

        {/* Keep: Assign */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              Assign
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
