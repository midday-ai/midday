import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useQueryState } from "nuqs";
import { InboxSearch } from "./inbox-search";
import { InboxSettingsModal } from "./modals/inbox-settings-modal";

type Props = {
  forwardEmail: string;
  inboxId: string;
  handleOnPaginate?: (direction: "down" | "up") => void;
  onChange?: (value: string | null) => void;
  onClear?: () => void;
};

export function InboxHeader({
  forwardEmail,
  inboxId,
  handleOnPaginate,
  onChange,
  onClear,
}: Props) {
  const [query, setQuery] = useQueryState("q", {
    shallow: true,
    defaultValue: "",
  });

  return (
    <div className="flex justify-center items-center space-x-4 mb-4">
      <TabsList>
        <TabsTrigger value="todo">Todo</TabsTrigger>
        <TabsTrigger value="done">Done</TabsTrigger>
      </TabsList>

      <InboxSearch
        onClear={onClear}
        onArrowDown={() => handleOnPaginate?.("down")}
        value={query}
        onChange={(value) => {
          setQuery(value);
          onChange?.(value);
        }}
      />

      <div className="flex space-x-2">
        <Button variant="outline" size="icon">
          <Icons.Sort size={16} />
        </Button>

        <InboxSettingsModal forwardEmail={forwardEmail} inboxId={inboxId} />
      </div>
    </div>
  );
}
