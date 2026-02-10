"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { useTRPC } from "@/trpc/client";

type TeamMember = {
  user: {
    id: string;
    avatarUrl?: string | null;
    fullName: string | null;
  } | null;
};

type Tag = {
  id: string;
  name: string | null;
};

interface TransactionTableContextValue {
  teamMembers: TeamMember[] | undefined;
  tags: Tag[] | undefined;
  isLoadingMembers: boolean;
  isLoadingTags: boolean;
}

const TransactionTableContext = createContext<
  TransactionTableContextValue | undefined
>(undefined);

interface TransactionTableProviderProps {
  children: ReactNode;
}

/**
 * Provider that fetches shared data (team members, tags) once for the entire
 * transaction table, avoiding duplicate subscriptions in each cell component.
 */
export function TransactionTableProvider({
  children,
}: TransactionTableProviderProps) {
  const trpc = useTRPC();

  const { data: teamMembers, isLoading: isLoadingMembers } = useQuery(
    trpc.team.members.queryOptions(),
  );

  const { data: tags, isLoading: isLoadingTags } = useQuery(
    trpc.tags.get.queryOptions(),
  );

  const value = useMemo(
    () => ({
      teamMembers,
      tags,
      isLoadingMembers,
      isLoadingTags,
    }),
    [teamMembers, tags, isLoadingMembers, isLoadingTags],
  );

  return (
    <TransactionTableContext.Provider value={value}>
      {children}
    </TransactionTableContext.Provider>
  );
}

/**
 * Hook to access shared transaction table data.
 * Must be used within a TransactionTableProvider.
 */
export function useTransactionTableContext() {
  const context = useContext(TransactionTableContext);
  if (context === undefined) {
    throw new Error(
      "useTransactionTableContext must be used within a TransactionTableProvider",
    );
  }
  return context;
}

/**
 * Hook for optional usage - returns undefined if not within provider.
 * Useful for components that work both inside and outside the table.
 */
export function useTransactionTableContextOptional() {
  return useContext(TransactionTableContext);
}
