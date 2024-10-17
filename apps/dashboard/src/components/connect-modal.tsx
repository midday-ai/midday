"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ConnectModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("q", searchQuery);
    // Ensure we keep the 'step' parameter
    if (!current.has("step")) {
      current.set("step", "connect");
    }
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${window.location.pathname}${query}`);
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a bank..."
        />
        <button type="submit">Search</button>
      </form>
      {/* Rest of your modal content */}
    </div>
  );
}
