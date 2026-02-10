"use client";

import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@midday/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useState } from "react";
import { useTransactionTableContextOptional } from "@/components/tables/transactions/transaction-table-context";
import { useTRPC } from "@/trpc/client";

type Tag = {
  id: string;
  name: string | null;
};

type Props = {
  transactionId: string;
  tags?: Tag[];
};

export function InlineSelectTags({ transactionId, tags = [] }: Props) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Use shared context when available (inside transaction table), fallback to direct query
  const tableContext = useTransactionTableContextOptional();
  const { data: fallbackTags } = useQuery({
    ...trpc.tags.get.queryOptions(),
    // Skip query if we have context data (already fetched by provider)
    enabled: !tableContext,
  });

  const allTags = tableContext?.tags ?? fallbackTags;

  const createTransactionTagMutation = useMutation(
    trpc.transactionTags.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey(),
        });
      },
    }),
  );

  const deleteTransactionTagMutation = useMutation(
    trpc.transactionTags.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey(),
        });
      },
    }),
  );

  const createTagMutation = useMutation(
    trpc.tags.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: trpc.tags.get.queryKey() });
        if (data) {
          createTransactionTagMutation.mutate({
            transactionId,
            tagId: data.id,
          });
        }
      },
    }),
  );

  const [inputValue, setInputValue] = useState("");

  const selectedTagIds = new Set(tags.map((tag) => tag.id));

  const allTagsList =
    allTags
      ?.filter((tag) => tag.name != null)
      .map((tag) => ({
        id: tag.id,
        name: tag.name!,
      })) ?? [];

  const filteredTags = allTagsList.filter((tag) =>
    tag.name.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const showCreate =
    Boolean(inputValue) &&
    !filteredTags.some(
      (tag) => tag.name.toLowerCase() === inputValue.toLowerCase(),
    );

  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.has(tagId)) {
      deleteTransactionTagMutation.mutate({
        transactionId,
        tagId,
      });
    } else {
      createTransactionTagMutation.mutate({
        transactionId,
        tagId,
      });
    }
  };

  const handleCreateTag = () => {
    if (inputValue.trim()) {
      createTagMutation.mutate({ name: inputValue.trim() });
      setInputValue("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full text-left hover:opacity-70 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {tags.length > 0 ? (
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
              {tags
                .filter((tag) => tag.name != null)
                .map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="tag-rounded"
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    {tag.name}
                  </Badge>
                ))}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        side="bottom"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="w-[286px] h-[270px]">
          <Command loop shouldFilter={false}>
            <CommandInput
              value={inputValue}
              onValueChange={setInputValue}
              placeholder="Search tags..."
              className="px-3"
            />
            <CommandGroup>
              <CommandList className="max-h-[225px] overflow-auto">
                {filteredTags.map((tag) => {
                  const isSelected = selectedTagIds.has(tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.id}
                      onSelect={(value) => {
                        if (typeof value === "string") {
                          handleTagToggle(value);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {tag.name}
                    </CommandItem>
                  );
                })}
                <CommandEmpty>No tags found.</CommandEmpty>
                {showCreate && (
                  <CommandItem
                    key={inputValue}
                    value={inputValue}
                    onSelect={handleCreateTag}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    className="cursor-pointer"
                  >
                    <span>{`Create "${inputValue}"`}</span>
                  </CommandItem>
                )}
              </CommandList>
            </CommandGroup>
          </Command>
        </div>
      </PopoverContent>
    </Popover>
  );
}
