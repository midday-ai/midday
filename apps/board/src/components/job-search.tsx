"use client";

import { Input } from "@midday/ui/input";
import { useEffect, useRef, useState } from "react";

interface JobSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function JobSearch({
  onSearch,
  placeholder = "Search jobs...",
}: JobSearchProps) {
  const [query, setQuery] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="w-full">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
      />
    </div>
  );
}
