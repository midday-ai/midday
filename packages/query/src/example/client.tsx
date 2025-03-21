"use client";

import { createClient } from "@midday/supabase/server";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getTransactions } from "../queries/transactions";

export function ExampleClient() {
  const supabase = createClient();
  const { data } = useSuspenseQuery({
    queryKey: ["transactions"],
    queryFn: () => getTransactions(supabase),
  });

  console.log(data);

  return <div>ExampleClient</div>;
}
