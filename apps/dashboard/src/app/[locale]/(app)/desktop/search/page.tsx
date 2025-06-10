"use client";

import { Search } from "@/components/search/search";
import { SearchFooter } from "@/components/search/search-footer";

export default function Page() {
  // Always render the search interface - authentication gating happens at Tauri level
  return (
    <div className="desktop-search flex flex-col h-full rounded-[10px] overflow-hidden border-b-[1px] border-border">
      <Search />
      <SearchFooter />
    </div>
  );
}
