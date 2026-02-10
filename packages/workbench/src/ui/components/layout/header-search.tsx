import { Search } from "lucide-react";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HeaderSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
}

export function HeaderSearch({
  value,
  onValueChange,
  onFocus,
  placeholder = "Search anything...",
  className,
}: HeaderSearchProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      onFocus?.();
    }
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-2 h-4 w-4 text-foreground/60 pointer-events-none" />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-8 w-64 pl-8 pr-20 text-[10px] bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !text-foreground placeholder:text-foreground/30"
      />
      <kbd className="absolute right-2 hidden h-5 items-center gap-1 rounded-none border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex pointer-events-none">
        <span className="text-xs">⌘</span>K
      </kbd>
    </div>
  );
}
