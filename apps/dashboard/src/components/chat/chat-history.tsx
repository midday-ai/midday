"use client";

import { AnimatedSizeContainer } from "@midday/ui/animated-size-container";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Skeleton } from "@midday/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDebounceCallback, useOnClickOutside } from "usehooks-ts";
import { useForesightChatPrefetch } from "@/hooks/use-foresight-prefetch";
import { useTRPC } from "@/trpc/client";

const ChatHistoryContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export function useChatHistoryContext() {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error(
      "useChatHistoryContext must be used within ChatHistoryProvider",
    );
  }
  return context;
}

function ChatHistorySkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={`chat-skeleton-${i + 1}`}
          className="flex items-center justify-between px-2 py-2"
        >
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ChatHistoryContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </ChatHistoryContext.Provider>
  );
}

export function ChatHistory() {
  return (
    <ChatHistoryProvider>
      <ChatHistoryButton />
    </ChatHistoryProvider>
  );
}

export function ChatHistoryButton() {
  const { isOpen, setIsOpen } = useChatHistoryContext();
  const { elementRef: historyButtonRef } = useForesightChatPrefetch();

  return (
    <button
      ref={historyButtonRef}
      type="button"
      data-chat-history-button
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex items-center h-6 cursor-pointer transition-colors duration-200",
        isOpen
          ? "bg-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.08)] dark:bg-[rgba(255,255,255,0.05)] dark:hover:bg-[rgba(255,255,255,0.08)] rounded-full"
          : "hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)]",
      )}
    >
      <span className="w-6 h-6 flex items-center justify-center">
        <Icons.History
          size={16}
          className={cn(
            "transition-colors",
            isOpen
              ? "text-black dark:text-white"
              : "text-[#707070] hover:text-[#999999] dark:text-[#666666] dark:hover:text-[#999999]",
          )}
        />
      </span>
    </button>
  );
}

export function ChatHistoryDropdown() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const historyListRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isOpen, setIsOpen } = useChatHistoryContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced search to avoid too many API calls
  const debouncedSearch = useDebounceCallback(setSearchQuery, 300);

  // Fetch chats with search functionality
  const { data: chats, isLoading } = useQuery({
    ...trpc.chats.list.queryOptions({
      limit: 20,
      search: searchQuery || undefined, // Only pass search if it's not empty
    }),
    enabled: isOpen, // Only fetch when dropdown is open
  });

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure the dropdown is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      // Reset selected index when opening
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Reset selected index when chats change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [chats]);

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
          (old) => old?.filter((chat) => chat.chatId !== chatId) ?? [],
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

  // Close dropdown when clicking outside
  useOnClickOutside(historyListRef as RefObject<HTMLElement>, (event) => {
    if (isOpen) {
      const target = event.target as Element;
      const clickedButton = target.closest("button");
      const isHistoryButton = clickedButton?.closest(
        "[data-chat-history-button]",
      );

      // Don't close if clicking on the history button itself
      if (!isHistoryButton) {
        setIsOpen(false);
      }
    }
  });

  const handleChatSelect = (chatId: string) => {
    router.push(`/chat/${chatId}`);
    setIsOpen(false);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChatMutation.mutate({ chatId });
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !chats || chats.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < chats.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (
          selectedIndex >= 0 &&
          selectedIndex < chats.length &&
          chats[selectedIndex]
        ) {
          handleChatSelect(chats[selectedIndex].chatId);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Scroll selected chat into view
  useEffect(() => {
    if (historyListRef.current && selectedIndex >= 0) {
      const selectedElement = historyListRef.current.querySelector(
        `[data-chat-index="${selectedIndex}"]`,
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      ref={historyListRef}
      data-chat-history-menu
      className="absolute bottom-full left-0 right-0 mb-2 w-full z-[100]"
    >
      <AnimatedSizeContainer
        height
        className="bg-[#f7f7f7]/85 dark:bg-[#171717]/85 backdrop-blur-lg max-h-80 flex flex-col overflow-hidden"
        transition={{
          type: "spring",
          duration: 0.2,
          bounce: 0.1,
          ease: "easeOut",
        }}
        style={{
          transformOrigin: "bottom center",
        }}
      >
        <div className="p-2 pb-2 flex-shrink-0 sticky top-0 bg-[#f7f7f7]/85 dark:bg-[#171717]/85 backdrop-blur-lg z-10">
          <div className="relative">
            <Icons.Search
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={14}
            />
            <Input
              ref={searchInputRef}
              placeholder="Search history"
              className="pl-8 bg-black/5 dark:bg-white/5 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8 text-sm"
              onChange={(e) => {
                debouncedSearch(e.target.value);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 max-h-[calc(20rem-3.5rem)] overscroll-contain scrollbar-hide">
          <div className="p-2 pt-0">
            {isLoading ? (
              <ChatHistorySkeleton />
            ) : chats?.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  {searchQuery ? "No chats found" : "No chat history"}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {chats?.map((chat, index) => {
                  if (!chat) return null;
                  const isSelected = selectedIndex === index;
                  return (
                    <div
                      key={chat.chatId}
                      data-chat-index={index}
                      className={cn(
                        "group relative flex items-center justify-between px-2 py-2 text-sm cursor-pointer transition-colors h-[32px]",
                        isSelected
                          ? "bg-black/5 dark:bg-white/5"
                          : "hover:bg-black/5 dark:hover:bg-white/5",
                      )}
                      onMouseDown={(e) => {
                        // Prevent input from losing focus when clicking on chat
                        e.preventDefault();
                      }}
                      onClick={() => handleChatSelect(chat.chatId)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-[#666] dark:text-[#999] line-clamp-1 ml-2">
                          {chat.title || "New chat"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0 min-w-0">
                        <span className="text-xs text-[#666] dark:text-[#999] whitespace-nowrap transition-all duration-200 group-hover:mr-1">
                          {formatDistanceToNow(chat.updatedAt, {
                            addSuffix: true,
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteChat(e, chat.chatId)}
                          className="overflow-hidden w-0 opacity-0 group-hover:w-6 group-hover:opacity-100 transition-all duration-200 p-1 hover:bg-destructive/10 rounded-sm pointer-events-none group-hover:pointer-events-auto flex-shrink-0"
                          title="Delete chat"
                        >
                          <Icons.Delete
                            size={14}
                            className="text-muted-foreground hover:text-destructive"
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AnimatedSizeContainer>
    </div>
  );
}
