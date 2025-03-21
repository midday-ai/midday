"use client";

import { createClient } from "@midday/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

interface SupabaseContextProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that makes the Supabase client available to the query and mutation procedures
 */
export function SupabaseContextProvider({
  children,
}: SupabaseContextProviderProps) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Store the Supabase client in the query client cache
  useEffect(() => {
    queryClient.setQueryData(["context"], { supabase });

    // Clean up context when component unmounts
    return () => {
      queryClient.removeQueries({ queryKey: ["context"] });
    };
  }, [queryClient, supabase]);

  return <>{children}</>;
}
