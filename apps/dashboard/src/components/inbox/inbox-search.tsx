import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useHotkeys } from "react-hotkeys-hook";

export function InboxSearch() {
  const { params, setParams } = useInboxFilterParams();

  useHotkeys("esc", () => setParams({ q: null }), {
    enableOnFormTags: true,
    enabled: Boolean(params.q),
  });

  return (
    <div className="relative w-full">
      <Icons.Search className="w-[18px] h-[18px] absolute left-2 top-[10px] pointer-events-none" />
      <Input
        placeholder="Search inbox"
        onKeyDown={(evt) => {
          if (evt.key === "ArrowDown") {
            // @ts-ignore
            evt.target?.blur();
            evt.preventDefault();
            // onArrowDown?.();
          }
        }}
        className="pl-8"
        value={params.q ?? ""}
        onChange={(evt) => {
          const value = evt.target.value;
          setParams({ q: value.length ? value : null });
        }}
      />

      {params.q && (
        <Icons.Close
          className="w-[18px] h-[18px] top-[9px] absolute right-2"
          onClick={() => setParams({ q: null })}
        />
      )}
    </div>
  );
}
