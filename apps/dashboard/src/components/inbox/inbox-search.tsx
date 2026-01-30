import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

const statusFilters = [
  { id: "all", name: "All" },
  { id: "done", name: "Matched" },
  { id: "pending", name: "Pending" },
  { id: "suggested_match", name: "Suggested Match" },
  { id: "no_match", name: "Unmatched" },
];

export function InboxSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { params: filterParams, setParams, hasFilter } = useInboxFilterParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep expanded if there's a search query
  const hasSearchQuery = Boolean(filterParams.q);

  useHotkeys(
    "esc",
    () => {
      if (filterParams.q) {
        setParams({ q: null });
      } else {
        setIsExpanded(false);
      }
    },
    {
      enableOnFormTags: true,
      enabled: isExpanded,
    },
  );

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !hasSearchQuery
      ) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded, hasSearchQuery]);

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;

    if (value) {
      setParams({ q: value });
    } else {
      setParams({ q: null });
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <AnimatePresence mode="wait">
        {isExpanded || hasSearchQuery ? (
          <motion.div
            key="expanded"
            initial={{ width: 36, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 36, opacity: 0 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
          >
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <form
                className="relative"
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                }}
              >
                <Icons.Search className="absolute pointer-events-none left-3 top-[11px]" />
                <Input
                  ref={inputRef}
                  placeholder="Search"
                  className="pl-9 w-full pr-9"
                  value={filterParams.q ?? ""}
                  onChange={handleSearch}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />

                <DropdownMenuTrigger asChild>
                  <button
                    onClick={() => setIsOpen((prev) => !prev)}
                    type="button"
                    className={cn(
                      "absolute z-10 right-3 top-[10px] opacity-50 transition-opacity duration-300 hover:opacity-100",
                      hasFilter && "opacity-100",
                      isOpen && "opacity-100",
                    )}
                  >
                    <Icons.Filter />
                  </button>
                </DropdownMenuTrigger>
              </form>

              <DropdownMenuContent
                className="w-[280px]"
                align="end"
                sideOffset={19}
                alignOffset={-11}
                side="bottom"
              >
                <DropdownMenuGroup>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Icons.ProjectStatus className="mr-2 h-4 w-4 rotate-180" />
                      <span>Status</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent
                        sideOffset={14}
                        alignOffset={-4}
                        className="p-0"
                      >
                        <DropdownMenuRadioGroup
                          value={filterParams.status ?? "all"}
                          onValueChange={(value) =>
                            setParams({
                              status:
                                value === "all"
                                  ? null
                                  : (value as
                                      | "done"
                                      | "pending"
                                      | "suggested_match"
                                      | "no_match"),
                            })
                          }
                        >
                          {statusFilters.map(({ id, name }) => (
                            <DropdownMenuRadioItem key={id} value={id}>
                              {name}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={handleExpand}
              className="size-[36px]"
            >
              <Icons.Search className="size-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
