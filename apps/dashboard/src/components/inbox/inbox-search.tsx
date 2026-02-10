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
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";

const statusFilters = [
  { id: "all", name: "All" },
  { id: "done", name: "Matched" },
  { id: "pending", name: "Pending" },
  { id: "suggested_match", name: "Suggested Match" },
  { id: "no_match", name: "Unmatched" },
];

export function InboxSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const { params: filterParams, setParams, hasFilter } = useInboxFilterParams();

  useHotkeys("esc", () => setParams({ q: null }), {
    enableOnFormTags: true,
    enabled: Boolean(filterParams.q),
  });

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;

    if (value) {
      setParams({ q: value });
    } else {
      setParams({ q: null });
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <form
        className="relative w-[280px]"
        onSubmit={(e) => {
          e.preventDefault();
          setIsOpen(false);
        }}
      >
        <Icons.Search className="absolute pointer-events-none left-3 top-[11px]" />
        <Input
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
  );
}
