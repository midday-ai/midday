"use client";

import { Search } from "@/components/search/search";
import { SearchFooter } from "@/components/search/search-footer";
import { createClient } from "@midday/supabase/client";
import { useState } from "react";
import { useEffect } from "react";

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      setTimeout(async () => {
        if (event === "SIGNED_IN") {
          setIsLoggedIn(true);
        } else if (event === "SIGNED_OUT") {
          setIsLoggedIn(false);
        }
      }, 0);
    });
  }, [supabase]);

  if (!isLoggedIn) {
    return <div>Not logged in</div>;
  }

  return (
    <div className="desktop-search flex flex-col h-full rounded-[10px] overflow-hidden border border-border">
      <Search />
      <SearchFooter />
    </div>
  );
}
