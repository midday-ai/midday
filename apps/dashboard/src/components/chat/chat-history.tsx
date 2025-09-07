"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Skeleton } from "@midday/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

type Chat = {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function ChatHistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={`chat-skeleton-${i + 1}`} className="flex flex-col gap-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ChatHistory() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Debounced search to avoid too many API calls
  const debouncedSearch = useDebounceCallback(setSearchQuery, 300);

  // Fetch chats with search functionality
  const { data: chats, isLoading } = useQuery({
    ...trpc.chats.list.queryOptions({
      limit: 20,
      search: searchQuery || undefined, // Only pass search if it's not empty
    }),
    enabled: isOpen, // Only fetch when popover is open
  });

  // Delete chat mutation with optimistic updates
  const deleteChatMutation = useMutation(
    trpc.chats.delete.mutationOptions({
      onMutate: async ({ chatId }) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.chats.list.queryKey({
            limit: 20,
            search: searchQuery || undefined,
          }),
        });

        // Snapshot previous value
        const previousChats = queryClient.getQueryData(
          trpc.chats.list.queryKey({
            limit: 20,
            search: searchQuery || undefined,
          }),
        );

        // Optimistically update the cache
        queryClient.setQueryData(
          trpc.chats.list.queryKey({
            limit: 20,
            search: searchQuery || undefined,
          }),
          (old: Chat[] | undefined) =>
            old?.filter((chat) => chat.id !== chatId) ?? [],
        );

        return { previousChats };
      },
      onError: (_, __, context) => {
        // Restore previous data on error
        if (context?.previousChats) {
          queryClient.setQueryData(
            trpc.chats.list.queryKey({
              limit: 20,
              search: searchQuery || undefined,
            }),
            context.previousChats,
          );
        }
      },
      onSettled: () => {
        // Refetch after error or success
        queryClient.invalidateQueries({
          queryKey: trpc.chats.list.queryKey({
            limit: 20,
            search: searchQuery || undefined,
          }),
        });
      },
    }),
  );

  const handleChatSelect = (chatId: string) => {
    router.push(`/${chatId}`);
    setIsOpen(false);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    deleteChatMutation.mutate({ chatId });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Menu size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="p-4">
          <div className="relative mb-4">
            <Icons.Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={14}
            />
            <Input
              placeholder="Search history"
              className="pl-9"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <ChatHistorySkeleton />
            ) : chats?.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  {searchQuery ? "No chats found" : "No chat history"}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chats?.map((chat: Chat) => (
                  <div
                    key={chat.id}
                    className="group relative flex items-center justify-between hover:bg-muted/50 rounded-md p-2 -m-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleChatSelect(chat.id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium line-clamp-1">
                          {chat.title || "New chat"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(chat.updatedAt, {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-destructive/10 rounded-sm"
                      title="Delete chat"
                    >
                      <Icons.Delete
                        size={14}
                        className="text-muted-foreground hover:text-destructive"
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
